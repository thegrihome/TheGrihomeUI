import { prisma } from './prisma'
import { PropertyType, ListingStatus } from '@prisma/client'

/**
 * Optimized database queries for real estate operations
 * These queries are designed to minimize Request Units (RU) consumption
 */

// Property search with optimized filtering
export async function searchProperties({
  city,
  state,
  minPrice,
  maxPrice,
  propertyType,
  bedrooms,
  bathrooms,
  limit = 20,
  offset = 0,
}: {
  city?: string
  state?: string
  minPrice?: number
  maxPrice?: number
  propertyType?: PropertyType
  bedrooms?: number
  bathrooms?: number
  limit?: number
  offset?: number
}) {
  // Use indexed fields and selective queries to reduce RU consumption
  return await prisma.property.findMany({
    where: {
      listingStatus: ListingStatus.ACTIVE, // Always filter by status first (indexed)
      ...(city && state && { city, state }), // Use compound index
      ...(minPrice || maxPrice
        ? {
            price: {
              ...(minPrice && { gte: minPrice }),
              ...(maxPrice && { lte: maxPrice }),
            },
          }
        : {}),
      ...(propertyType && { propertyType }),
      ...(bedrooms && { bedrooms: { gte: bedrooms } }),
      ...(bathrooms && { bathrooms: { gte: bathrooms } }),
    },
    select: {
      // Only select needed fields to reduce data transfer
      id: true,
      address: true,
      city: true,
      state: true,
      price: true,
      bedrooms: true,
      bathrooms: true,
      squareFeet: true,
      propertyType: true,
      listingDate: true,
      images: {
        select: {
          imageUrl: true,
          altText: true,
        },
        take: 1, // Only get the first image
        orderBy: { displayOrder: 'asc' },
      },
    },
    orderBy: [
      { listingDate: 'desc' }, // Use indexed field for sorting
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
      agent: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          licenseNumber: true,
        },
      },
      images: {
        orderBy: { displayOrder: 'asc' },
      },
    },
  })
}

// Get agent's listings (optimized for agent dashboard)
export async function getAgentListings(agentId: string, status?: ListingStatus) {
  return await prisma.property.findMany({
    where: {
      agentId,
      ...(status && { listingStatus: status }),
    },
    select: {
      id: true,
      address: true,
      city: true,
      state: true,
      price: true,
      listingStatus: true,
      listingDate: true,
      updatedAt: true,
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
          address: true,
          city: true,
          state: true,
          price: true,
          bedrooms: true,
          bathrooms: true,
          propertyType: true,
          images: {
            select: { imageUrl: true, altText: true },
            take: 1,
            orderBy: { displayOrder: 'asc' },
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
    where: {
      listingStatus: ListingStatus.ACTIVE,
    },
    select: {
      id: true,
      address: true,
      city: true,
      state: true,
      price: true,
      bedrooms: true,
      bathrooms: true,
      squareFeet: true,
      propertyType: true,
      images: {
        select: { imageUrl: true, altText: true },
        take: 1,
        orderBy: { displayOrder: 'asc' },
      },
    },
    orderBy: { listingDate: 'desc' },
    take: limit,
  })
}

// Count properties for pagination (optimized)
export async function countProperties(filters: {
  city?: string
  state?: string
  minPrice?: number
  maxPrice?: number
  propertyType?: PropertyType
}) {
  return await prisma.property.count({
    where: {
      listingStatus: ListingStatus.ACTIVE,
      ...(filters.city && filters.state && { city: filters.city, state: filters.state }),
      ...(filters.minPrice || filters.maxPrice
        ? {
            price: {
              ...(filters.minPrice && { gte: filters.minPrice }),
              ...(filters.maxPrice && { lte: filters.maxPrice }),
            },
          }
        : {}),
      ...(filters.propertyType && { propertyType: filters.propertyType }),
    },
  })
}
