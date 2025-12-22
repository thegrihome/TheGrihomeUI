/**
 * API Route: Send OTP via MSG91
 *
 * This endpoint sends OTP via MSG91's direct OTP API (not widget API)
 * Uses the sendotp.msg91.com endpoint which doesn't require captcha
 *
 * POST /api/auth/send-otp
 * Body: { identifier: string, type?: 'email' | 'mobile' }
 * Response: { success: boolean, message: string, requestId?: string }
 */

import type { NextApiRequest, NextApiResponse } from 'next'

interface SendOTPRequest {
  identifier: string
  type?: 'email' | 'mobile'
}

interface SendOTPResponse {
  success: boolean
  message: string
  requestId?: string
}

// Store request IDs for verification (in production, use Redis or similar)
const otpRequests = new Map<string, { requestId: string; timestamp: number }>()

export default async function handler(req: NextApiRequest, res: NextApiResponse<SendOTPResponse>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' })
  }

  const { identifier, type } = req.body as SendOTPRequest

  if (!identifier) {
    return res.status(400).json({ success: false, message: 'Identifier is required' })
  }

  // Determine type from identifier if not provided
  const identifierType = type || (identifier.includes('@') ? 'email' : 'mobile')

  const authKey = process.env.MSG91_AUTH_KEY

  // MSG91 must be configured
  if (!authKey) {
    return res.status(500).json({
      success: false,
      message: 'MSG91 is not configured. Please set MSG91_AUTH_KEY.',
    })
  }

  try {
    // MSG91 requires different endpoints/params for email vs mobile
    let response: Response

    if (identifierType === 'email') {
      // For email OTP, use the sendotp endpoint with email parameter
      const url = `https://control.msg91.com/api/v5/otp?email=${encodeURIComponent(identifier)}`

      response = await fetch(url, {
        method: 'POST',
        headers: {
          authkey: authKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: identifier,
        }),
      })
    } else {
      // For mobile OTP
      const url = `https://control.msg91.com/api/v5/otp?mobile=${identifier}`

      response = await fetch(url, {
        method: 'POST',
        headers: {
          authkey: authKey,
          'Content-Type': 'application/json',
        },
      })
    }

    const data = await response.json()

    if (data.type === 'error') {
      return res.status(400).json({
        success: false,
        message: data.message || 'Failed to send OTP',
      })
    }

    // Store request ID
    if (data.request_id) {
      otpRequests.set(identifier, { requestId: data.request_id, timestamp: Date.now() })
    }

    return res.status(200).json({
      success: true,
      message: 'OTP sent successfully',
      requestId: data.request_id,
    })
  } catch {
    return res.status(500).json({
      success: false,
      message: 'Failed to send OTP. Please try again.',
    })
  }
}

// Export for use in verify endpoint
export function getStoredRequestId(identifier: string): string | null {
  const stored = otpRequests.get(identifier)
  if (stored) {
    // Clean up old entries (older than 10 minutes)
    const tenMinutes = 10 * 60 * 1000
    if (Date.now() - stored.timestamp > tenMinutes) {
      otpRequests.delete(identifier)
      return null
    }
    return stored.requestId
  }
  return null
}
