import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/cockroachDB/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { id } = req.query
    const { page = '1', limit = '12', status } = req.query

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ message: 'Agent ID is required' })
    }

    const pageNum = parseInt(page as string, 10)
    const limitNum = parseInt(limit as string, 10)
    const skip = (pageNum - 1) * limitNum

    // Verify agent exists
    const agent = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        phone: true,
        companyName: true,
        image: true,
        role: true,
      },
    })

    if (!agent) {
      return res.status(404).json({ message: 'Agent not found' })
    }

    if (agent.role !== 'AGENT') {
      return res.status(400).json({ message: 'User is not an agent' })
    }

    // Build where clause
    const whereClause: any = {
      userId: id,
    }

    // Add status filter if provided
    if (status && typeof status === 'string') {
      whereClause.listingStatus = status
    }

    // Fetch properties posted by this agent
    const properties = await prisma.property.findMany({
      where: whereClause,
      include: {
        location: {
          select: {
            city: true,
            state: true,
            zipcode: true,
            locality: true,
          },
        },
        builder: {
          select: {
            name: true,
          },
        },
        project: {
          select: {
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
          take: 1,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limitNum,
    })

    // Get total count for pagination
    const totalCount = await prisma.property.count({
      where: whereClause,
    })

    const totalPages = Math.ceil(totalCount / limitNum)

    // Transform properties for frontend (same as properties list API)
    const transformedProperties = properties.map(property => {
      const propertyDetails = property.propertyDetails as any

      return {
        id: property.id,
        streetAddress: property.streetAddress,
        location: {
          city: property.location.city,
          state: property.location.state,
          zipcode: property.location.zipcode,
          locality: property.location.locality,
          fullAddress: `${property.streetAddress}, ${property.location.locality ? property.location.locality + ', ' : ''}${property.location.city}, ${property.location.state}${property.location.zipcode ? ' - ' + property.location.zipcode : ''}`,
        },
        builder: property.builder?.name || 'Independent',
        project: propertyDetails?.title || property.project?.name || property.streetAddress,
        propertyType: property.propertyType,
        listingType: property.listingType,
        sqFt: property.sqFt,
        thumbnailUrl: property.thumbnailUrl || property.images[0]?.imageUrl,
        imageUrls: property.imageUrls,
        listingStatus: property.listingStatus,
        createdAt: property.createdAt,
        postedBy: property.user.name || 'Agent',
        companyName: property.user.companyName,
        userId: property.userId,
        userEmail: property.user.email,
        // Property details from JSON
        bedrooms: propertyDetails?.bedrooms,
        bathrooms: propertyDetails?.bathrooms,
        price: propertyDetails?.price,
        size: propertyDetails?.propertySize || propertyDetails?.size,
        sizeUnit: propertyDetails?.propertySizeUnit || propertyDetails?.sizeUnit,
        plotSize: propertyDetails?.plotSize,
        plotSizeUnit: propertyDetails?.plotSizeUnit,
        description: propertyDetails?.description,
      }
    })

    res.status(200).json({
      agent,
      properties: transformedProperties,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalCount,
        hasNextPage: pageNum < totalPages,
        hasPreviousPage: pageNum > 1,
      },
    })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching agent properties:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}
