import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/cockroachDB/prisma'
import { PropertyType, ListingType, ListingStatus } from '@prisma/client'

interface QueryParams {
  propertyType?: string
  listingType?: string
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
      listingType,
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

    // Listing type filter (SALE or RENT)
    if (listingType) {
      where.listingType = listingType as ListingType
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

    // Build order clause based on sortBy
    let orderBy: any = { createdAt: 'desc' } // default newest first

    if (sortBy === 'newest') {
      orderBy = { createdAt: 'desc' }
    } else if (sortBy === 'oldest') {
      orderBy = { createdAt: 'asc' }
    }

    // Get total count for pagination
    const totalCount = await prisma.property.count({ where })

    // Fetch properties
    const properties = await prisma.property.findMany({
      where,
      orderBy,
      skip: sortBy === 'price_asc' || sortBy === 'price_desc' ? undefined : skip,
      take: sortBy === 'price_asc' || sortBy === 'price_desc' ? undefined : limitNum,
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
    let transformedProperties = properties.map(property => {
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

    // Sort by price if requested (in-memory sorting since Prisma doesn't support JSON field sorting well)
    if (sortBy === 'price_asc' || sortBy === 'price_desc') {
      transformedProperties = transformedProperties.sort((a, b) => {
        const priceA = a.price ? parseFloat(a.price) : 0
        const priceB = b.price ? parseFloat(b.price) : 0
        return sortBy === 'price_asc' ? priceA - priceB : priceB - priceA
      })

      // Apply pagination after sorting
      transformedProperties = transformedProperties.slice(skip, skip + limitNum)
    }

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
