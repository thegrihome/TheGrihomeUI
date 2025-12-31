import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '@/lib/cockroachDB/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const session = await getServerSession(req, res, authOptions)

    if (!session || !session.user?.id) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { projectId, propertyId } = req.query

    if (!projectId && !propertyId) {
      return res.status(400).json({ error: 'Either projectId or propertyId is required' })
    }

    if (projectId && propertyId) {
      return res
        .status(400)
        .json({ error: 'Cannot check both project and property simultaneously' })
    }

    // Check if user has already expressed interest
    const existingInterest = await prisma.interest.findFirst({
      where: {
        userId: session.user.id,
        ...(projectId ? { projectId: projectId as string } : { propertyId: propertyId as string }),
      },
      select: {
        id: true,
        createdAt: true,
      },
    })

    res.status(200).json({
      hasExpressed: !!existingInterest,
      interest: existingInterest || null,
    })
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
}
