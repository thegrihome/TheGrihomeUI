import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/cockroachDB/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { geocodeAddress } from '@/lib/utils/geocoding'
import { uploadProjectImage, uploadMultipleProjectImages } from '@/lib/utils/vercel-blob'
import { checkUserVerification } from '@/lib/utils/verify-user'
import { del } from '@vercel/blob'

// Helper to process images: separate existing URLs from new base64, find orphaned images
function processImages(
  allImages: string[] | undefined,
  existingDbUrls: string[]
): {
  urlsToKeep: string[]
  newBase64: string[]
  orphanedUrls: string[]
} {
  if (!allImages || !Array.isArray(allImages)) {
    // If no images sent, all existing are orphaned
    return { urlsToKeep: [], newBase64: [], orphanedUrls: existingDbUrls }
  }

  const urlsToKeep = allImages.filter(img => img.startsWith('http'))
  const newBase64 = allImages.filter(img => img.startsWith('data:image'))
  const orphanedUrls = existingDbUrls.filter(url => !urlsToKeep.includes(url))

  return { urlsToKeep, newBase64, orphanedUrls }
}

// Helper to delete orphaned images from blob storage
async function deleteOrphanedImages(urls: string[]): Promise<void> {
  for (const url of urls) {
    try {
      await del(url)
    } catch (error) {
      // Log but don't fail - image might already be deleted
      // eslint-disable-next-line no-console
      console.warn('Failed to delete orphaned image:', url, error)
    }
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '4mb', // Small payload - images are uploaded directly to blob storage
    },
  },
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const session = await getServerSession(req, res, authOptions)

    if (!session?.user?.id) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    // Check verification status
    const verificationCheck = await checkUserVerification(session.user.id)
    if (!verificationCheck.isVerified) {
      return res.status(403).json({ message: verificationCheck.message })
    }

    const {
      projectId,
      name,
      description,
      type,
      builderId,
      builderWebsiteLink,
      brochureUrl,
      brochurePdfBase64,
      locationAddress,
      googleMapsUrl,
      // New format: all images (URLs to keep + new base64)
      bannerImages,
      floorplanImages,
      clubhouseImages,
      galleryImages,
      siteLayoutImages,
      // Legacy format (for backwards compatibility)
      bannerImageBase64,
      floorplanImagesBase64,
      clubhouseImagesBase64,
      galleryImagesBase64,
      siteLayoutImagesBase64,
      highlights,
      amenities,
      walkthroughVideoUrl,
    } = req.body

    // Validate required fields
    if (!projectId || !name || !description || !builderId || (!locationAddress && !googleMapsUrl)) {
      return res.status(400).json({ message: 'Missing required fields' })
    }

    // Find the project
    const existingProject = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        location: true,
      },
    })

    if (!existingProject) {
      return res.status(404).json({ message: 'Project not found' })
    }

    // Check if user is the owner
    if (existingProject.postedByUserId !== session.user.id) {
      return res.status(403).json({ message: 'You do not have permission to edit this project' })
    }

    // Verify builder exists
    const builder = await prisma.builder.findUnique({
      where: { id: builderId },
    })

    if (!builder) {
      return res.status(400).json({ message: 'Invalid builder ID' })
    }

    // Geocode location if changed
    let locationId = existingProject.locationId
    // Type assertion for included location relation
    const currentLocation = (existingProject as any).location

    if (locationAddress && locationAddress !== currentLocation?.formattedAddress) {
      const geocodeResult = await geocodeAddress(locationAddress)
      let locationRecord

      if (geocodeResult) {
        const tolerance = 0.0001
        locationRecord = await prisma.location.findFirst({
          where: {
            latitude: {
              gte: geocodeResult.latitude - tolerance,
              lte: geocodeResult.latitude + tolerance,
            },
            longitude: {
              gte: geocodeResult.longitude - tolerance,
              lte: geocodeResult.longitude + tolerance,
            },
          },
        })

        if (!locationRecord) {
          locationRecord = await prisma.location.create({
            data: {
              city: geocodeResult.city,
              state: geocodeResult.state,
              country: geocodeResult.country || 'India',
              zipcode: geocodeResult.zipcode,
              locality: geocodeResult.locality,
              neighborhood: geocodeResult.neighborhood,
              latitude: geocodeResult.latitude,
              longitude: geocodeResult.longitude,
              formattedAddress: geocodeResult.formattedAddress,
            },
          })
        }

        locationId = locationRecord.id
      }
    } else if (!locationAddress && googleMapsUrl) {
      // Only Google Maps URL provided - create a basic location for Hyderabad if not exists
      let locationRecord = await prisma.location.findFirst({
        where: {
          city: 'Hyderabad',
          state: 'Telangana',
        },
      })

      if (!locationRecord) {
        locationRecord = await prisma.location.create({
          data: {
            city: 'Hyderabad',
            state: 'Telangana',
            country: 'India',
            formattedAddress: 'Hyderabad, Telangana, India',
          },
        })
      }

      locationId = locationRecord.id
    }

    // Handle image and PDF uploads
    let bannerUrl: string | null = existingProject.bannerImageUrl
    let floorplanUrls: string[] = existingProject.floorplanImageUrls || []
    let clubhouseUrls: string[] = existingProject.clubhouseImageUrls || []
    let galleryUrls: string[] = existingProject.galleryImageUrls || []
    let siteLayoutUrls: string[] = existingProject.siteLayoutImageUrls || []
    let brochurePdfUrl: string | null = null

    // Collect all orphaned images to delete after successful update
    const allOrphanedUrls: string[] = []

    try {
      // Handle banner image (new format or legacy)
      if (bannerImages !== undefined) {
        // New format: array of images (URLs to keep + new base64)
        const bannerProcess = processImages(
          bannerImages,
          existingProject.bannerImageUrl ? [existingProject.bannerImageUrl] : []
        )
        allOrphanedUrls.push(...bannerProcess.orphanedUrls)

        if (bannerProcess.newBase64.length > 0) {
          // Upload new banner
          bannerUrl = await uploadProjectImage({
            projectName: name,
            folder: 'banner',
            base64Image: bannerProcess.newBase64[0],
          })
        } else if (bannerProcess.urlsToKeep.length > 0) {
          // Keep existing banner
          bannerUrl = bannerProcess.urlsToKeep[0]
        } else {
          // No banner - user removed it
          bannerUrl = null
        }
      } else if (bannerImageBase64 && bannerImageBase64.startsWith('data:image')) {
        // Legacy format: just base64
        bannerUrl = await uploadProjectImage({
          projectName: name,
          folder: 'banner',
          base64Image: bannerImageBase64,
        })
      }

      // Upload brochure PDF if provided
      if (brochurePdfBase64) {
        const { put } = await import('@vercel/blob')
        const base64Data = brochurePdfBase64.split(',')[1]
        const buffer = Buffer.from(base64Data, 'base64')
        const normalizedProjectName = name
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '')
        const filename = `projects/${normalizedProjectName}/brochure.pdf`

        const blob = await put(filename, buffer, {
          access: 'public',
          contentType: 'application/pdf',
        })

        brochurePdfUrl = blob.url
      }

      // Handle floorplan images (new format or legacy)
      if (floorplanImages !== undefined) {
        const floorplanProcess = processImages(
          floorplanImages,
          existingProject.floorplanImageUrls || []
        )
        allOrphanedUrls.push(...floorplanProcess.orphanedUrls)

        let newUrls: string[] = []
        if (floorplanProcess.newBase64.length > 0) {
          newUrls = await uploadMultipleProjectImages(
            name,
            'floorplans',
            floorplanProcess.newBase64.slice(0, 50)
          )
        }
        floorplanUrls = [...floorplanProcess.urlsToKeep, ...newUrls].slice(0, 50)
      } else if (floorplanImagesBase64?.length > 0) {
        // Legacy format
        const newFloorplans = floorplanImagesBase64.filter((img: string) =>
          img.startsWith('data:image')
        )
        if (newFloorplans.length > 0) {
          const newUrls = await uploadMultipleProjectImages(
            name,
            'floorplans',
            newFloorplans.slice(0, 50)
          )
          floorplanUrls = [...floorplanUrls, ...newUrls].slice(0, 50)
        }
      }

      // Handle clubhouse images (new format or legacy)
      if (clubhouseImages !== undefined) {
        const clubhouseProcess = processImages(
          clubhouseImages,
          existingProject.clubhouseImageUrls || []
        )
        allOrphanedUrls.push(...clubhouseProcess.orphanedUrls)

        let newUrls: string[] = []
        if (clubhouseProcess.newBase64.length > 0) {
          newUrls = await uploadMultipleProjectImages(
            name,
            'clubhouse',
            clubhouseProcess.newBase64.slice(0, 50)
          )
        }
        clubhouseUrls = [...clubhouseProcess.urlsToKeep, ...newUrls].slice(0, 50)
      } else if (clubhouseImagesBase64?.length > 0) {
        // Legacy format
        const newClubhouse = clubhouseImagesBase64.filter((img: string) =>
          img.startsWith('data:image')
        )
        if (newClubhouse.length > 0) {
          const newUrls = await uploadMultipleProjectImages(
            name,
            'clubhouse',
            newClubhouse.slice(0, 50)
          )
          clubhouseUrls = [...clubhouseUrls, ...newUrls].slice(0, 50)
        }
      }

      // Handle gallery images (new format or legacy)
      if (galleryImages !== undefined) {
        const galleryProcess = processImages(galleryImages, existingProject.galleryImageUrls || [])
        allOrphanedUrls.push(...galleryProcess.orphanedUrls)

        let newUrls: string[] = []
        if (galleryProcess.newBase64.length > 0) {
          newUrls = await uploadMultipleProjectImages(
            name,
            'gallery',
            galleryProcess.newBase64.slice(0, 50)
          )
        }
        galleryUrls = [...galleryProcess.urlsToKeep, ...newUrls].slice(0, 50)
      } else if (galleryImagesBase64?.length > 0) {
        // Legacy format
        const newGallery = galleryImagesBase64.filter((img: string) => img.startsWith('data:image'))
        if (newGallery.length > 0) {
          const newUrls = await uploadMultipleProjectImages(
            name,
            'gallery',
            newGallery.slice(0, 50)
          )
          galleryUrls = [...galleryUrls, ...newUrls].slice(0, 50)
        }
      }

      // Handle site layout images (new format or legacy)
      if (siteLayoutImages !== undefined) {
        const siteLayoutProcess = processImages(
          siteLayoutImages,
          existingProject.siteLayoutImageUrls || []
        )
        allOrphanedUrls.push(...siteLayoutProcess.orphanedUrls)

        let newUrls: string[] = []
        if (siteLayoutProcess.newBase64.length > 0) {
          newUrls = await uploadMultipleProjectImages(
            name,
            'sitelayout',
            siteLayoutProcess.newBase64.slice(0, 50)
          )
        }
        siteLayoutUrls = [...siteLayoutProcess.urlsToKeep, ...newUrls].slice(0, 50)
      } else if (siteLayoutImagesBase64?.length > 0) {
        // Legacy format
        const newSiteLayout = siteLayoutImagesBase64.filter((img: string) =>
          img.startsWith('data:image')
        )
        if (newSiteLayout.length > 0) {
          const newUrls = await uploadMultipleProjectImages(
            name,
            'sitelayout',
            newSiteLayout.slice(0, 50)
          )
          siteLayoutUrls = [...siteLayoutUrls, ...newUrls].slice(0, 50)
        }
      }
    } catch (uploadError) {
      // eslint-disable-next-line no-console
      console.error('Image/PDF upload error:', uploadError)
      return res.status(500).json({ message: 'Failed to upload images or PDF' })
    }

    // Update project
    const project = await prisma.project.update({
      where: { id: projectId },
      data: {
        name,
        description,
        type: type || 'RESIDENTIAL',
        builderId,
        locationId,
        builderWebsiteLink: builderWebsiteLink || null,
        brochureUrl: brochurePdfUrl || brochureUrl || existingProject.brochureUrl,
        googlePin: googleMapsUrl || existingProject.googlePin,
        bannerImageUrl: bannerUrl,
        highlights: highlights || null,
        amenities: amenities || null,
        floorplanImageUrls: floorplanUrls,
        clubhouseImageUrls: clubhouseUrls,
        galleryImageUrls: galleryUrls,
        siteLayoutImageUrls: siteLayoutUrls,
        imageUrls: [...floorplanUrls, ...clubhouseUrls, ...galleryUrls, ...siteLayoutUrls],
        thumbnailUrl: bannerUrl || galleryUrls[0] || existingProject.thumbnailUrl,
        walkthroughVideoUrl: walkthroughVideoUrl || null,
      },
      include: {
        location: true,
        builder: true,
      },
    })

    // Delete orphaned images from blob storage (after successful DB update)
    if (allOrphanedUrls.length > 0) {
      // Run deletion in background - don't block the response
      deleteOrphanedImages(allOrphanedUrls).catch(err => {
        // eslint-disable-next-line no-console
        console.error('Failed to delete some orphaned images:', err)
      })
    }

    res.status(200).json({
      message: 'Project updated successfully',
      project,
    })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Update project error:', error)
    res.status(500).json({
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    })
  }
}
