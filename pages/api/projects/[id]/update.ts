import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/cockroachDB/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]'
import { geocodeAddress } from '@/lib/utils/geocoding'
import { uploadProjectImage, uploadMultipleProjectImages } from '@/lib/utils/vercel-blob'

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

    const { id } = req.query

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ message: 'Project ID is required' })
    }

    // Check if project exists and user owns it
    const existingProject = await prisma.project.findUnique({
      where: { id },
      select: {
        postedByUserId: true,
        name: true,
        bannerImageUrl: true,
        floorplanImageUrls: true,
        clubhouseImageUrls: true,
        galleryImageUrls: true,
      },
    })

    if (!existingProject) {
      return res.status(404).json({ message: 'Project not found' })
    }

    if (existingProject.postedByUserId !== session.user.id) {
      return res.status(403).json({ message: 'You do not have permission to edit this project' })
    }

    const {
      name,
      description,
      type,
      builderId,
      builderWebsiteLink,
      brochureUrl,
      locationAddress,
      bannerImageBase64,
      highlights,
      amenities,
      floorplanImagesBase64,
      clubhouseImagesBase64,
      galleryImagesBase64,
      walkthroughVideoUrl,
      keepExistingImages,
    } = req.body

    // Validate required fields
    if (!name || !description || !builderId) {
      return res.status(400).json({ message: 'Missing required fields' })
    }

    // Verify builder exists
    const builder = await prisma.builder.findUnique({
      where: { id: builderId },
    })

    if (!builder) {
      return res.status(400).json({ message: 'Invalid builder ID' })
    }

    // Handle location update if address changed
    let locationId = undefined
    if (locationAddress) {
      const geocodeResult = await geocodeAddress(locationAddress)

      if (geocodeResult) {
        const tolerance = 0.0001
        let locationRecord = await prisma.location.findFirst({
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
    }

    // Handle image uploads - only upload new images
    let bannerUrl = keepExistingImages?.banner ? existingProject.bannerImageUrl : null
    let floorplanUrls = keepExistingImages?.floorplans ? existingProject.floorplanImageUrls : []
    let clubhouseUrls = keepExistingImages?.clubhouse ? existingProject.clubhouseImageUrls : []
    let galleryUrls = keepExistingImages?.gallery ? existingProject.galleryImageUrls : []

    try {
      // Upload new banner if provided
      if (bannerImageBase64 && bannerImageBase64.startsWith('data:image')) {
        bannerUrl = await uploadProjectImage({
          projectName: name,
          folder: 'banner',
          base64Image: bannerImageBase64,
        })
      }

      // Upload new floorplan images if provided
      if (
        floorplanImagesBase64 &&
        Array.isArray(floorplanImagesBase64) &&
        floorplanImagesBase64.length > 0
      ) {
        const newFloorplans = await uploadMultipleProjectImages(
          name,
          'floorplans',
          floorplanImagesBase64.slice(0, 50)
        )
        floorplanUrls = [...floorplanUrls, ...newFloorplans].slice(0, 50)
      }

      // Upload new clubhouse images if provided
      if (
        clubhouseImagesBase64 &&
        Array.isArray(clubhouseImagesBase64) &&
        clubhouseImagesBase64.length > 0
      ) {
        const newClubhouse = await uploadMultipleProjectImages(
          name,
          'clubhouse',
          clubhouseImagesBase64.slice(0, 50)
        )
        clubhouseUrls = [...clubhouseUrls, ...newClubhouse].slice(0, 50)
      }

      // Upload new gallery images if provided
      if (
        galleryImagesBase64 &&
        Array.isArray(galleryImagesBase64) &&
        galleryImagesBase64.length > 0
      ) {
        const newGallery = await uploadMultipleProjectImages(
          name,
          'gallery',
          galleryImagesBase64.slice(0, 50)
        )
        galleryUrls = [...galleryUrls, ...newGallery].slice(0, 50)
      }
    } catch (uploadError) {
      // eslint-disable-next-line no-console
      console.error('Image upload error:', uploadError)
      return res.status(500).json({ message: 'Failed to upload images' })
    }

    // Update project
    const updateData: any = {
      name,
      description,
      type: type || 'RESIDENTIAL',
      builderId,
      builderWebsiteLink: builderWebsiteLink || null,
      brochureUrl: brochureUrl || null,
      bannerImageUrl: bannerUrl,
      highlights: highlights || null,
      amenities: amenities || null,
      floorplanImageUrls: floorplanUrls,
      clubhouseImageUrls: clubhouseUrls,
      galleryImageUrls: galleryUrls,
      imageUrls: [...floorplanUrls, ...clubhouseUrls, ...galleryUrls],
      thumbnailUrl: bannerUrl || galleryUrls[0] || null,
      walkthroughVideoUrl: walkthroughVideoUrl || null,
    }

    if (locationId) {
      updateData.locationId = locationId
    }

    const updatedProject = await prisma.project.update({
      where: { id },
      data: updateData,
      include: {
        location: true,
        builder: true,
      },
    })

    res.status(200).json({
      message: 'Project updated successfully',
      project: updatedProject,
    })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Update project error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}
