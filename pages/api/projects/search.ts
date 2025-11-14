import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/cockroachDB/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { query } = req.query

    // Allow empty query to get all projects
    const searchQuery = query && typeof query === 'string' ? query.trim() : ''

    const whereClause =
      searchQuery.length >= 2
        ? {
            OR: [
              {
                name: {
                  contains: searchQuery,
                  mode: 'insensitive' as const,
                },
              },
              {
                builder: {
                  name: {
                    contains: searchQuery,
                    mode: 'insensitive' as const,
                  },
                },
              },
              {
                location: {
                  city: {
                    contains: searchQuery,
                    mode: 'insensitive' as const,
                  },
                },
              },
            ],
          }
        : {} // Return all projects if no search query

    const projects = await prisma.project.findMany({
      where: whereClause,
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
      take: searchQuery.length >= 2 ? 20 : 100, // Show more results when showing all, limit for performance
      orderBy: {
        name: 'asc',
      },
    })

    res.status(200).json({ projects })
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' })
  }
}
