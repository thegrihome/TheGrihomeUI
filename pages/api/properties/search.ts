import { NextApiRequest, NextApiResponse } from 'next'
import { searchProperties, countProperties } from '../../../lib/queries'
import { logAPIMetrics } from '../../../lib/ru-monitor'
import { PropertyType } from '@prisma/client'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const startTime = Date.now()

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const {
      city,
      state,
      minPrice,
      maxPrice,
      propertyType,
      bedrooms,
      bathrooms,
      page = '1',
      limit = '20',
    } = req.query

    // Parse and validate parameters
    const pageNum = Math.max(1, parseInt(page as string) || 1)
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string) || 20)) // Cap at 50
    const offset = (pageNum - 1) * limitNum

    // Build search filters
    const filters = {
      ...(city && { city: city as string }),
      ...(state && { state: state as string }),
      ...(minPrice && { minPrice: parseFloat(minPrice as string) }),
      ...(maxPrice && { maxPrice: parseFloat(maxPrice as string) }),
      ...(propertyType && { propertyType: propertyType as PropertyType }),
      ...(bedrooms && { bedrooms: parseInt(bedrooms as string) }),
      ...(bathrooms && { bathrooms: parseFloat(bathrooms as string) }),
    }

    // Execute optimized queries
    const [properties, totalCount] = await Promise.all([
      searchProperties({
        ...filters,
        limit: limitNum,
        offset,
      }),
      countProperties(filters),
    ])

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limitNum)
    const hasMore = pageNum < totalPages

    const response = {
      properties,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        totalPages,
        hasMore,
      },
    }

    logAPIMetrics('/api/properties/search', startTime)
    res.status(200).json(response)
  } catch (error) {
    logAPIMetrics('/api/properties/search (ERROR)', startTime)
    // eslint-disable-next-line no-console
    console.error('Property search error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}
