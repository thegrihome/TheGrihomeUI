import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { slug } = req.query

  if (req.method === 'GET') {
    try {
      // Increment view count
      await prisma.forumPost.update({
        where: { slug: slug as string },
        data: { viewCount: { increment: 1 } },
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

      res.status(200).json(post)
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
