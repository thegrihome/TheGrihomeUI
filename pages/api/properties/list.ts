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
  priceMin?: string
  priceMax?: string
  sizeMin?: string
  sizeMax?: string
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
      priceMin,
      priceMax,
      sizeMin,
      sizeMax,
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

    // Location filters - Support partial matching on all location fields
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
        {
          location: {
            neighborhood: {
              contains: location,
              mode: 'insensitive',
            },
          },
        },
        {
          location: {
            zipcode: {
              contains: location,
              mode: 'insensitive',
            },
          },
        },
        {
          location: {
            formattedAddress: {
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

    // Determine if we need to fetch all records for in-memory filtering
    const needsInMemoryProcessing =
      sortBy === 'price_asc' ||
      sortBy === 'price_desc' ||
      priceMin ||
      priceMax ||
      sizeMin ||
      sizeMax

    // Run count and findMany in parallel for better performance
    const [totalCount, properties] = await Promise.all([
      prisma.property.count({ where }),
      prisma.property.findMany({
        where,
        orderBy,
        skip: needsInMemoryProcessing ? undefined : skip,
        take: needsInMemoryProcessing ? undefined : limitNum,
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
      }),
    ])

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

    // Apply price and size filters (in-memory since Prisma doesn't support JSON field filtering well)
    const hasPriceOrSizeFilter = priceMin || priceMax || sizeMin || sizeMax
    if (hasPriceOrSizeFilter) {
      transformedProperties = transformedProperties.filter(property => {
        // Price filter
        if (priceMin || priceMax) {
          const propertyPrice = property.price ? parseFloat(property.price) : null
          if (propertyPrice === null) return false // Exclude properties without price when price filter is active

          if (priceMin && propertyPrice < parseFloat(priceMin)) return false
          if (priceMax && propertyPrice > parseFloat(priceMax)) return false
        }

        // Size filter
        if (sizeMin || sizeMax) {
          const propertySize = property.size ? parseFloat(property.size) : null
          if (propertySize === null) return false // Exclude properties without size when size filter is active

          if (sizeMin && propertySize < parseFloat(sizeMin)) return false
          if (sizeMax && propertySize > parseFloat(sizeMax)) return false
        }

        return true
      })
    }

    // Sort by price if requested (in-memory sorting since Prisma doesn't support JSON field sorting well)
    if (sortBy === 'price_asc' || sortBy === 'price_desc') {
      transformedProperties = transformedProperties.sort((a, b) => {
        const priceA = a.price ? parseFloat(a.price) : 0
        const priceB = b.price ? parseFloat(b.price) : 0
        return sortBy === 'price_asc' ? priceA - priceB : priceB - priceA
      })
    }

    // Calculate filtered count for pagination when using price/size filters
    const filteredCount = hasPriceOrSizeFilter ? transformedProperties.length : totalCount

    // Apply pagination after filtering/sorting when using in-memory processing
    if (needsInMemoryProcessing) {
      transformedProperties = transformedProperties.slice(skip, skip + limitNum)
    }

    res.status(200).json({
      properties: transformedProperties,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(filteredCount / limitNum),
        totalCount: filteredCount,
        hasNextPage: pageNum < Math.ceil(filteredCount / limitNum),
        hasPrevPage: pageNum > 1,
      },
    })
  } catch (error) {
    // Error handled by API response
    res.status(500).json({ message: 'Internal server error' })
  }
}
