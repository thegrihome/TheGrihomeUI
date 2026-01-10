import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/cockroachDB/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { geocodeAddress } from '@/lib/utils/geocoding'
import {
  uploadProjectImage,
  uploadMultipleProjectImages,
  deleteBlobs,
} from '@/lib/utils/vercel-blob'
import { checkUserVerification } from '@/lib/utils/verify-user'

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '4mb', // Small payload - images are uploaded directly to blob storage
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

    // Check verification status
    const verificationCheck = await checkUserVerification(session.user.id)
    if (!verificationCheck.isVerified) {
      return res.status(403).json({ message: verificationCheck.message })
    }

    const {
      name,
      description,
      propertyType,
      builderId,
      brochureUrl,
      brochurePdfBase64,
      locationAddress,
      googleMapsUrl,
      // URL-based fields (from direct blob uploads)
      bannerImageUrl,
      floorplanImageUrls,
      clubhouseImageUrls,
      galleryImageUrls,
      siteLayoutImageUrls,
      // Legacy base64 fields (for backward compatibility)
      bannerImageBase64,
      floorplanImagesBase64,
      clubhouseImagesBase64,
      galleryImagesBase64,
      siteLayoutImagesBase64,
      highlights,
      amenities,
      walkthroughVideoUrls,
    } = req.body

    // Validate required fields with specific error messages
    if (!name) {
      return res.status(400).json({ message: 'Missing required field: Project name is required' })
    }
    if (!description) {
      return res.status(400).json({ message: 'Missing required field: Description is required' })
    }
    if (!builderId) {
      return res.status(400).json({ message: 'Missing required field: Builder is required' })
    }
    if (!locationAddress && !googleMapsUrl) {
      return res.status(400).json({
        message: 'Missing required field: Location address or Google Maps URL is required',
      })
    }

    // Verify builder exists
    const builder = await prisma.builder.findUnique({
      where: { id: builderId },
    })

    if (!builder) {
      return res.status(400).json({ message: 'Invalid builder ID' })
    }

    // Geocode location - use locationAddress if provided, otherwise create a basic location
    let locationRecord

    if (locationAddress) {
      const geocodeResult = await geocodeAddress(locationAddress)

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
              parentCity: geocodeResult.parentCity,
              latitude: geocodeResult.latitude,
              longitude: geocodeResult.longitude,
              formattedAddress: geocodeResult.formattedAddress,
            },
          })
        }
      } else {
        return res.status(400).json({ message: 'Could not geocode the provided address' })
      }
    } else {
      // Only Google Maps URL provided - create a basic location for Hyderabad
      locationRecord = await prisma.location.findFirst({
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
    }

    // Handle images - prefer pre-uploaded URLs, fall back to base64 upload
    let bannerUrl: string | null = bannerImageUrl || null
    let floorplanUrls: string[] = floorplanImageUrls || []
    let clubhouseUrls: string[] = clubhouseImageUrls || []
    let galleryUrls: string[] = galleryImageUrls || []
    let siteLayoutUrls: string[] = siteLayoutImageUrls || []

    // Track URLs uploaded via base64 (legacy) for cleanup on failure
    const base64UploadedUrls: string[] = []

    // Helper to collect all base64-uploaded URLs for cleanup
    const getUploadedUrls = () => base64UploadedUrls

    // Only do server-side uploads if base64 data is provided (legacy flow)
    try {
      // Upload banner image (legacy base64 flow)
      if (!bannerUrl && bannerImageBase64) {
        bannerUrl = await uploadProjectImage({
          projectName: name,
          folder: 'banner',
          base64Image: bannerImageBase64,
        })
        base64UploadedUrls.push(bannerUrl)
      }

      // Upload floorplan images (legacy base64 flow, max 20)
      if (
        floorplanUrls.length === 0 &&
        floorplanImagesBase64 &&
        Array.isArray(floorplanImagesBase64)
      ) {
        const floorplanImages = floorplanImagesBase64.slice(0, 50)
        floorplanUrls = await uploadMultipleProjectImages(name, 'floorplans', floorplanImages)
        base64UploadedUrls.push(...floorplanUrls)
      }

      // Upload clubhouse images (legacy base64 flow, max 10)
      if (
        clubhouseUrls.length === 0 &&
        clubhouseImagesBase64 &&
        Array.isArray(clubhouseImagesBase64)
      ) {
        const clubhouseImages = clubhouseImagesBase64.slice(0, 50)
        clubhouseUrls = await uploadMultipleProjectImages(name, 'clubhouse', clubhouseImages)
        base64UploadedUrls.push(...clubhouseUrls)
      }

      // Upload gallery images (legacy base64 flow, max 20)
      if (galleryUrls.length === 0 && galleryImagesBase64 && Array.isArray(galleryImagesBase64)) {
        const galleryImages = galleryImagesBase64.slice(0, 50)
        galleryUrls = await uploadMultipleProjectImages(name, 'gallery', galleryImages)
        base64UploadedUrls.push(...galleryUrls)
      }

      // Upload site layout images (legacy base64 flow, max 10)
      if (
        siteLayoutUrls.length === 0 &&
        siteLayoutImagesBase64 &&
        Array.isArray(siteLayoutImagesBase64)
      ) {
        const siteLayoutImages = siteLayoutImagesBase64.slice(0, 50)
        siteLayoutUrls = await uploadMultipleProjectImages(name, 'sitelayout', siteLayoutImages)
        base64UploadedUrls.push(...siteLayoutUrls)
      }
    } catch (uploadError) {
      // Upload failed midway - clean up any already uploaded blobs (only base64 uploads)
      // eslint-disable-next-line no-console
      console.error('Upload error, cleaning up partial uploads:', uploadError)
      await deleteBlobs(getUploadedUrls())
      return res.status(500).json({ message: 'Failed to upload files' })
    }

    // Upload brochure PDF if provided
    let brochurePdfUrl: string | null = null
    if (brochurePdfBase64) {
      try {
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
        base64UploadedUrls.push(brochurePdfUrl)
      } catch (pdfError) {
        // eslint-disable-next-line no-console
        console.error('Brochure PDF upload error:', pdfError)
        await deleteBlobs(getUploadedUrls())
        return res.status(500).json({ message: 'Failed to upload brochure PDF' })
      }
    }

    // Create project - wrap in try-catch for cleanup on failure
    try {
      const project = await prisma.project.create({
        data: {
          name,
          description,
          propertyType: propertyType || null,
          builderId,
          locationId: locationRecord.id,
          postedByUserId: session.user.id,
          brochureUrl: brochurePdfUrl || brochureUrl || null,
          bannerImageUrl: bannerUrl,
          googlePin: googleMapsUrl || null,
          highlights: highlights || null,
          amenities: amenities || null,
          floorplanImageUrls: floorplanUrls,
          clubhouseImageUrls: clubhouseUrls,
          galleryImageUrls: galleryUrls,
          siteLayoutImageUrls: siteLayoutUrls,
          imageUrls: [...floorplanUrls, ...clubhouseUrls, ...galleryUrls, ...siteLayoutUrls],
          thumbnailUrl: bannerUrl || galleryUrls[0] || null,
          walkthroughVideoUrl:
            walkthroughVideoUrls && walkthroughVideoUrls.length > 0
              ? walkthroughVideoUrls[0]
              : null,
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
    } catch (dbError) {
      // Database insert failed - clean up uploaded blobs
      // eslint-disable-next-line no-console
      console.error('Database insert failed, cleaning up uploaded blobs:', dbError)
      await deleteBlobs(getUploadedUrls())

      // Provide more specific error messages
      if (dbError instanceof Error) {
        if (dbError.message.includes('Unique constraint')) {
          return res.status(400).json({ message: 'A project with this name may already exist' })
        }
        if (dbError.message.includes('Foreign key constraint')) {
          return res.status(400).json({ message: 'Invalid builder or location reference' })
        }
      }

      return res.status(500).json({
        message: 'Failed to create project. Please try again.',
        error: process.env.NODE_ENV === 'development' ? String(dbError) : undefined,
      })
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error('Create project error:', error)
    }

    res.status(500).json({
      message: 'Failed to create project. Please try again.',
      error: process.env.NODE_ENV === 'development' ? String(error) : undefined,
    })
  }
}
