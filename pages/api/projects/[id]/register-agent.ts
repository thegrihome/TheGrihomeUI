import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]'
import { prisma } from '@/lib/cockroachDB/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const session = await getServerSession(req, res, authOptions)

    if (!session?.user?.email) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const { id: projectId } = req.query

    if (!projectId || typeof projectId !== 'string') {
      return res.status(400).json({ message: 'Invalid project ID' })
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        role: true,
      },
    })

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    // Check if user is an agent
    if (user.role !== 'AGENT') {
      return res.status(403).json({ message: 'Only agents can register for projects' })
    }

    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, name: true },
    })

    if (!project) {
      return res.status(404).json({ message: 'Project not found' })
    }

    // Check if agent is already registered
    const existingRegistration = await prisma.projectAgent.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: user.id,
        },
      },
    })

    if (existingRegistration) {
      return res.status(400).json({ message: 'You are already registered for this project' })
    }

    // Create registration
    const projectAgent = await prisma.projectAgent.create({
      data: {
        projectId,
        userId: user.id,
      },
    })

    return res.status(201).json({
      message: 'Successfully registered as agent for this project',
      projectAgent: {
        id: projectAgent.id,
        registeredAt: projectAgent.registeredAt,
      },
    })
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' })
  }
}
