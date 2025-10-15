import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/cockroachDB/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { page = '1', limit = '12', search = '' } = req.query

    const pageNum = parseInt(page as string)
    const limitNum = parseInt(limit as string)
    const skip = (pageNum - 1) * limitNum

    // Build where clause for search
    const whereClause: any = {}
    if (search) {
      whereClause.name = {
        contains: search as string,
        mode: 'insensitive',
      }
    }

    // Get builders with project count
    const [builders, totalCount] = await Promise.all([
      prisma.builder.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          description: true,
          logoUrl: true,
          website: true,
          _count: {
            select: {
              projects: true,
            },
          },
        },
        orderBy: {
          name: 'asc',
        },
        skip,
        take: limitNum,
      }),
      prisma.builder.count({ where: whereClause }),
    ])

    // Format response with projectCount
    const formattedBuilders = builders.map(builder => ({
      id: builder.id,
      name: builder.name,
      description: builder.description,
      logoUrl: builder.logoUrl,
      website: builder.website,
      projectCount: builder._count.projects,
    }))

    const totalPages = Math.ceil(totalCount / limitNum)

    return res.status(200).json({
      builders: formattedBuilders,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalCount,
        hasNextPage: pageNum < totalPages,
        hasPreviousPage: pageNum > 1,
      },
    })
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' })
  }
}
