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

    // Parse and validate pagination parameters
    const { page = '1', limit = '20' } = req.query
    const pageNum = Math.max(1, parseInt(page as string) || 1)
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string) || 20))
    const skip = (pageNum - 1) * limitNum

    // Get total count for pagination
    const totalCount = await prisma.savedProperty.count({
      where: { userId: session.user.id },
    })

    // Fetch paginated favorited properties with full details
    const favorites = await prisma.savedProperty.findMany({
      where: {
        userId: session.user.id,
      },
      skip,
      take: limitNum,
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
              take: 1, // Only need first image for thumbnail
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
      // Extract propertyDetails as any to avoid TypeScript errors with JSON field
      const propertyData = fav.property
      const detailsRaw: any = propertyData.propertyDetails

      return {
        id: propertyData.id,
        streetAddress: propertyData.streetAddress,
        location: {
          city: propertyData.location.city,
          state: propertyData.location.state,
          zipcode: propertyData.location.zipcode || '',
          locality: propertyData.location.locality || '',
          fullAddress: propertyData.location.formattedAddress || '',
        },
        builder: propertyData.builder?.name || '',
        project: propertyData.project
          ? { id: propertyData.project.id, name: propertyData.project.name }
          : '',
        title: detailsRaw?.title || '',
        propertyType: propertyData.propertyType,
        listingType: propertyData.listingType,
        sqFt: propertyData.sqFt,
        thumbnailUrl: propertyData.thumbnailUrl,
        imageUrls: propertyData.imageUrls,
        listingStatus: propertyData.listingStatus,
        soldTo: propertyData.soldTo,
        soldToUserId: propertyData.soldToUserId,
        soldDate: propertyData.soldDate?.toISOString(),
        createdAt: propertyData.createdAt.toISOString(),
        postedBy: propertyData.user.name || 'Unknown',
        companyName: propertyData.user.companyName,
        bedrooms: detailsRaw?.bedrooms,
        bathrooms: detailsRaw?.bathrooms,
        price: detailsRaw?.price,
        size: detailsRaw?.size,
        sizeUnit: detailsRaw?.sizeUnit,
        plotSize: detailsRaw?.plotSize,
        plotSizeUnit: detailsRaw?.plotSizeUnit,
        description: propertyData.streetAddress,
        userId: propertyData.userId,
        userEmail: propertyData.user.email,
        favoritedAt: fav.createdAt.toISOString(),
      }
    })

    return res.status(200).json({
      favorites: transformedFavorites,
      count: transformedFavorites.length,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalCount / limitNum),
        totalCount,
        hasNextPage: pageNum < Math.ceil(totalCount / limitNum),
        hasPrevPage: pageNum > 1,
      },
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
