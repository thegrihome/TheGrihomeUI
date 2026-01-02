import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]'
import { prisma } from '@/lib/cockroachDB/prisma'
import { applyRateLimit, RATE_LIMITS } from '@/lib/middleware/rate-limit'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { categoryId, page = '1', limit = '20' } = req.query
      // Validate and cap pagination parameters
      const pageNum = Math.max(1, parseInt(page as string) || 1)
      const limitNum = Math.min(50, Math.max(1, parseInt(limit as string) || 20))
      const skip = (pageNum - 1) * limitNum

      const where = categoryId ? { categoryId: categoryId as string } : {}

      const [posts, totalCount] = await Promise.all([
        prisma.forumPost.findMany({
          where,
          include: {
            author: {
              select: {
                id: true,
                username: true,
                image: true,
                createdAt: true,
              },
            },
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
            _count: {
              select: {
                replies: true,
                reactions: true,
              },
            },
          },
          orderBy: [{ isSticky: 'desc' }, { lastReplyAt: 'desc' }, { createdAt: 'desc' }],
          skip,
          take: limitNum,
        }),
        prisma.forumPost.count({ where }),
      ])

      res.status(200).json({
        posts,
        totalCount,
        currentPage: pageNum,
        totalPages: Math.ceil(totalCount / limitNum),
      })
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error fetching forum posts:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  } else if (req.method === 'POST') {
    try {
      const session = await getServerSession(req, res, authOptions)
      if (!session?.user?.id) {
        return res.status(401).json({ error: 'Authentication required' })
      }

      // Apply rate limiting for post creation
      if (!applyRateLimit(req, res, RATE_LIMITS.forumPost, session.user.id)) {
        return // Response already sent by rate limiter
      }

      // Check if user has verified email or mobile
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { emailVerified: true, mobileVerified: true },
      })

      if (!user?.emailVerified && !user?.mobileVerified) {
        return res.status(403).json({
          error: 'Email or mobile verification required to post',
        })
      }

      const { title, content, categoryId } = req.body

      if (!title || !content || !categoryId) {
        return res.status(400).json({ error: 'Missing required fields' })
      }

      // Generate slug from title
      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim()

      // Ensure slug is unique
      let uniqueSlug = slug
      let counter = 1
      while (await prisma.forumPost.findUnique({ where: { slug: uniqueSlug } })) {
        uniqueSlug = `${slug}-${counter}`
        counter++
      }

      const post = await prisma.forumPost.create({
        data: {
          title,
          content,
          slug: uniqueSlug,
          categoryId,
          authorId: session.user.id,
        },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              image: true,
              createdAt: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      })

      res.status(201).json(post)
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error creating forum post:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST'])
    res.status(405).json({ error: `Method ${req.method} not allowed` })
  }
}
