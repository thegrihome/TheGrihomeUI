import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]'
import { prisma } from '@/lib/cockroachDB/prisma'
import { sendProjectTransactionNotification } from '@/lib/msg91/email'

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
    const { duration = 14 } = req.body

    if (!projectId || typeof projectId !== 'string') {
      return res.status(400).json({ message: 'Invalid project ID' })
    }

    // Validate duration
    const days = parseInt(String(duration))
    if (isNaN(days) || days < 1 || days > 14) {
      return res.status(400).json({ message: 'Duration must be between 1 and 14 days' })
    }

    // Get user with verification details for email notification
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        role: true,
        name: true,
        email: true,
        phone: true,
        emailVerified: true,
        mobileVerified: true,
      },
    })

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    // Check if user is an agent
    if (user.role !== 'AGENT') {
      return res.status(403).json({ message: 'Only agents can promote themselves' })
    }

    // Get project name for email notification
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { name: true },
    })

    if (!project) {
      return res.status(404).json({ message: 'Project not found' })
    }

    // Calculate dates
    const startDate = new Date()
    const endDate = new Date()
    endDate.setDate(startDate.getDate() + days)

    // Payment amount is 0 for now
    const totalAmount = 0

    // Check if project agent registration exists, if not create it
    let projectAgent = await prisma.projectAgent.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: user.id,
        },
      },
    })

    if (!projectAgent) {
      // Register the agent first
      projectAgent = await prisma.projectAgent.create({
        data: {
          projectId,
          userId: user.id,
          isPromoted: true,
          promotionStartDate: startDate,
          promotionEndDate: endDate,
          promotionPaymentAmount: totalAmount,
        },
      })
    } else {
      // Update existing registration with promotion
      projectAgent = await prisma.projectAgent.update({
        where: { id: projectAgent.id },
        data: {
          isPromoted: true,
          promotionStartDate: startDate,
          promotionEndDate: endDate,
          promotionPaymentAmount: totalAmount,
        },
      })
    }

    // Send email notification
    let emailStatus = { userEmailSent: false, adminEmailSent: false }
    try {
      emailStatus = await sendProjectTransactionNotification({
        projectName: project.name,
        user: {
          name: user.name || 'Agent',
          email: user.email,
          mobile: user.phone || '',
          isEmailVerified: user.emailVerified !== null,
          isMobileVerified: user.mobileVerified !== null,
        },
        transaction: {
          type: 'Agent Registration',
          duration: `${days} days`,
          amount: totalAmount === 0 ? 'Free' : `₹${totalAmount}`,
        },
      })
    } catch {
      // Don't fail the request if email fails
    }

    return res.status(200).json({
      message: 'Agent promoted successfully',
      promotion: {
        id: projectAgent.id,
        startDate: projectAgent.promotionStartDate,
        endDate: projectAgent.promotionEndDate,
        totalAmount: projectAgent.promotionPaymentAmount,
        totalDays: days,
      },
      emailStatus,
    })
  } catch {
    return res.status(500).json({ message: 'Internal server error' })
  }
}
