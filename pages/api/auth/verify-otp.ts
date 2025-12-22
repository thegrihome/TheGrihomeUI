/**
 * API Route: Verify OTP via MSG91
 *
 * This endpoint supports multiple verification methods:
 * 1. Direct OTP verification using MSG91's verify API (otp + identifier)
 * 2. JWT token verification from MSG91 widget (token)
 * 3. Fallback OTP for testing (otp === FALLBACK_OTP)
 *
 * POST /api/auth/verify-otp
 * Body: { otp?: string, identifier?: string, token?: string }
 * Response: { success: boolean, message: string }
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { FALLBACK_OTP } from '@/lib/msg91/config'

interface VerifyOTPRequest {
  token?: string
  otp?: string
  identifier?: string // Mobile number or email for direct verification
}

interface VerifyOTPResponse {
  success: boolean
  message: string
  identifier?: string
  type?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<VerifyOTPResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' })
  }

  const { token, otp, identifier } = req.body as VerifyOTPRequest

  // Check for fallback OTP (for testing/backup purposes)
  if (otp === FALLBACK_OTP) {
    return res.status(200).json({
      success: true,
      message: 'OTP verified successfully (fallback)',
    })
  }

  const authKey = process.env.MSG91_AUTH_KEY

  // MSG91 must be configured
  if (!authKey) {
    return res.status(500).json({
      success: false,
      message: 'MSG91 is not configured.',
    })
  }

  try {
    // Method 1: Verify JWT token from widget
    if (token) {
      const response = await fetch('https://control.msg91.com/api/v5/widget/verifyAccessToken', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          authkey: authKey,
          'access-token': token,
        }),
      })

      const data = await response.json()

      if (!response.ok || data.type === 'error') {
        return res.status(400).json({
          success: false,
          message: data.message || 'Token verification failed',
        })
      }

      return res.status(200).json({
        success: true,
        message: 'Token verified successfully',
        identifier: data.identifier,
        type: data.type,
      })
    }

    // Method 2: Direct OTP verification using MSG91 API
    if (otp && identifier) {
      const isEmail = identifier.includes('@')
      const params = isEmail
        ? `email=${encodeURIComponent(identifier)}&otp=${otp}`
        : `mobile=${identifier}&otp=${otp}`

      const response = await fetch(`https://control.msg91.com/api/v5/otp/verify?${params}`, {
        method: 'GET',
        headers: {
          authkey: authKey,
        },
      })

      const data = await response.json()

      if (data.type === 'error' || data.message !== 'OTP verified successfully') {
        return res.status(400).json({
          success: false,
          message: data.message || 'Invalid OTP',
        })
      }

      return res.status(200).json({
        success: true,
        message: 'OTP verified successfully',
        identifier,
        type: isEmail ? 'email' : 'mobile',
      })
    }

    return res.status(400).json({
      success: false,
      message: 'OTP and identifier are required',
    })
  } catch {
    return res.status(500).json({
      success: false,
      message: 'Verification failed. Please try again.',
    })
  }
}
