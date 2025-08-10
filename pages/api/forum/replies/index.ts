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

      // Check if user has verified email or mobile
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { emailVerified: true, mobileVerified: true },
      })

      if (!user?.emailVerified && !user?.mobileVerified) {
        return res.status(403).json({
          error: 'Email or mobile verification required to reply',
        })
      }

      const { content, postId, parentId } = req.body

      if (!content || !postId) {
        return res.status(400).json({ error: 'Missing required fields' })
      }

      // Check if post exists and is not locked
      const post = await prisma.forumPost.findUnique({
        where: { id: postId },
        select: { isLocked: true, id: true },
      })

      if (!post) {
        return res.status(404).json({ error: 'Post not found' })
      }

      if (post.isLocked) {
        return res.status(403).json({ error: 'Post is locked for replies' })
      }

      const reply = await prisma.$transaction(async tx => {
        // Create the reply
        const newReply = await tx.forumReply.create({
          data: {
            content,
            postId,
            authorId: session.user.id,
            parentId: parentId || null,
          },
          include: {
            author: {
              select: {
                id: true,
                username: true,
                image: true,
                createdAt: true,
              },
            },
          },
        })

        // Update post reply count and last reply info
        await tx.forumPost.update({
          where: { id: postId },
          data: {
            replyCount: { increment: 1 },
            lastReplyAt: new Date(),
            lastReplyBy: session.user.id,
          },
        })

        return newReply
      })

      res.status(201).json(reply)
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error creating forum reply:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  } else {
    res.setHeader('Allow', ['POST'])
    res.status(405).json({ error: `Method ${req.method} not allowed` })
  }
}
