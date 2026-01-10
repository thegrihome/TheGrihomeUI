import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/cockroachDB/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { id } = req.query
    const { page = '1', limit = '12' } = req.query

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

    // Fetch projects associated with this agent via ProjectAgent
    const projectAgents = await prisma.projectAgent.findMany({
      where: {
        userId: id,
      },
      include: {
        project: {
          include: {
            location: {
              select: {
                city: true,
                state: true,
                locality: true,
              },
            },
            builder: {
              select: {
                name: true,
              },
            },
            _count: {
              select: {
                properties: true,
              },
            },
          },
        },
      },
      orderBy: {
        registeredAt: 'desc',
      },
      skip,
      take: limitNum,
    })

    // Get total count for pagination
    const totalCount = await prisma.projectAgent.count({
      where: {
        userId: id,
      },
    })

    const totalPages = Math.ceil(totalCount / limitNum)

    // Transform projects for frontend
    const projects = projectAgents.map(pa => ({
      id: pa.project.id,
      name: pa.project.name,
      location: pa.project.location
        ? {
            city: pa.project.location.city,
            state: pa.project.location.state,
            locality: pa.project.location.locality,
          }
        : null,
      builder: pa.project.builder?.name || 'Independent',
      propertyCount: pa.project._count.properties,
      registeredAt: pa.registeredAt,
      isPromoted: pa.isPromoted,
      thumbnailUrl: pa.project.thumbnailUrl,
    }))

    res.status(200).json({
      agent,
      projects,
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
    console.error('Error fetching agent projects:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}
