import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const session = await getServerSession(req, res, authOptions)
      if (!session?.user?.id) {
        return res.status(401).json({ error: 'Authentication required' })
      }

      const { postId, type } = req.body

      if (!postId || !type) {
        return res.status(400).json({ error: 'Missing required fields' })
      }

      // Check if reaction already exists
      const existingReaction = await prisma.postReaction.findUnique({
        where: {
          postId_userId_type: {
            postId,
            userId: session.user.id,
            type,
          },
        },
      })

      if (existingReaction) {
        // Remove reaction if it already exists
        await prisma.postReaction.delete({
          where: { id: existingReaction.id },
        })
        res.status(200).json({ action: 'removed', type })
      } else {
        // Add new reaction
        const reaction = await prisma.postReaction.create({
          data: {
            postId,
            userId: session.user.id,
            type,
          },
          include: {
            user: {
              select: { id: true, username: true },
            },
          },
        })
        res.status(201).json({ action: 'added', reaction })
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error handling post reaction:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  } else {
    res.setHeader('Allow', ['POST'])
    res.status(405).json({ error: `Method ${req.method} not allowed` })
  }
}
