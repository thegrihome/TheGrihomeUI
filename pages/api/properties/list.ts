import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/cockroachDB/prisma'
import { PropertyType, ListingStatus } from '@prisma/client'

interface QueryParams {
  propertyType?: string
  bedrooms?: string
  bathrooms?: string
  location?: string
  zipcode?: string
  sortBy?: string
  page?: string
  limit?: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const {
      propertyType,
      bedrooms,
      bathrooms,
      location,
      zipcode,
      sortBy = 'newest',
      page = '1',
      limit = '12',
    } = req.query as QueryParams

    const pageNum = parseInt(page, 10)
    const limitNum = parseInt(limit, 10)
    const skip = (pageNum - 1) * limitNum

    // Build where clause
    const where: any = {
      listingStatus: ListingStatus.ACTIVE,
    }

    // Property type filter - map frontend values to database enum
    if (propertyType) {
      let dbPropertyType = propertyType

      // Map frontend land types to database LAND enum
      if (propertyType === 'LAND_RESIDENTIAL' || propertyType === 'LAND_AGRICULTURE') {
        dbPropertyType = 'LAND'
      }

      where.propertyType = dbPropertyType as PropertyType
    }

    // Location filters
    if (location) {
      where.OR = [
        {
          streetAddress: {
            contains: location,
            mode: 'insensitive',
          },
        },
        {
          location: {
            city: {
              contains: location,
              mode: 'insensitive',
            },
          },
        },
        {
          location: {
            state: {
              contains: location,
              mode: 'insensitive',
            },
          },
        },
        {
          location: {
            locality: {
              contains: location,
              mode: 'insensitive',
            },
          },
        },
      ]
    }

    // Zipcode filter
    if (zipcode) {
      where.location = {
        ...where.location,
        zipcode: {
          contains: zipcode,
        },
      }
    }

    // Bedrooms and bathrooms filters (from propertyDetails JSON)
    if (bedrooms || bathrooms) {
      const propertyDetailsFilters = []

      if (bedrooms) {
        propertyDetailsFilters.push({
          path: ['bedrooms'],
          equals: bedrooms,
        })
      }

      if (bathrooms) {
        propertyDetailsFilters.push({
          path: ['bathrooms'],
          equals: bathrooms,
        })
      }

      if (propertyDetailsFilters.length > 0) {
        where.propertyDetails = {
          AND: propertyDetailsFilters,
        }
      }
    }

    // Build order clause
    let orderBy: any = { createdAt: 'desc' } // default newest first

    switch (sortBy) {
      case 'price_asc':
        orderBy = [
          {
            propertyDetails: {
              path: ['price'],
              sort: 'asc',
            },
          },
        ]
        break
      case 'price_desc':
        orderBy = [
          {
            propertyDetails: {
              path: ['price'],
              sort: 'desc',
            },
          },
        ]
        break
      case 'newest':
        orderBy = { createdAt: 'desc' }
        break
      case 'oldest':
        orderBy = { createdAt: 'asc' }
        break
    }

    // Get total count for pagination
    const totalCount = await prisma.property.count({ where })

    // Fetch properties
    const properties = await prisma.property.findMany({
      where,
      orderBy,
      skip,
      take: limitNum,
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
    })

    // Transform properties for frontend
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
        project: property.project?.name || 'Independent Property',
        propertyType: property.propertyType,
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
        size: propertyDetails?.size,
        sizeUnit: propertyDetails?.sizeUnit,
        plotSize: propertyDetails?.plotSize,
        plotSizeUnit: propertyDetails?.plotSizeUnit,
        description: propertyDetails?.description,
      }
    })

    res.status(200).json({
      properties: transformedProperties,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalCount / limitNum),
        totalCount,
        hasNextPage: pageNum < Math.ceil(totalCount / limitNum),
        hasPrevPage: pageNum > 1,
      },
    })
  } catch (error) {
    // Error handled by API response
    res.status(500).json({ message: 'Internal server error' })
  }
}
