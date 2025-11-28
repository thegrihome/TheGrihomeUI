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

    const now = new Date()

    // Get only agents that have an active promotion (promotionEndDate > now)
    // Agents with expired promotions will not appear
    const projectAgents = await prisma.projectAgent.findMany({
      where: {
        projectId,
        isPromoted: true,
        promotionEndDate: {
          gt: now,
        },
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
            emailVerified: true,
            mobileVerified: true,
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

    // Format response - all agents here are actively promoted
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
        emailVerified: pa.user.emailVerified,
        mobileVerified: pa.user.mobileVerified,
      },
      registeredAt: pa.registeredAt,
      isFeatured: true, // All agents shown are featured (actively promoted)
      promotionEndDate: pa.promotionEndDate,
    }))

    // All agents are featured since we only fetch actively promoted ones
    const featuredAgents = agents.slice(0, 5)
    const regularAgents: typeof agents = [] // No regular agents anymore

    return res.status(200).json({
      featuredAgents,
      regularAgents,
      totalAgents: agents.length,
    })
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' })
  }
}
