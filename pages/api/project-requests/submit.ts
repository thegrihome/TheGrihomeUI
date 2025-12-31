import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '@/lib/cockroachDB/prisma'
import { sendProjectRequestEmail } from '@/lib/resend/email'
import { checkUserVerification } from '@/lib/utils/verify-user'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const session = await getServerSession(req, res, authOptions)

    if (!session?.user?.id) {
      return res.status(401).json({ message: 'Authentication required' })
    }

    // Check verification status
    const verificationCheck = await checkUserVerification(session.user.id)
    if (!verificationCheck.isVerified) {
      return res.status(403).json({ message: verificationCheck.message })
    }

    const {
      builderName,
      projectName,
      location,
      contactPersonName,
      contactPersonEmail,
      contactPersonPhone,
      builderWebsite,
      projectDescription,
      projectType,
      additionalInfo,
    } = req.body

    // Validate required fields
    if (
      !builderName ||
      !projectName ||
      !location ||
      !contactPersonName ||
      !contactPersonEmail ||
      !contactPersonPhone ||
      !projectType
    ) {
      return res.status(400).json({ message: 'Missing required fields' })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(contactPersonEmail)) {
      return res.status(400).json({ message: 'Invalid email format' })
    }

    // Create project request in database
    const projectRequest = await prisma.projectRequest.create({
      data: {
        userId: session.user.id,
        builderName,
        projectName,
        location,
        contactPersonName,
        contactPersonEmail,
        contactPersonPhone,
        builderWebsite: builderWebsite || null,
        projectDescription: projectDescription || null,
        projectType,
        additionalInfo: additionalInfo || null,
      },
    })

    // Send email notification to admin
    try {
      await sendProjectRequestEmail({
        requestId: projectRequest.id,
        submittedBy: {
          name: session.user.name || 'Unknown',
          email: session.user.email || 'Unknown',
        },
        builderName,
        builderWebsite: builderWebsite || undefined,
        projectName,
        projectType,
        location,
        projectDescription: projectDescription || undefined,
        contactPersonName,
        contactPersonEmail,
        contactPersonPhone,
        additionalInfo: additionalInfo || undefined,
      })
    } catch (emailError) {
      // Log error in development only
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.error('Failed to send email notification:', emailError)
      }
      // Don't fail the request if email fails - project is still saved
    }

    res.status(201).json({
      message: 'Project request submitted successfully',
      requestId: projectRequest.id,
    })
  } catch (error) {
    // Log error in development only
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error('Error submitting project request:', error)
    }
    res.status(500).json({ message: 'Internal server error' })
  }
}
