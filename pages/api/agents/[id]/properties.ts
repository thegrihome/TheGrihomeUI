import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/cockroachDB/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { id } = req.query
    const { page = '1', limit = '12', status } = req.query

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ message: 'Agent ID is required' })
    }

    const pageNum = parseInt(page as string, 10)
    const limitNum = parseInt(limit as string, 10)
    const skip = (pageNum - 1) * limitNum

    // Verify agent exists
    const agent = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        phone: true,
        companyName: true,
        image: true,
        role: true,
      },
    })

    if (!agent) {
      return res.status(404).json({ message: 'Agent not found' })
    }

    if (agent.role !== 'AGENT') {
      return res.status(400).json({ message: 'User is not an agent' })
    }

    // Build where clause
    const whereClause: any = {
      userId: id,
    }

    // Add status filter if provided
    if (status && typeof status === 'string') {
      whereClause.listingStatus = status
    }

    // Fetch properties posted by this agent
    const properties = await prisma.property.findMany({
      where: whereClause,
      include: {
        location: true,
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limitNum,
    })

    // Get total count for pagination
    const totalCount = await prisma.property.count({
      where: whereClause,
    })

    const totalPages = Math.ceil(totalCount / limitNum)

    res.status(200).json({
      agent,
      properties,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalCount,
        hasNextPage: pageNum < totalPages,
        hasPreviousPage: pageNum > 1,
      },
    })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching agent properties:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}
