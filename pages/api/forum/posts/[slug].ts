import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/cockroachDB/prisma'

// In-memory view count buffer to reduce DB writes
const viewCountBuffer: Map<string, number> = new Map()
const FLUSH_INTERVAL = 5 * 60 * 1000 // 5 minutes

// Flush view counts to database periodically
async function flushViewCounts() {
  if (viewCountBuffer.size === 0) return

  const updates = Array.from(viewCountBuffer.entries())
  viewCountBuffer.clear()

  for (const [slug, count] of updates) {
    try {
      await prisma.forumPost.update({
        where: { slug },
        data: { viewCount: { increment: count } },
      })
    } catch {
      // Post might have been deleted, ignore
    }
  }
}

// Set up periodic flush (only on server, not during build)
if (typeof setInterval !== 'undefined' && process.env.NODE_ENV !== 'test') {
  setInterval(flushViewCounts, FLUSH_INTERVAL)
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { slug, replyPage, replyLimit } = req.query

  if (req.method === 'GET') {
    try {
      // Buffer view count instead of writing immediately
      const currentCount = viewCountBuffer.get(slug as string) || 0
      viewCountBuffer.set(slug as string, currentCount + 1)

      // Parse pagination params with limits
      const page = Math.max(1, parseInt(replyPage as string) || 1)
      const limit = Math.min(50, Math.max(1, parseInt(replyLimit as string) || 20))
      const skip = (page - 1) * limit

      // Get total reply count for pagination info
      const totalReplies = await prisma.forumReply.count({
        where: { postId: slug as string, parentId: null },
      })

      const post = await prisma.forumPost.findUnique({
        where: { slug: slug as string },
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
          replies: {
            where: { parentId: null }, // Only top-level replies
            skip,
            take: limit,
            include: {
              author: {
                select: {
                  id: true,
                  username: true,
                  image: true,
                  createdAt: true,
                },
              },
              children: {
                take: 10, // Limit nested replies to 10 per parent
                include: {
                  author: {
                    select: {
                      id: true,
                      username: true,
                      image: true,
                      createdAt: true,
                    },
                  },
                  reactions: {
                    include: {
                      user: {
                        select: { id: true, username: true },
                      },
                    },
                  },
                },
                orderBy: { createdAt: 'asc' },
              },
              reactions: {
                include: {
                  user: {
                    select: { id: true, username: true },
                  },
                },
              },
            },
            orderBy: { createdAt: 'asc' },
          },
          reactions: {
            include: {
              user: {
                select: { id: true, username: true },
              },
            },
          },
        },
      })

      if (!post) {
        return res.status(404).json({ error: 'Post not found' })
      }

      // Include pagination metadata
      res.status(200).json({
        ...post,
        replyPagination: {
          page,
          limit,
          totalReplies,
          totalPages: Math.ceil(totalReplies / limit),
          hasMore: skip + limit < totalReplies,
        },
      })
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error fetching forum post:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  } else {
    res.setHeader('Allow', ['GET'])
    res.status(405).json({ error: `Method ${req.method} not allowed` })
  }
}
