import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/cockroachDB/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]'
import { generateSearchText } from '@/lib/utils/property-search'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return handleGet(req, res)
  } else if (req.method === 'PUT') {
    return handleUpdate(req, res)
  } else {
    return res.status(405).json({ message: 'Method not allowed' })
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ message: 'Property ID is required' })
    }

    // Get property with related data
    const property = await prisma.property.findUnique({
      where: {
        id: id,
      },
      include: {
        location: true,
        builder: true,
        project: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        interests: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        soldToUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    if (!property) {
      return res.status(404).json({ message: 'Property not found' })
    }

    // Transform the data to match the frontend interface
    const propertyDetails = property.propertyDetails as any

    const transformedProperty = {
      id: property.id,
      streetAddress: property.streetAddress,
      location: {
        city: property.location.city,
        state: property.location.state,
        zipcode: property.location.zipcode || '',
        locality: property.location.locality || '',
        neighborhood: property.location.neighborhood || '',
        fullAddress: property.streetAddress,
        latitude: property.location.latitude,
        longitude: property.location.longitude,
        formattedAddress: property.location.formattedAddress || property.streetAddress,
      },
      builder: property.builder?.name || 'Independent',
      project: propertyDetails?.title || property.project?.name || property.streetAddress,
      title: propertyDetails?.title,
      projectId: property.projectId,
      projectName: property.project?.name,
      propertyType: property.propertyType,
      listingType: property.listingType,
      sqFt: property.sqFt,
      thumbnailUrl: property.thumbnailUrl,
      imageUrls: property.imageUrls,
      walkthroughVideoUrl: property.walkthroughVideoUrl,
      listingStatus: property.listingStatus,
      soldTo: property.soldTo,
      soldDate: property.soldDate?.toISOString(),
      createdAt: property.createdAt.toISOString(),
      postedBy: property.postedBy,
      userId: property.userId,
      userEmail: property.user.email,
      userPhone: property.user.phone,
      companyName: propertyDetails?.companyName,
      bedrooms: propertyDetails?.bedrooms,
      bathrooms: propertyDetails?.bathrooms,
      price: propertyDetails?.price,
      size: propertyDetails?.propertySize || propertyDetails?.size,
      sizeUnit: propertyDetails?.propertySizeUnit || propertyDetails?.sizeUnit,
      plotSize: propertyDetails?.plotSize,
      plotSizeUnit: propertyDetails?.plotSizeUnit,
      facing: propertyDetails?.facing,
      description: propertyDetails?.description,
      interests: property.interests.map(interest => ({
        id: interest.id,
        user: {
          name: interest.user.name || 'Unknown User',
          email: interest.user.email,
          phone: interest.user.phone || 'Not provided',
        },
        createdAt: interest.createdAt.toISOString(),
      })),
    }

    res.status(200).json({ property: transformedProperty })
  } catch (error) {
    // Log error for debugging but don't expose details to client
    res.status(500).json({ message: 'Internal server error' })
  }
}

async function handleUpdate(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Authenticate user
    const session = await getServerSession(req, res, authOptions)
    if (!session?.user?.email) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const { id } = req.query
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ message: 'Property ID is required' })
    }

    // Check if property exists and user owns it
    const existingProperty = await prisma.property.findUnique({
      where: { id },
      select: { userId: true },
    })

    if (!existingProperty) {
      return res.status(404).json({ message: 'Property not found' })
    }

    // Get user ID from session
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    })

    if (!user || existingProperty.userId !== user.id) {
      return res.status(403).json({ message: 'You do not have permission to edit this property' })
    }

    const {
      title,
      propertyType,
      listingType,
      projectId,
      projectName,
      bedrooms,
      bathrooms,
      propertySize,
      propertySizeUnit,
      plotSize,
      plotSizeUnit,
      facing,
      description,
      price,
      location,
      imageUrls,
      thumbnailUrl,
    } = req.body

    // Update or create location
    const locationData = {
      city: location.city,
      state: location.state,
      country: location.country || 'India',
      zipcode: location.zipcode,
      locality: location.locality,
    }

    let locationRecord = null
    if (location.address) {
      locationRecord = await prisma.location.create({
        data: locationData,
      })
    }

    // Build property details object
    const propertyDetails = {
      title: title || projectName,
      bedrooms: bedrooms ? parseInt(bedrooms) : null,
      bathrooms: bathrooms ? parseInt(bathrooms) : null,
      propertySize: propertySize ? parseFloat(propertySize) : null,
      propertySizeUnit: propertySizeUnit || null,
      plotSize: plotSize ? parseFloat(plotSize) : null,
      plotSizeUnit: plotSizeUnit || null,
      facing: facing || null,
      description: description || null,
      price: price ? parseFloat(price) : null,
    }

    // Generate searchText for fast location search
    const searchText = generateSearchText(location.address, locationRecord || locationData)

    // Update property
    const updatedProperty = await prisma.property.update({
      where: { id },
      data: {
        streetAddress: location.address,
        propertyType,
        listingType,
        projectId: projectId || null,
        sqFt: propertySize ? parseFloat(propertySize) : null,
        imageUrls: imageUrls || [],
        thumbnailUrl: thumbnailUrl || imageUrls?.[0] || null,
        propertyDetails: propertyDetails as any,
        searchText,
        ...(locationRecord && { locationId: locationRecord.id }),
      },
    })

    // Handle image cleanup for removed images
    // Note: In production, you would also delete the images from blob storage

    res.status(200).json({
      message: 'Property updated successfully',
      property: updatedProperty,
    })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Update property error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}
