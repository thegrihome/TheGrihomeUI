import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '@/lib/cockroachDB/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const session = await getServerSession(req, res, authOptions)

    if (!session?.user?.id) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    // Fetch all favorited properties with full details
    const favorites = await prisma.savedProperty.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        property: {
          include: {
            location: true,
            builder: true,
            project: {
              select: {
                id: true,
                name: true,
              },
            },
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                companyName: true,
              },
            },
            images: {
              orderBy: {
                displayOrder: 'asc',
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Transform the data to match the Property interface expected by the frontend
    const transformedFavorites = favorites.map((fav: any) => {
      const details = fav.property.propertyDetails as any
      return {
        id: fav.property.id,
        streetAddress: fav.property.streetAddress,
        location: {
          city: fav.property.location.city,
          state: fav.property.location.state,
          zipcode: fav.property.location.zipcode || '',
          locality: fav.property.location.locality || '',
          fullAddress: fav.property.location.formattedAddress || '',
        },
        builder: fav.property.builder?.name || '',
        project: fav.property.project
          ? { id: fav.property.project.id, name: fav.property.project.name }
          : '',
        propertyType: fav.property.propertyType,
        listingType: fav.property.listingType,
        sqFt: fav.property.sqFt,
        thumbnailUrl: fav.property.thumbnailUrl,
        imageUrls: fav.property.imageUrls,
        listingStatus: fav.property.listingStatus,
        soldTo: fav.property.soldTo,
        soldToUserId: fav.property.soldToUserId,
        soldDate: fav.property.soldDate?.toISOString(),
        createdAt: fav.property.createdAt.toISOString(),
        postedBy: fav.property.user.name || 'Unknown',
        companyName: fav.property.user.companyName,
        bedrooms: details?.bedrooms,
        bathrooms: details?.bathrooms,
        price: details?.price,
        size: details?.size,
        sizeUnit: details?.sizeUnit,
        plotSize: details?.plotSize,
        plotSizeUnit: details?.plotSizeUnit,
        description: fav.property.streetAddress,
        userId: fav.property.userId,
        userEmail: fav.property.user.email,
        favoritedAt: fav.createdAt.toISOString(),
      }
    })

    return res.status(200).json({
      favorites: transformedFavorites,
      count: transformedFavorites.length,
    })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Fetch favorites error:', error)
    return res.status(500).json({
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    })
  }
}
