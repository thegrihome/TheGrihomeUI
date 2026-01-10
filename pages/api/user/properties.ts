import { NextApiRequest, NextApiResponse } from 'next'
import { getSession } from 'next-auth/react'
import { prisma } from '@/lib/cockroachDB/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const session = await getSession({ req })

    if (!session?.user?.email) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    // Get user properties with related data
    const properties = await prisma.property.findMany({
      where: {
        user: {
          email: session.user.email,
        },
      },
      include: {
        location: true,
        builder: true,
        project: true,
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
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Transform the data to match the frontend interface
    const transformedProperties = properties.map(property => {
      const propertyDetails = property.propertyDetails as any

      return {
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
        project: property.project ? { id: property.project.id, name: property.project.name } : null,
        title: propertyDetails?.title || null,
        propertyType: property.propertyType,
        sqFt: property.sqFt,
        thumbnailUrl: property.thumbnailUrl,
        imageUrls: property.imageUrls,
        listingStatus: property.listingStatus,
        soldTo: property.soldTo,
        soldToUserId: property.soldToUserId,
        soldDate: property.soldDate?.toISOString(),
        createdAt: property.createdAt.toISOString(),
        postedBy: property.postedBy,
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
    })

    res.status(200).json({ properties: transformedProperties })
  } catch (error) {
    // Log error for debugging but don't expose details to client
    res.status(500).json({ message: 'Internal server error' })
  }
}
