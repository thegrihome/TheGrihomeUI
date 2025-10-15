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
    const { totalDays = 5 } = req.body

    if (!projectId || typeof projectId !== 'string') {
      return res.status(400).json({ message: 'Invalid project ID' })
    }

    // Validate totalDays (max 5 days)
    const days = parseInt(String(totalDays))
    if (isNaN(days) || days < 1 || days > 5) {
      return res.status(400).json({ message: 'Total days must be between 1 and 5' })
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
      return res.status(403).json({ message: 'Only agents can promote themselves' })
    }

    // Check if project agent registration exists
    const projectAgent = await prisma.projectAgent.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: user.id,
        },
      },
    })

    if (!projectAgent) {
      return res
        .status(404)
        .json({ message: 'You must register as an agent for this project first' })
    }

    // Calculate dates
    const startDate = new Date()
    const endDate = new Date()
    endDate.setDate(startDate.getDate() + days)

    // Payment amount is 0 for now
    const totalAmount = 0

    // Update project agent with promotion
    const updatedProjectAgent = await prisma.projectAgent.update({
      where: { id: projectAgent.id },
      data: {
        isPromoted: true,
        promotionStartDate: startDate,
        promotionEndDate: endDate,
        promotionPaymentAmount: totalAmount,
      },
    })

    return res.status(200).json({
      message: 'Agent promoted successfully',
      promotion: {
        id: updatedProjectAgent.id,
        startDate: updatedProjectAgent.promotionStartDate,
        endDate: updatedProjectAgent.promotionEndDate,
        totalAmount: updatedProjectAgent.promotionPaymentAmount,
        totalDays: days,
      },
    })
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' })
  }
}
