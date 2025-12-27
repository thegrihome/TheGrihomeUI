import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '@/lib/cockroachDB/prisma'

// Helper function to auto-generate search name from filters
function generateSearchName(filters: Record<string, unknown>): string {
  const parts: string[] = []

  // Buy/Rent
  if (filters.listingType === 'SALE') {
    parts.push('Buy')
  } else if (filters.listingType === 'RENT') {
    parts.push('Rent')
  }

  // Bedrooms
  if (filters.bedrooms) {
    parts.push(`${filters.bedrooms}BHK`)
  }

  // Property Type
  if (filters.propertyType) {
    const typeLabels: Record<string, string> = {
      SINGLE_FAMILY: 'Villas',
      CONDO: 'Apartments',
      LAND_RESIDENTIAL: 'Residential Lands',
      LAND_AGRICULTURE: 'Agriculture Lands',
      COMMERCIAL: 'Commercial',
    }
    parts.push(typeLabels[filters.propertyType as string] || (filters.propertyType as string))
  }

  // Location
  if (filters.location) {
    parts.push(`in ${filters.location}`)
  }

  // Price
  if (filters.priceMax) {
    const price = parseFloat(filters.priceMax as string)
    if (price >= 10000000) {
      parts.push(`under ₹${(price / 10000000).toFixed(price % 10000000 === 0 ? 0 : 1)} Cr`)
    } else if (price >= 100000) {
      parts.push(`under ₹${(price / 100000).toFixed(price % 100000 === 0 ? 0 : 1)} Lac`)
    } else {
      parts.push(`under ₹${price.toLocaleString('en-IN')}`)
    }
  }

  return parts.length > 0 ? parts.join(' ') : 'Property Search'
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)

  if (!session?.user?.id) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  if (req.method === 'GET') {
    try {
      const savedSearches = await prisma.savedSearch.findMany({
        where: {
          userId: session.user.id,
        },
        orderBy: {
          createdAt: 'desc',
        },
      })

      return res.status(200).json({ savedSearches })
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.error('Error fetching saved searches:', error)
      }
      return res.status(500).json({ message: 'Failed to fetch saved searches' })
    }
  }

  if (req.method === 'POST') {
    try {
      const { searchQuery, name } = req.body

      if (!searchQuery || typeof searchQuery !== 'object') {
        return res.status(400).json({ message: 'Search query is required' })
      }

      // Auto-generate name if not provided
      const searchName = name || generateSearchName(searchQuery)

      // Check for duplicate searches (same user, same query)
      const existingSearch = await prisma.savedSearch.findFirst({
        where: {
          userId: session.user.id,
          searchQuery: {
            equals: searchQuery,
          },
        },
      })

      if (existingSearch) {
        return res.status(400).json({ message: 'You already have this search saved' })
      }

      const savedSearch = await prisma.savedSearch.create({
        data: {
          userId: session.user.id,
          name: searchName,
          searchQuery,
          isActive: true,
        },
      })

      return res.status(201).json({
        message: 'Search saved successfully',
        savedSearch,
      })
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.error('Error saving search:', error)
      }
      return res.status(500).json({ message: 'Failed to save search' })
    }
  }

  return res.status(405).json({ message: 'Method not allowed' })
}
