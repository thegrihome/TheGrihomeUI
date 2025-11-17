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

    // Search in forum posts and replies
    if (type === 'all' || type === 'posts') {
      // Find posts matching the search query
      const postWhereClause: any = {
        ...categoryFilter,
        OR: [
          { title: { contains: searchQuery, mode: 'insensitive' } },
          { content: { contains: searchQuery, mode: 'insensitive' } },
        ],
      }

      // Find posts that have replies matching the search query
      const repliesWhereClause: any = {
        content: { contains: searchQuery, mode: 'insensitive' },
      }

      // If we have category filters, apply them to the post in the reply search
      if (Object.keys(categoryFilter).length > 0) {
        repliesWhereClause.post = categoryFilter
      }

      const [posts, postsCount, repliesWithPosts] = await Promise.all([
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
        }),
        // Count posts
        prisma.forumPost.count({
          where: postWhereClause,
        }),
        // Search replies and get their parent posts
        prisma.forumReply.findMany({
          where: repliesWhereClause,
          include: {
            post: {
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
                  },
                },
                _count: {
                  select: {
                    replies: true,
                    reactions: true,
                  },
                },
              },
            },
          },
          orderBy: [{ createdAt: 'desc' }],
        }),
      ])

      // Combine posts from direct search and posts that have matching replies
      const postMap = new Map()

      // Add directly matching posts
      posts.forEach(post => {
        postMap.set(post.id, { ...post, matchType: 'post' })
      })

      // Add posts that have matching replies (if not already added)
      repliesWithPosts.forEach(reply => {
        if (!postMap.has(reply.post.id)) {
          postMap.set(reply.post.id, { ...reply.post, matchType: 'reply' })
        }
      })

      // Convert map to array and sort by creation date (most recent first)
      const allMatchingPosts = Array.from(postMap.values()).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )

      const totalCount = allMatchingPosts.length

      // Apply pagination
      const paginatedPosts = allMatchingPosts.slice(skip, skip + limitNum)

      results.posts = paginatedPosts
      results.totalResults = totalCount
      results.totalPages = Math.ceil(totalCount / limitNum)
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
