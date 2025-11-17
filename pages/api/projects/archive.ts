import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/cockroachDB/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const session = await getServerSession(req, res, authOptions)

    if (!session?.user?.id) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const { projectId, isArchived } = req.body

    if (!projectId) {
      return res.status(400).json({ message: 'Project ID is required' })
    }

    // Find the project
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    })

    if (!project) {
      return res.status(404).json({ message: 'Project not found' })
    }

    // Check if user is the owner of the project
    if (project.postedByUserId !== session.user.id) {
      return res.status(403).json({ message: 'You do not have permission to archive this project' })
    }

    // Update the project's archived status
    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        isArchived: isArchived !== undefined ? isArchived : true,
      },
    })

    res.status(200).json({
      message: `Project ${isArchived ? 'archived' : 'restored'} successfully`,
      project: updatedProject,
    })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Archive project error:', error)
    res.status(500).json({
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    })
  }
}
