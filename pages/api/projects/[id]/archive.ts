import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/cockroachDB/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const session = await getServerSession(req, res, authOptions)

    if (!session?.user?.id) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const { id } = req.query
    const { isArchived } = req.body

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ message: 'Project ID is required' })
    }

    if (typeof isArchived !== 'boolean') {
      return res.status(400).json({ message: 'isArchived must be a boolean' })
    }

    // Check if project exists and user owns it
    const project = await prisma.project.findUnique({
      where: { id },
      select: {
        postedByUserId: true,
        isArchived: true,
      },
    })

    if (!project) {
      return res.status(404).json({ message: 'Project not found' })
    }

    if (project.postedByUserId !== session.user.id) {
      return res.status(403).json({ message: 'You do not have permission to modify this project' })
    }

    // Update archive status
    const updatedProject = await prisma.project.update({
      where: { id },
      data: { isArchived },
      include: {
        location: true,
        builder: true,
      },
    })

    res.status(200).json({
      message: isArchived ? 'Project archived successfully' : 'Project unarchived successfully',
      project: updatedProject,
    })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Archive project error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}
