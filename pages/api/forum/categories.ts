import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const categories = await prisma.forumCategory.findMany({
        where: {
          isActive: true,
          parentId: null, // Get only root categories
        },
        include: {
          children: {
            where: { isActive: true },
            include: {
              children: {
                where: { isActive: true },
                orderBy: { displayOrder: 'asc' },
              },
              _count: {
                select: { posts: true },
              },
            },
            orderBy: { displayOrder: 'asc' },
          },
          _count: {
            select: { posts: true },
          },
        },
        orderBy: { displayOrder: 'asc' },
      })

      res.status(200).json(categories)
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error fetching forum categories:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  } else {
    res.setHeader('Allow', ['GET'])
    res.status(405).json({ error: `Method ${req.method} not allowed` })
  }
}
