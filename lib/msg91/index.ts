/**
 * MSG91 OTP Integration
 *
 * This module provides OTP verification via MSG91 for both email and SMS.
 *
 * Setup:
 * 1. Add the following environment variables:
 *    - NEXT_PUBLIC_MSG91_WIDGET_ID
 *    - NEXT_PUBLIC_MSG91_TOKEN_AUTH
 *
 * Usage (Client-side):
 * ```typescript
 * import { sendOTP, verifyOTP, formatPhoneForMSG91 } from '@/lib/msg91'
 *
 * // Send OTP
 * const handleSendOTP = async () => {
 *   const phone = formatPhoneForMSG91(phoneNumber, '91')
 *   const result = await sendOTP(phone)
 * }
 *
 * // Verify OTP
 * const handleVerify = async () => {
 *   const result = await verifyOTP(otpValue)
 *   if (result.success) {
 *     // OTP is valid, proceed
 *   }
 * }
 * ```
 */

// Client-side exports
export { initializeMSG91Widget, sendOTP, verifyOTP, retryOTP, formatPhoneForMSG91 } from './client'

// Config exports
export { isMsg91Configured, FALLBACK_OTP } from './config'

// Type exports
export type {
  MSG91Config,
  SendOTPRequest,
  SendOTPResponse,
  VerifyOTPRequest,
  VerifyOTPResponse,
  RetryOTPRequest,
  RetryOTPResponse,
  RetryChannel,
  VerifyAccessTokenRequest,
  VerifyAccessTokenResponse,
} from './types'

// Note: Server-side utilities should be imported directly from '@/lib/msg91/server'
// to avoid including server-only code in client bundles
