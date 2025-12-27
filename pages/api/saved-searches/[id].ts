import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '@/lib/cockroachDB/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)

  if (!session?.user?.id) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  const { id } = req.query

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'Invalid saved search ID' })
  }

  // Verify the saved search belongs to the user
  const savedSearch = await prisma.savedSearch.findFirst({
    where: {
      id,
      userId: session.user.id,
    },
  })

  if (!savedSearch) {
    return res.status(404).json({ message: 'Saved search not found' })
  }

  if (req.method === 'GET') {
    return res.status(200).json({ savedSearch })
  }

  if (req.method === 'PATCH') {
    try {
      const { name, isActive } = req.body

      const updateData: { name?: string; isActive?: boolean } = {}

      if (typeof name === 'string' && name.trim()) {
        updateData.name = name.trim()
      }

      if (typeof isActive === 'boolean') {
        updateData.isActive = isActive
      }

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ message: 'No valid fields to update' })
      }

      const updatedSearch = await prisma.savedSearch.update({
        where: { id },
        data: updateData,
      })

      return res.status(200).json({
        message: 'Saved search updated successfully',
        savedSearch: updatedSearch,
      })
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.error('Error updating saved search:', error)
      }
      return res.status(500).json({ message: 'Failed to update saved search' })
    }
  }

  if (req.method === 'DELETE') {
    try {
      await prisma.savedSearch.delete({
        where: { id },
      })

      return res.status(200).json({ message: 'Saved search deleted successfully' })
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.error('Error deleting saved search:', error)
      }
      return res.status(500).json({ message: 'Failed to delete saved search' })
    }
  }

  return res.status(405).json({ message: 'Method not allowed' })
}
