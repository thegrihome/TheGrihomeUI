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
  country = 'USA',
  limit = 20,
  offset = 0,
}: {
  city?: string
  state?: string
  country?: string
  limit?: number
  offset?: number
}) {
  // Use indexed fields and selective queries to reduce RU consumption
  return await prisma.property.findMany({
    where: {
      ...(city &&
        state && {
          location: {
            city,
            state,
            country,
          },
        }),
    },
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
  country?: string
  projectType?: ProjectType
}) {
  return await prisma.property.count({
    where: {
      ...(filters.city &&
        filters.state && {
          location: {
            city: filters.city,
            state: filters.state,
            ...(filters.country && { country: filters.country }),
          },
        }),
      ...(filters.projectType && {
        project: {
          type: filters.projectType,
        },
      }),
    },
  })
}
