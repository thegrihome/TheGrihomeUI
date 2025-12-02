import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/cockroachDB/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const {
    q: query,
    type = 'all',
    page = '1',
    limit = '20',
    categoryId,
    city,
    propertyType,
  } = req.query

  if (!query || typeof query !== 'string') {
    return res.status(400).json({ message: 'Query parameter is required' })
  }

  const searchQuery = query.trim()
  if (searchQuery.length < 2) {
    return res.status(400).json({ message: 'Query must be at least 2 characters' })
  }

  const pageNum = parseInt(page as string) || 1
  const limitNum = Math.min(parseInt(limit as string) || 20, 50) // Max 50 results per page
  const skip = (pageNum - 1) * limitNum

  try {
    const results: any = {
      query: searchQuery,
      posts: [],
      categories: [],
      totalResults: 0,
      currentPage: pageNum,
      totalPages: 0,
    }

    // Build category filter for posts and replies
    const categoryFilter: any = {}
    if (categoryId && typeof categoryId === 'string') {
      categoryFilter.categoryId = categoryId
    } else if (city && typeof city === 'string') {
      const cityFilter: any = { city: city }
      // If propertyType is also specified, add it to the filter
      if (propertyType && typeof propertyType === 'string') {
        cityFilter.propertyType = propertyType
      }
      categoryFilter.category = cityFilter
    }

    // Search in forum posts
    if (type === 'all' || type === 'posts') {
      // Find posts matching the search query in title, content, or author username
      const postWhereClause: any = {
        ...categoryFilter,
        OR: [
          { title: { contains: searchQuery, mode: 'insensitive' } },
          { content: { contains: searchQuery, mode: 'insensitive' } },
          { author: { username: { contains: searchQuery, mode: 'insensitive' } } },
        ],
      }

      const [posts, postsCount] = await Promise.all([
        // Search posts
        prisma.forumPost.findMany({
          where: postWhereClause,
          include: {
            author: {
              select: {
                id: true,
                username: true,
                image: true,
              },
            },
            category: {
              select: {
                name: true,
                slug: true,
                city: true,
                propertyType: true,
                parent: {
                  select: {
                    slug: true,
                  },
                },
              },
            },
            _count: {
              select: {
                replies: true,
                reactions: true,
              },
            },
          },
          orderBy: [{ createdAt: 'desc' }],
          skip,
          take: limitNum,
        }),
        // Count posts
        prisma.forumPost.count({
          where: postWhereClause,
        }),
      ])

      results.posts = posts
      results.totalResults = postsCount
      results.totalPages = Math.ceil(postsCount / limitNum)
    }

    // Search in categories/sections
    if (type === 'all' || type === 'categories') {
      const categoryWhereClause: any = {
        OR: [
          { name: { contains: searchQuery, mode: 'insensitive' } },
          { description: { contains: searchQuery, mode: 'insensitive' } },
        ],
        isActive: true,
      }

      // Apply city filter for category search if provided
      if (city && typeof city === 'string') {
        categoryWhereClause.city = city
      }

      const categories = await prisma.forumCategory.findMany({
        where: categoryWhereClause,
        include: {
          _count: {
            select: { posts: true },
          },
          parent: {
            select: {
              name: true,
              slug: true,
            },
          },
        },
        orderBy: [{ displayOrder: 'asc' }],
        take: 5, // Limit categories to top 5 matches
      })

      results.categories = categories

      // For 'all' type, add categories to total results count
      if (type === 'all') {
        results.totalResults = results.posts.length + results.categories.length
      }
    }

    res.status(200).json(results)
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Search error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}
