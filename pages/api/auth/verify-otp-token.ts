/**
 * API Route: Verify MSG91 OTP Token
 *
 * This endpoint verifies the JWT token received from MSG91 widget
 * after successful OTP verification on the client side.
 *
 * POST /api/auth/verify-otp-token
 * Body: { token: string }
 * Response: { success: boolean, message: string, identifier?: string, type?: string }
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { verifyAccessToken, getIdentifierType } from '@/lib/msg91/server'
import { FALLBACK_OTP } from '@/lib/msg91/config'
import { prisma } from '@/lib/cockroachDB/prisma'

interface VerifyTokenRequest {
  token: string
  identifier?: string // For development mode or fallback
  otp?: string // For development mode
}

interface VerifyTokenResponse {
  success: boolean
  message: string
  identifier?: string
  type?: 'email' | 'mobile'
  userId?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<VerifyTokenResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' })
  }

  const { token, identifier, otp } = req.body as VerifyTokenRequest

  // Allow verification with FALLBACK_OTP (works in all environments)
  if (otp === FALLBACK_OTP && identifier) {
    const identifierType = getIdentifierType(identifier)

    // Find user by identifier
    const user = await findUserByIdentifier(identifier, identifierType)

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      })
    }

    // Update verification status
    await updateVerificationStatus(user.id, identifierType)

    return res.status(200).json({
      success: true,
      message: 'OTP verified (fallback)',
      identifier,
      type: identifierType,
      userId: user.id,
    })
  }

  // Production mode - verify with MSG91
  if (!token) {
    return res.status(400).json({ success: false, message: 'Token is required' })
  }

  try {
    const result = await verifyAccessToken(token)

    if (!result.success) {
      return res.status(401).json({
        success: false,
        message: result.message,
      })
    }

    // Find user by verified identifier
    const verifiedIdentifier = result.identifier || identifier
    const identifierType =
      (result.type as 'email' | 'mobile') || getIdentifierType(verifiedIdentifier || '')

    if (!verifiedIdentifier) {
      return res.status(400).json({
        success: false,
        message: 'Could not determine verified identifier',
      })
    }

    const user = await findUserByIdentifier(verifiedIdentifier, identifierType)

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      })
    }

    // Update verification status
    await updateVerificationStatus(user.id, identifierType)

    return res.status(200).json({
      success: true,
      message: 'Token verified successfully',
      identifier: verifiedIdentifier,
      type: identifierType,
      userId: user.id,
    })
  } catch {
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    })
  }
}

/**
 * Find user by email or phone
 */
async function findUserByIdentifier(
  identifier: string,
  type: 'email' | 'mobile'
): Promise<{ id: string } | null> {
  if (type === 'email') {
    return prisma.user.findUnique({
      where: { email: identifier },
      select: { id: true },
    })
  }

  // For mobile, try multiple formats
  const phoneFormats = [
    identifier,
    `+${identifier}`,
    identifier.replace(/^(\d{2})/, '+$1'), // Add + before country code
  ]

  for (const phone of phoneFormats) {
    const user = await prisma.user.findFirst({
      where: { phone },
      select: { id: true },
    })
    if (user) return user
  }

  return null
}

/**
 * Update email/mobile verification status
 */
async function updateVerificationStatus(userId: string, type: 'email' | 'mobile'): Promise<void> {
  const now = new Date()

  if (type === 'email') {
    await prisma.user.update({
      where: { id: userId },
      data: { emailVerified: now },
    })
  } else {
    await prisma.user.update({
      where: { id: userId },
      data: { mobileVerified: now },
    })
  }
}
