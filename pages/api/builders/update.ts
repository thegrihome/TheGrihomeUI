import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '@/lib/cockroachDB/prisma'
import { checkUserVerification } from '@/lib/utils/verify-user'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const session = await getServerSession(req, res, authOptions)

    if (!session?.user?.email || !session?.user?.id) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    // Check verification status
    const verificationCheck = await checkUserVerification(session.user.id)
    if (!verificationCheck.isVerified) {
      return res.status(403).json({ message: verificationCheck.message })
    }

    const { id, name, description, website, builderDetails } = req.body

    if (!id) {
      return res.status(400).json({ message: 'Builder ID is required' })
    }

    // Check if builder exists
    const existingBuilder = await prisma.builder.findUnique({
      where: { id },
    })

    if (!existingBuilder) {
      return res.status(404).json({ message: 'Builder not found' })
    }

    // Update builder
    const builder = await prisma.builder.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(website !== undefined && { website: website?.trim() || null }),
        ...(builderDetails && { builderDetails }),
      },
    })

    return res.status(200).json({
      message: 'Builder updated successfully',
      builder,
    })
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' })
  }
}
