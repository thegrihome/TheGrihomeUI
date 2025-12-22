import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '@/lib/cockroachDB/prisma'
import { FALLBACK_OTP } from '@/lib/msg91/config'

/**
 * Mobile Verification API
 *
 * Supports two modes:
 * 1. Verify current mobile (no newMobile param): Updates mobileVerified in DB
 * 2. Verify new mobile for profile edit (with newMobile param): Just validates OTP,
 *    doesn't update DB - the update happens when profile is saved
 *
 * OTP can be verified in two ways:
 * 1. MSG91 widget verification (otpVerified: true) - OTP already verified client-side
 * 2. Fallback OTP check - Direct OTP comparison for testing
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

    const { otp, newMobile, otpVerified } = req.body

    // If OTP was already verified via MSG91 widget, skip OTP check
    if (!otpVerified) {
      if (!otp) {
        return res.status(400).json({ message: 'OTP is required' })
      }

      // Fallback OTP check
      if (otp !== FALLBACK_OTP) {
        return res.status(400).json({ message: 'Invalid OTP' })
      }
    }

    // If verifying a NEW mobile (profile edit mode)
    if (newMobile) {
      // Check if new mobile is already taken by another user
      const existingUser = await prisma.user.findFirst({
        where: { phone: newMobile },
      })

      if (existingUser && existingUser.id !== session.user.id) {
        return res.status(400).json({ message: 'This mobile number is already in use' })
      }

      // Don't update DB - just confirm OTP is valid
      // The mobile will be updated when profile is saved
      return res.status(200).json({
        message: 'OTP verified successfully',
        verified: true,
        newMobile,
      })
    }

    // If verifying CURRENT mobile (original behavior)
    await prisma.user.update({
      where: { id: session.user.id },
      data: { mobileVerified: new Date() },
    })

    return res.status(200).json({ message: 'Mobile verified successfully' })
  } catch {
    return res.status(500).json({ message: 'Internal server error' })
  }
}
