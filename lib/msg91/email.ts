/**
 * MSG91 Email Service
 * DEPRECATED: This module now uses Resend instead of MSG91 for email
 * MSG91 is now only used for SMS OTP and WhatsApp messaging
 *
 * Re-exports from the new Resend email utility for backwards compatibility
 */

export { sendInterestNotification, sendProjectTransactionNotification } from '@/lib/resend/email'

export interface EmailRecipient {
  email: string
  name: string
}

export interface SendEmailResult {
  success: boolean
  message: string
}
