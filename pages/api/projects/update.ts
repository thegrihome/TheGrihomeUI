import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/cockroachDB/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { geocodeAddress } from '@/lib/utils/geocoding'
import { uploadProjectImage, uploadMultipleProjectImages } from '@/lib/utils/vercel-blob'
import { checkUserVerification } from '@/lib/utils/verify-user'

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1gb', // For image and PDF uploads (max 60 images at 10MB each + overhead)
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
      bannerImageBase64,
      highlights,
      amenities,
      floorplanImagesBase64,
      clubhouseImagesBase64,
      galleryImagesBase64,
      siteLayoutImagesBase64,
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

    try {
      // Upload new banner image if provided
      if (bannerImageBase64 && bannerImageBase64.startsWith('data:image')) {
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

      // Upload new floorplan images if provided
      if (
        floorplanImagesBase64 &&
        Array.isArray(floorplanImagesBase64) &&
        floorplanImagesBase64.length > 0
      ) {
        const newFloorplans = floorplanImagesBase64.filter((img: string) =>
          img.startsWith('data:image')
        )
        if (newFloorplans.length > 0) {
          const newUrls = await uploadMultipleProjectImages(
            name,
            'floorplans',
            newFloorplans.slice(0, 20)
          )
          floorplanUrls = [...floorplanUrls, ...newUrls].slice(0, 20)
        }
      }

      // Upload new clubhouse images if provided
      if (
        clubhouseImagesBase64 &&
        Array.isArray(clubhouseImagesBase64) &&
        clubhouseImagesBase64.length > 0
      ) {
        const newClubhouse = clubhouseImagesBase64.filter((img: string) =>
          img.startsWith('data:image')
        )
        if (newClubhouse.length > 0) {
          const newUrls = await uploadMultipleProjectImages(
            name,
            'clubhouse',
            newClubhouse.slice(0, 10)
          )
          clubhouseUrls = [...clubhouseUrls, ...newUrls].slice(0, 10)
        }
      }

      // Upload new gallery images if provided
      if (
        galleryImagesBase64 &&
        Array.isArray(galleryImagesBase64) &&
        galleryImagesBase64.length > 0
      ) {
        const newGallery = galleryImagesBase64.filter((img: string) => img.startsWith('data:image'))
        if (newGallery.length > 0) {
          const newUrls = await uploadMultipleProjectImages(
            name,
            'gallery',
            newGallery.slice(0, 20)
          )
          galleryUrls = [...galleryUrls, ...newUrls].slice(0, 20)
        }
      }

      // Upload new site layout images if provided
      if (
        siteLayoutImagesBase64 &&
        Array.isArray(siteLayoutImagesBase64) &&
        siteLayoutImagesBase64.length > 0
      ) {
        const newSiteLayout = siteLayoutImagesBase64.filter((img: string) =>
          img.startsWith('data:image')
        )
        if (newSiteLayout.length > 0) {
          const newUrls = await uploadMultipleProjectImages(
            name,
            'sitelayout',
            newSiteLayout.slice(0, 10)
          )
          siteLayoutUrls = [...siteLayoutUrls, ...newUrls].slice(0, 10)
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
