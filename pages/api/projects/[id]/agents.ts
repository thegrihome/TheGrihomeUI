import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/cockroachDB/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { id: projectId } = req.query

    if (!projectId || typeof projectId !== 'string') {
      return res.status(400).json({ message: 'Invalid project ID' })
    }

    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    })

    if (!project) {
      return res.status(404).json({ message: 'Project not found' })
    }

    // Get all agents for this project
    const projectAgents = await prisma.projectAgent.findMany({
      where: {
        projectId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            email: true,
            phone: true,
            image: true,
            companyName: true,
            licenseNumber: true,
            role: true,
          },
        },
      },
      orderBy: [
        {
          isPromoted: 'desc',
        },
        {
          promotionEndDate: 'desc',
        },
        {
          registeredAt: 'desc',
        },
      ],
    })

    // Check if promotions have expired and update them
    const now = new Date()
    for (const agent of projectAgents) {
      if (agent.isPromoted && agent.promotionEndDate && agent.promotionEndDate < now) {
        await prisma.projectAgent.update({
          where: { id: agent.id },
          data: {
            isPromoted: false,
            promotionStartDate: null,
            promotionEndDate: null,
          },
        })
        agent.isPromoted = false
      }
    }

    // Format response
    const agents = projectAgents.map(pa => ({
      id: pa.id,
      agent: {
        id: pa.user.id,
        name: pa.user.name,
        username: pa.user.username,
        email: pa.user.email,
        phone: pa.user.phone,
        image: pa.user.image,
        companyName: pa.user.companyName,
        licenseNumber: pa.user.licenseNumber,
      },
      registeredAt: pa.registeredAt,
      isFeatured: pa.isPromoted && pa.promotionEndDate && pa.promotionEndDate > now,
      promotionEndDate: pa.promotionEndDate,
    }))

    // Separate featured (top 5) and regular agents
    const featuredAgents = agents.filter(a => a.isFeatured).slice(0, 5)
    const regularAgents = agents.filter(a => !a.isFeatured)

    return res.status(200).json({
      featuredAgents,
      regularAgents,
      totalAgents: agents.length,
    })
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' })
  }
}
