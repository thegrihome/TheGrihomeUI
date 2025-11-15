import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/cockroachDB/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { userId } = req.query
  const { page = '1', limit = '20' } = req.query

  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ message: 'Valid user ID required' })
  }

  const pageNum = parseInt(page as string) || 1
  const limitNum = parseInt(limit as string) || 20
  const skip = (pageNum - 1) * limitNum

  try {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        image: true,
        createdAt: true,
      },
    })

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    // Get user's posts
    const [posts, postsCount, replies, repliesCount] = await Promise.all([
      prisma.forumPost.findMany({
        where: { authorId: userId },
        include: {
          category: {
            select: {
              id: true,
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
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.forumPost.count({
        where: { authorId: userId },
      }),
      prisma.forumReply.findMany({
        where: { authorId: userId },
        include: {
          post: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.forumReply.count({
        where: { authorId: userId },
      }),
    ])

    const totalPages = Math.ceil(postsCount / limitNum)

    res.status(200).json({
      user,
      posts,
      replies,
      postsCount,
      repliesCount,
      currentPage: pageNum,
      totalPages,
    })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching user posts:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}
