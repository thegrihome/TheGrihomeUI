import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/cockroachDB/prisma'
import { Prisma } from '@prisma/client'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { search, company, page = '1', limit = '12' } = req.query
      const pageNum = parseInt(page as string, 10)
      const limitNum = parseInt(limit as string, 10)
      const skip = (pageNum - 1) * limitNum

      // Build where clause
      const whereClause: Prisma.UserWhereInput = {
        role: 'AGENT',
        ...(company && {
          companyName: { equals: company as string, mode: Prisma.QueryMode.insensitive },
        }),
        ...(search &&
          !company && {
            OR: [
              { name: { contains: search as string, mode: Prisma.QueryMode.insensitive } },
              { username: { contains: search as string, mode: Prisma.QueryMode.insensitive } },
              { companyName: { contains: search as string, mode: Prisma.QueryMode.insensitive } },
              { email: { contains: search as string, mode: Prisma.QueryMode.insensitive } },
            ],
          }),
      }

      // Query agents (users with AGENT role)
      const agents = await prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          username: true,
          email: true,
          phone: true,
          companyName: true,
          image: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limitNum,
      })

      // Get active properties count and projects for each agent
      const agentsWithCount = await Promise.all(
        agents.map(async agent => {
          // Get active properties count
          const activeCount = await prisma.property.count({
            where: {
              userId: agent.id,
              listingStatus: 'ACTIVE',
            },
          })

          // Get projects the agent is associated with (via ProjectAgent)
          const projectAgents = await prisma.projectAgent.findMany({
            where: {
              userId: agent.id,
            },
            include: {
              project: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
            orderBy: {
              registeredAt: 'desc',
            },
          })

          const projects = projectAgents.map(pa => ({
            id: pa.project.id,
            name: pa.project.name,
            isPromoted: pa.isPromoted,
          }))

          return {
            ...agent,
            _count: {
              listedProperties: activeCount,
            },
            projects,
            projectCount: projects.length,
          }
        })
      )

      // Get total count for pagination
      const totalCount = await prisma.user.count({
        where: whereClause,
      })

      const totalPages = Math.ceil(totalCount / limitNum)

      res.status(200).json({
        agents: agentsWithCount,
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
      console.error('Error fetching agents:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  } else {
    res.setHeader('Allow', ['GET'])
    res.status(405).json({ error: `Method ${req.method} not allowed` })
  }
}
