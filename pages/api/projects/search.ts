import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/cockroachDB/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { query } = req.query

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ message: 'Search query is required' })
    }

    const searchQuery = query.trim()

    if (searchQuery.length < 2) {
      return res.status(400).json({ message: 'Search query must be at least 2 characters' })
    }

    const projects = await prisma.project.findMany({
      where: {
        OR: [
          {
            name: {
              contains: searchQuery,
              mode: 'insensitive',
            },
          },
          {
            builder: {
              name: {
                contains: searchQuery,
                mode: 'insensitive',
              },
            },
          },
          {
            location: {
              city: {
                contains: searchQuery,
                mode: 'insensitive',
              },
            },
          },
        ],
      },
      select: {
        id: true,
        name: true,
        builder: {
          select: {
            name: true,
          },
        },
        location: {
          select: {
            city: true,
            state: true,
          },
        },
      },
      take: 10,
      orderBy: {
        name: 'asc',
      },
    })

    res.status(200).json({ projects })
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' })
  }
}
