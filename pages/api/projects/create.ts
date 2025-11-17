import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/cockroachDB/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { geocodeAddress } from '@/lib/utils/geocoding'
import { uploadProjectImage, uploadMultipleProjectImages } from '@/lib/utils/vercel-blob'

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const session = await getServerSession(req, res, authOptions)

    if (!session?.user?.id) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const {
      name,
      description,
      type,
      builderId,
      builderWebsiteLink,
      brochureUrl,
      brochurePdfBase64,
      locationAddress,
      bannerImageBase64,
      highlights,
      amenities,
      floorplanImagesBase64,
      clubhouseImagesBase64,
      galleryImagesBase64,
      walkthroughVideoUrl,
    } = req.body

    // Validate required fields
    if (!name || !description || !builderId || !locationAddress) {
      return res.status(400).json({ message: 'Missing required fields' })
    }

    // Verify builder exists
    const builder = await prisma.builder.findUnique({
      where: { id: builderId },
    })

    if (!builder) {
      return res.status(400).json({ message: 'Invalid builder ID' })
    }

    // Geocode location
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
    } else {
      return res.status(400).json({ message: 'Could not geocode the provided address' })
    }

    // Upload images and PDF to Vercel Blob
    let bannerUrl: string | null = null
    let floorplanUrls: string[] = []
    let clubhouseUrls: string[] = []
    let galleryUrls: string[] = []
    let brochurePdfUrl: string | null = null

    try {
      // Upload banner image
      if (bannerImageBase64) {
        bannerUrl = await uploadProjectImage({
          projectName: name,
          folder: 'banner',
          base64Image: bannerImageBase64,
        })
      }

      // Upload brochure PDF
      if (brochurePdfBase64) {
        const { put } = await import('@vercel/blob')
        const base64Data = brochurePdfBase64.split(',')[1]
        const buffer = Buffer.from(base64Data, 'base64')
        const normalizedProjectName = name
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '')
        const filename = `hyderabad-projects/${normalizedProjectName}/brochure.pdf`

        const blob = await put(filename, buffer, {
          access: 'public',
          contentType: 'application/pdf',
        })

        brochurePdfUrl = blob.url
      }

      // Upload floorplan images (max 20)
      if (floorplanImagesBase64 && Array.isArray(floorplanImagesBase64)) {
        const floorplanImages = floorplanImagesBase64.slice(0, 20)
        floorplanUrls = await uploadMultipleProjectImages(name, 'floorplans', floorplanImages)
      }

      // Upload clubhouse images (max 10)
      if (clubhouseImagesBase64 && Array.isArray(clubhouseImagesBase64)) {
        const clubhouseImages = clubhouseImagesBase64.slice(0, 10)
        clubhouseUrls = await uploadMultipleProjectImages(name, 'clubhouse', clubhouseImages)
      }

      // Upload gallery images (max 20)
      if (galleryImagesBase64 && Array.isArray(galleryImagesBase64)) {
        const galleryImages = galleryImagesBase64.slice(0, 20)
        galleryUrls = await uploadMultipleProjectImages(name, 'gallery', galleryImages)
      }
    } catch (uploadError) {
      // eslint-disable-next-line no-console
      console.error('Image/PDF upload error:', uploadError)
      return res.status(500).json({ message: 'Failed to upload images or PDF' })
    }

    // Create project
    const project = await prisma.project.create({
      data: {
        name,
        description,
        type: type || 'RESIDENTIAL',
        builderId,
        locationId: locationRecord.id,
        postedByUserId: session.user.id,
        builderWebsiteLink: builderWebsiteLink || null,
        brochureUrl: brochurePdfUrl || brochureUrl || null,
        bannerImageUrl: bannerUrl,
        highlights: highlights || null,
        amenities: amenities || null,
        floorplanImageUrls: floorplanUrls,
        clubhouseImageUrls: clubhouseUrls,
        galleryImageUrls: galleryUrls,
        imageUrls: [...floorplanUrls, ...clubhouseUrls, ...galleryUrls],
        thumbnailUrl: bannerUrl || galleryUrls[0] || null,
        walkthroughVideoUrl: walkthroughVideoUrl || null,
        isArchived: false,
      },
      include: {
        location: true,
        builder: true,
      },
    })

    res.status(201).json({
      message: 'Project created successfully',
      project,
    })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Create project error:', error)
    res.status(500).json({
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    })
  }
}
