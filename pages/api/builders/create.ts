import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '@/lib/cockroachDB/prisma'
import { put } from '@vercel/blob'
import { checkUserVerification } from '@/lib/utils/verify-user'

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

    if (!session?.user?.email || !session?.user?.id) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    // Check verification status
    const verificationCheck = await checkUserVerification(session.user.id)
    if (!verificationCheck.isVerified) {
      return res.status(403).json({ message: verificationCheck.message })
    }

    const { name, description, website, address, emails, phones, logoBase64 } = req.body

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Builder name is required' })
    }

    // Parse comma-separated emails and phones
    const emailsArray =
      emails
        ?.split(',')
        .map((email: string) => email.trim())
        .filter((email: string) => email.length > 0) || []

    const phonesArray =
      phones
        ?.split(',')
        .map((phone: string) => phone.trim())
        .filter((phone: string) => phone.length > 0) || []

    // Check if builder already exists
    const existingBuilder = await prisma.builder.findFirst({
      where: {
        name: {
          equals: name.trim(),
          mode: 'insensitive',
        },
      },
    })

    if (existingBuilder) {
      return res.status(400).json({ message: 'A builder with this name already exists' })
    }

    // Upload logo to Vercel Blob if provided
    let logoUrl: string | null = null
    if (logoBase64 && logoBase64.startsWith('data:image')) {
      try {
        // Extract base64 data
        const base64Data = logoBase64.split(',')[1]
        const buffer = Buffer.from(base64Data, 'base64')

        // Get file extension from mime type
        const mimeType = logoBase64.split(';')[0].split(':')[1]
        const extension = mimeType.split('/')[1]

        // Generate unique filename
        const filename = `builders/${name.trim().toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.${extension}`

        // Upload to Vercel Blob
        const blob = await put(filename, buffer, {
          access: 'public',
          contentType: mimeType,
        })

        logoUrl = blob.url
      } catch (uploadError) {
        // Continue without logo if upload fails
        logoUrl = null
      }
    }

    // Create builderDetails object
    const builderDetails: any = {}
    if (address?.trim()) {
      builderDetails.address = address.trim()
    }
    if (emailsArray.length > 0) {
      builderDetails.emails = emailsArray
    }
    if (phonesArray.length > 0) {
      builderDetails.phones = phonesArray
    }

    // Create builder
    const builder = await prisma.builder.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        website: website?.trim() || null,
        logoUrl,
        ...(Object.keys(builderDetails).length > 0 && {
          builderDetails,
        }),
      },
    })

    return res.status(201).json({
      message: 'Builder created successfully',
      builder: {
        id: builder.id,
        name: builder.name,
        logoUrl: builder.logoUrl,
      },
    })
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' })
  }
}
