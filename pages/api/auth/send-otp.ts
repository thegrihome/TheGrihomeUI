/**
 * API Route: Send OTP
 *
 * This endpoint sends OTP:
 * - Email OTP: via Resend
 * - Mobile OTP: via MSG91
 *
 * POST /api/auth/send-otp
 * Body: { identifier: string, type?: 'email' | 'mobile' }
 * Response: { success: boolean, message: string, requestId?: string }
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { sendOtpEmail } from '@/lib/resend/email'

interface SendOTPRequest {
  identifier: string
  type?: 'email' | 'mobile'
}

interface SendOTPResponse {
  success: boolean
  message: string
  requestId?: string
}

// Store OTPs for verification (in production, use Redis or similar)
const otpStore = new Map<string, { otp: string; timestamp: number }>()

// Generate a 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

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

  try {
    if (identifierType === 'email') {
      // Generate OTP for email
      const otp = generateOTP()

      // Send email via Resend
      const result = await sendOtpEmail({
        to: identifier,
        otp,
      })

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.message || 'Failed to send OTP',
        })
      }

      // Store OTP for verification
      otpStore.set(identifier, { otp, timestamp: Date.now() })

      return res.status(200).json({
        success: true,
        message: 'OTP sent successfully',
        requestId: result.id,
      })
    } else {
      // For mobile OTP, use MSG91
      const authKey = process.env.MSG91_AUTH_KEY

      if (!authKey) {
        return res.status(500).json({
          success: false,
          message: 'MSG91 is not configured. Please set MSG91_AUTH_KEY.',
        })
      }

      const url = `https://control.msg91.com/api/v5/otp?mobile=${identifier}`

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          authkey: authKey,
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (data.type === 'error') {
        return res.status(400).json({
          success: false,
          message: data.message || 'Failed to send OTP',
        })
      }

      // Store request ID for MSG91 verification
      otpStore.set(identifier, { otp: data.request_id || '', timestamp: Date.now() })

      return res.status(200).json({
        success: true,
        message: 'OTP sent successfully',
        requestId: data.request_id,
      })
    }
  } catch {
    return res.status(500).json({
      success: false,
      message: 'Failed to send OTP. Please try again.',
    })
  }
}

// Export for use in verify endpoint
export function getStoredOtp(identifier: string): string | null {
  const stored = otpStore.get(identifier)
  if (stored) {
    // Clean up old entries (older than 10 minutes)
    const tenMinutes = 10 * 60 * 1000
    if (Date.now() - stored.timestamp > tenMinutes) {
      otpStore.delete(identifier)
      return null
    }
    return stored.otp
  }
  return null
}

// Clear OTP after successful verification
export function clearStoredOtp(identifier: string): void {
  otpStore.delete(identifier)
}
