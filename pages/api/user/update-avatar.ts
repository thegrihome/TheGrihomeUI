import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { put } from '@vercel/blob'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '@/lib/cockroachDB/prisma'

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const session = await getServerSession(req, res, authOptions)

    if (!session?.user?.email) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const { imageData } = req.body

    if (!imageData) {
      return res.status(400).json({ message: 'Image data is required' })
    }

    // Validate base64 format
    if (!imageData.startsWith('data:image/')) {
      return res.status(400).json({ message: 'Invalid image format' })
    }

    // Convert base64 to buffer
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '')
    const buffer = Buffer.from(base64Data, 'base64')

    // Upload to Vercel Blob
    const filename = `user-avatars/${session.user.id || session.user.email}-${Date.now()}.jpg`
    const blob = await put(filename, buffer, {
      access: 'public',
      contentType: 'image/jpeg',
    })

    // Update user with blob URL
    const user = await prisma.user.update({
      where: { email: session.user.email },
      data: { image: blob.url },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        image: true,
      },
    })

    res.status(200).json({ user })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error updating avatar:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}
