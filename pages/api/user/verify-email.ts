import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '@/lib/cockroachDB/prisma'

/**
 * Email Verification API
 *
 * Supports two modes:
 * 1. Verify current email (no newEmail param): Updates emailVerified in DB
 * 2. Verify new email for profile edit (with newEmail param): Just validates OTP,
 *    doesn't update DB - the update happens when profile is saved
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const session = await getServerSession(req, res, authOptions)

    if (!session?.user?.id) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const { otp, newEmail } = req.body

    if (!otp) {
      return res.status(400).json({ message: 'OTP is required' })
    }

    // Development OTP: 9848022338
    if (otp !== '9848022338') {
      return res.status(400).json({ message: 'Invalid OTP' })
    }

    // If verifying a NEW email (profile edit mode)
    if (newEmail) {
      // Check if new email is already taken by another user
      const existingUser = await prisma.user.findUnique({
        where: { email: newEmail },
      })

      if (existingUser && existingUser.id !== session.user.id) {
        return res.status(400).json({ message: 'This email is already in use' })
      }

      // Don't update DB - just confirm OTP is valid
      // The email will be updated when profile is saved
      return res.status(200).json({
        message: 'OTP verified successfully',
        verified: true,
        newEmail,
      })
    }

    // If verifying CURRENT email (original behavior)
    await prisma.user.update({
      where: { id: session.user.id },
      data: { emailVerified: new Date() },
    })

    return res.status(200).json({ message: 'Email verified successfully' })
  } catch {
    return res.status(500).json({ message: 'Internal server error' })
  }
}
