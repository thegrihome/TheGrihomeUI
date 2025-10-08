import { NextApiRequest, NextApiResponse } from 'next'
import { put } from '@vercel/blob'
import { getServerSession } from 'next-auth'
import { authOptions } from './auth/[...nextauth]'

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

    if (!session?.user?.id) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const { images } = req.body

    if (!images || !Array.isArray(images)) {
      return res.status(400).json({ message: 'Images array is required' })
    }

    const imageUrls: string[] = []

    for (const imageData of images) {
      // imageData is base64 string
      const buffer = Buffer.from(imageData.data.split(',')[1], 'base64')
      const filename = `properties/${session.user.id}-${Date.now()}-${imageData.name}`

      const blob = await put(filename, buffer, {
        access: 'public',
        contentType: imageData.type,
      })

      imageUrls.push(blob.url)
    }

    return res.status(200).json({ imageUrls })
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' })
  }
}
