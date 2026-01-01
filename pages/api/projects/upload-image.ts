import { NextApiRequest, NextApiResponse } from 'next'
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '100mb',
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

    const body = req.body as HandleUploadBody

    const jsonResponse = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (pathname: string) => {
        // Validate the pathname follows our folder structure
        // Expected format: projects/{project-name}/{folder}/{filename}
        if (!pathname.startsWith('projects/')) {
          throw new Error('Invalid upload path')
        }

        return {
          allowedContentTypes: [
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp',
            'application/pdf',
          ],
          maximumSizeInBytes: 100 * 1024 * 1024, // 100MB
          tokenPayload: JSON.stringify({
            userId: session.user.id,
          }),
        }
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // Optional: Log or track completed uploads
        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          console.log('Upload completed:', blob.url, tokenPayload)
        }
      },
    })

    return res.status(200).json(jsonResponse)
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Upload error:', error)
    return res.status(500).json({
      message: error instanceof Error ? error.message : 'Upload failed',
    })
  }
}
