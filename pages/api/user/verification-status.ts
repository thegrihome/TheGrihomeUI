import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const session = await getServerSession(req, res, authOptions)

      if (!session?.user?.id) {
        return res.status(401).json({ error: 'Authentication required' })
      }

      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          emailVerified: true,
          mobileVerified: true,
        },
      })

      if (!user) {
        return res.status(404).json({ error: 'User not found' })
      }

      res.status(200).json({
        emailVerified: user.emailVerified,
        mobileVerified: user.mobileVerified,
      })
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error fetching user verification status:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  } else {
    res.setHeader('Allow', ['GET'])
    res.status(405).json({ error: `Method ${req.method} not allowed` })
  }
}
