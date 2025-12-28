import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]'
import { prisma } from '@/lib/cockroachDB/prisma'
import { sendAgentContactNotification } from '@/lib/resend/email'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const session = await getServerSession(req, res, authOptions)
  if (!session?.user?.id) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  const { id: projectId } = req.query
  const { agentId } = req.body

  if (!agentId) {
    return res.status(400).json({ message: 'Agent ID is required' })
  }

  try {
    // Get project details
    const project = await prisma.project.findUnique({
      where: { id: projectId as string },
      select: { name: true },
    })

    if (!project) {
      return res.status(404).json({ message: 'Project not found' })
    }

    // Get agent details
    const agent = await prisma.user.findUnique({
      where: { id: agentId },
      select: {
        name: true,
        email: true,
        phone: true,
        emailVerified: true,
        mobileVerified: true,
      },
    })

    if (!agent) {
      return res.status(404).json({ message: 'Agent not found' })
    }

    // Get current user details
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
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

    // Send notifications
    const results = await sendAgentContactNotification({
      projectName: project.name,
      agent: {
        name: agent.name || 'Agent',
        email: agent.email,
        phone: agent.phone || '',
        isEmailVerified: !!agent.emailVerified,
        isMobileVerified: !!agent.mobileVerified,
      },
      user: {
        name: user.name || 'User',
        email: user.email,
        mobile: user.phone || '',
        isEmailVerified: !!user.emailVerified,
        isMobileVerified: !!user.mobileVerified,
      },
    })

    return res.status(200).json({
      message: 'Contact request sent successfully',
      results,
    })
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error('Error sending agent contact notification:', error)
    }
    return res.status(500).json({ message: 'Failed to send contact request' })
  }
}
