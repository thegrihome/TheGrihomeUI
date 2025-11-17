import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/cockroachDB/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { search, page = '1', limit = '12' } = req.query

    const currentPage = parseInt(page as string, 10)
    const pageSize = parseInt(limit as string, 10)
    const skip = (currentPage - 1) * pageSize

    // Build search conditions - Support partial matching on all location fields
    // Always exclude archived projects from public listings
    const searchConditions = search
      ? {
          isArchived: false,
          OR: [
            {
              name: {
                contains: search as string,
                mode: 'insensitive' as const,
              },
            },
            {
              builder: {
                name: {
                  contains: search as string,
                  mode: 'insensitive' as const,
                },
              },
            },
            {
              location: {
                city: {
                  contains: search as string,
                  mode: 'insensitive' as const,
                },
              },
            },
            {
              location: {
                state: {
                  contains: search as string,
                  mode: 'insensitive' as const,
                },
              },
            },
            {
              location: {
                zipcode: {
                  contains: search as string,
                  mode: 'insensitive' as const,
                },
              },
            },
            {
              location: {
                locality: {
                  contains: search as string,
                  mode: 'insensitive' as const,
                },
              },
            },
            {
              location: {
                neighborhood: {
                  contains: search as string,
                  mode: 'insensitive' as const,
                },
              },
            },
            {
              location: {
                formattedAddress: {
                  contains: search as string,
                  mode: 'insensitive' as const,
                },
              },
            },
          ],
        }
      : { isArchived: false }

    // Get total count
    const totalCount = await prisma.project.count({
      where: searchConditions,
    })

    // Get projects
    const projects = await prisma.project.findMany({
      where: searchConditions,
      include: {
        builder: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
          },
        },
        location: {
          select: {
            id: true,
            city: true,
            state: true,
            country: true,
            zipcode: true,
            locality: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
      skip,
      take: pageSize,
    })

    const totalPages = Math.ceil(totalCount / pageSize)

    res.status(200).json({
      projects,
      pagination: {
        currentPage,
        totalPages,
        totalCount,
        hasNextPage: currentPage < totalPages,
        hasPreviousPage: currentPage > 1,
      },
    })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching projects:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
