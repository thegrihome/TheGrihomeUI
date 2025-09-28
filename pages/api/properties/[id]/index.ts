import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

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
        fullAddress: `${property.location.locality ? property.location.locality + ', ' : ''}${property.location.city}, ${property.location.state} ${property.location.zipcode || ''}`,
      },
      builder: property.builder?.name || 'Independent',
      project: property.project?.name || propertyDetails?.projectName || 'Individual Property',
      propertyType: property.propertyType,
      sqFt: property.sqFt,
      thumbnailUrl: property.thumbnailUrl,
      imageUrls: property.imageUrls,
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
      size: propertyDetails?.size,
      sizeUnit: propertyDetails?.sizeUnit,
      plotSize: propertyDetails?.plotSize,
      plotSizeUnit: propertyDetails?.plotSizeUnit,
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
