import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { userId } = req.query

      if (!userId || typeof userId !== 'string') {
        return res.status(400).json({ error: 'Valid user ID required' })
      }

      // Get user info and forum stats
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          username: true,
          image: true,
          createdAt: true,
        },
      })

      if (!user) {
        return res.status(404).json({ error: 'User not found' })
      }

      // Get post count
      const postCount = await prisma.forumPost.count({
        where: { authorId: userId },
      })

      // Get reply count
      const replyCount = await prisma.forumReply.count({
        where: { authorId: userId },
      })

      // Get reactions received count by type
      const postReactionsReceived = await prisma.postReaction.groupBy({
        by: ['type'],
        where: {
          post: {
            authorId: userId,
          },
        },
        _count: {
          type: true,
        },
      })

      const replyReactionsReceived = await prisma.replyReaction.groupBy({
        by: ['type'],
        where: {
          reply: {
            authorId: userId,
          },
        },
        _count: {
          type: true,
        },
      })

      // Get reactions given count by type
      const postReactionsGiven = await prisma.postReaction.groupBy({
        by: ['type'],
        where: { userId },
        _count: {
          type: true,
        },
      })

      const replyReactionsGiven = await prisma.replyReaction.groupBy({
        by: ['type'],
        where: { userId },
        _count: {
          type: true,
        },
      })

      // Combine and format reaction counts
      const formatReactionCounts = (reactions: any[]) => {
        const counts = {
          THANKS: 0,
          LAUGH: 0,
          CONFUSED: 0,
          SAD: 0,
          ANGRY: 0,
          LOVE: 0,
        }
        reactions.forEach(reaction => {
          counts[reaction.type as keyof typeof counts] = reaction._count.type
        })
        return counts
      }

      const reactionsReceived = {
        ...formatReactionCounts(postReactionsReceived),
      }

      // Add reply reactions to received counts
      replyReactionsReceived.forEach(reaction => {
        reactionsReceived[reaction.type as keyof typeof reactionsReceived] += reaction._count.type
      })

      const reactionsGiven = {
        ...formatReactionCounts(postReactionsGiven),
      }

      // Add reply reactions to given counts
      replyReactionsGiven.forEach(reaction => {
        reactionsGiven[reaction.type as keyof typeof reactionsGiven] += reaction._count.type
      })

      const totalReactionsReceived = Object.values(reactionsReceived).reduce((a, b) => a + b, 0)
      const totalReactionsGiven = Object.values(reactionsGiven).reduce((a, b) => a + b, 0)

      const stats = {
        user,
        postCount,
        replyCount,
        totalPosts: postCount + replyCount,
        reactionsReceived,
        reactionsGiven,
        totalReactionsReceived,
        totalReactionsGiven,
      }

      res.status(200).json(stats)
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error fetching user forum stats:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  } else {
    res.setHeader('Allow', ['GET'])
    res.status(405).json({ error: `Method ${req.method} not allowed` })
  }
}
