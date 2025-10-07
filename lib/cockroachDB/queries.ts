import { prisma } from './prisma'
import { PropertyType, ProjectType } from '@prisma/client'

/**
 * Optimized database queries for real estate operations
 * These queries are designed to minimize Request Units (RU) consumption
 */

// Property search with optimized filtering
export async function searchProperties({
  city,
  state,
  locality,
  location,
  country = 'India',
  limit = 20,
  offset = 0,
}: {
  city?: string
  state?: string
  locality?: string
  location?: string
  country?: string
  limit?: number
  offset?: number
}) {
  // Build location filter with intelligent matching
  const locationFilter: any = {}

  if (city && state) {
    // If we have city and state, filter by them first
    locationFilter.location = {
      city,
      state,
      ...(country && { country }),
    }

    // If locality is provided, do fuzzy matching on locality or street address
    if (locality) {
      locationFilter.OR = [
        { location: { locality: { contains: locality, mode: 'insensitive' } } },
        { streetAddress: { contains: locality, mode: 'insensitive' } },
      ]
    }
  } else if (location) {
    // Fallback: search across all location fields
    locationFilter.OR = [
      { location: { city: { contains: location, mode: 'insensitive' } } },
      { location: { state: { contains: location, mode: 'insensitive' } } },
      { location: { locality: { contains: location, mode: 'insensitive' } } },
      { streetAddress: { contains: location, mode: 'insensitive' } },
    ]
  }

  // Use indexed fields and selective queries to reduce RU consumption
  return await prisma.property.findMany({
    where: locationFilter,
    select: {
      // Only select needed fields to reduce data transfer
      id: true,
      streetAddress: true,
      imageUrls: true,
      thumbnailIndex: true,
      createdAt: true,
      location: {
        select: {
          city: true,
          state: true,
          country: true,
          zipcode: true,
          locality: true,
        },
      },
      project: {
        select: {
          id: true,
          type: true,
          numberOfUnits: true,
        },
      },
    },
    orderBy: [
      { createdAt: 'desc' }, // Use indexed field for sorting
    ],
    take: limit,
    skip: offset,
  })
}

// Get property details (full data for property page)
export async function getPropertyById(id: string) {
  return await prisma.property.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          licenseNumber: true,
        },
      },
      location: true,
      project: true,
      images: {
        orderBy: { displayOrder: 'asc' },
      },
    },
  })
}

// Get user's listings (optimized for user dashboard)
export async function getUserListings(userId: string) {
  return await prisma.property.findMany({
    where: {
      userId,
    },
    select: {
      id: true,
      streetAddress: true,
      imageUrls: true,
      thumbnailIndex: true,
      createdAt: true,
      updatedAt: true,
      location: {
        select: {
          city: true,
          state: true,
          zipcode: true,
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
  })
}

// Get user's saved properties (optimized for favorites page)
export async function getUserSavedProperties(userId: string) {
  return await prisma.savedProperty.findMany({
    where: { userId },
    include: {
      property: {
        select: {
          id: true,
          streetAddress: true,
          imageUrls: true,
          thumbnailIndex: true,
          location: {
            select: {
              city: true,
              state: true,
              zipcode: true,
            },
          },
          project: {
            select: {
              type: true,
              numberOfUnits: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
}

// Batch operations for better RU efficiency
export async function batchCreatePropertyImages(
  propertyId: string,
  images: Array<{ imageUrl: string; altText?: string; displayOrder: number }>
) {
  return await prisma.propertyImage.createMany({
    data: images.map(img => ({
      propertyId,
      ...img,
    })),
  })
}

// Get recent listings for homepage (cached/optimized)
export async function getRecentListings(limit = 12) {
  return await prisma.property.findMany({
    select: {
      id: true,
      streetAddress: true,
      imageUrls: true,
      thumbnailIndex: true,
      createdAt: true,
      location: {
        select: {
          city: true,
          state: true,
          zipcode: true,
        },
      },
      project: {
        select: {
          type: true,
          numberOfUnits: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
}

// Count properties for pagination (optimized)
export async function countProperties(filters: {
  city?: string
  state?: string
  locality?: string
  location?: string
  country?: string
  projectType?: ProjectType
}) {
  // Build location filter with intelligent matching
  const locationFilter: any = {}

  if (filters.city && filters.state) {
    // If we have city and state, filter by them first
    locationFilter.location = {
      city: filters.city,
      state: filters.state,
      ...(filters.country && { country: filters.country }),
    }

    // If locality is provided, do fuzzy matching
    if (filters.locality) {
      locationFilter.OR = [
        { location: { locality: { contains: filters.locality, mode: 'insensitive' } } },
        { streetAddress: { contains: filters.locality, mode: 'insensitive' } },
      ]
    }
  } else if (filters.location) {
    // Fallback: search across all location fields
    locationFilter.OR = [
      { location: { city: { contains: filters.location, mode: 'insensitive' } } },
      { location: { state: { contains: filters.location, mode: 'insensitive' } } },
      { location: { locality: { contains: filters.location, mode: 'insensitive' } } },
      { streetAddress: { contains: filters.location, mode: 'insensitive' } },
    ]
  }

  return await prisma.property.count({
    where: {
      ...locationFilter,
      ...(filters.projectType && {
        project: {
          type: filters.projectType,
        },
      }),
    },
  })
}
