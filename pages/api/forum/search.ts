import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { q: query, type = 'all', page = '1', limit = '20' } = req.query

  if (!query || typeof query !== 'string') {
    return res.status(400).json({ message: 'Query parameter is required' })
  }

  const searchQuery = query.trim()
  if (searchQuery.length < 2) {
    return res.status(400).json({ message: 'Query must be at least 2 characters' })
  }

  const pageNum = parseInt(page as string) || 1
  const limitNum = parseInt(limit as string) || 20
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

    // Search in forum posts
    if (type === 'all' || type === 'posts') {
      const [posts, postsCount] = await Promise.all([
        prisma.forumPost.findMany({
          where: {
            OR: [
              { title: { contains: searchQuery, mode: 'insensitive' } },
              { content: { contains: searchQuery, mode: 'insensitive' } },
            ],
          },
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
          skip: type === 'posts' ? skip : 0,
          take: type === 'posts' ? limitNum : 10,
        }),
        prisma.forumPost.count({
          where: {
            OR: [
              { title: { contains: searchQuery, mode: 'insensitive' } },
              { content: { contains: searchQuery, mode: 'insensitive' } },
            ],
          },
        }),
      ])

      results.posts = posts
      if (type === 'posts') {
        results.totalResults = postsCount
        results.totalPages = Math.ceil(postsCount / limitNum)
      }
    }

    // Search in categories/sections
    if (type === 'all' || type === 'categories') {
      const categories = await prisma.forumCategory.findMany({
        where: {
          OR: [
            { name: { contains: searchQuery, mode: 'insensitive' } },
            { description: { contains: searchQuery, mode: 'insensitive' } },
          ],
          isActive: true,
        },
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
        take: type === 'categories' ? limitNum : 5,
      })

      results.categories = categories
    }

    // If searching all, combine results count
    if (type === 'all') {
      results.totalResults = results.posts.length + results.categories.length
    }

    res.status(200).json(results)
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Search error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}
