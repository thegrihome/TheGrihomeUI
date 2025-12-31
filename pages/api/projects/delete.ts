import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/cockroachDB/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { projectId } = req.body

    if (!projectId) {
      return res.status(400).json({ message: 'Project ID is required' })
    }

    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { name: true },
    })

    if (!project) {
      return res.status(404).json({ message: 'Project not found' })
    }

    // Delete the project
    const deletedProject = await prisma.project.delete({
      where: { id: projectId },
    })

    res.status(200).json({
      message: 'Project deleted successfully',
      project: deletedProject,
    })
  } catch (error) {
    res.status(500).json({
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    })
  }
}
