/**
 * MSG91 Client-side utilities
 * Use these functions in React components
 *
 * The MSG91 widget is loaded globally in _document.tsx with exposeMethods: true
 * This file provides typed wrappers around the global window methods.
 */

import { MSG91_CHANNELS, RetryChannel } from './types'

// Extend Window interface for MSG91 methods
declare global {
  interface Window {
    sendOtp?: (
      identifier: string,
      success?: (data: unknown) => void,
      failure?: (error: unknown) => void
    ) => void
    verifyOtp?: (
      otp: string | number,
      success?: (data: unknown) => void,
      failure?: (error: unknown) => void,
      reqId?: string
    ) => void
    retryOtp?: (
      channel: string | null,
      success?: (data: unknown) => void,
      failure?: (error: unknown) => void,
      reqId?: string
    ) => void
  }
}

/**
 * Initialize MSG91 OTP Widget
 * Widget is loaded globally in _document.tsx, this just waits for it to be ready
 */
export function initializeMSG91Widget(): Promise<boolean> {
  return new Promise(resolve => {
    // Check if already available
    if (typeof window.sendOtp === 'function') {
      resolve(true)
      return
    }

    // Wait for it to load (loaded in _document.tsx)
    let attempts = 0
    const maxAttempts = 50 // 5 seconds max
    const checkInterval = setInterval(() => {
      attempts++
      if (typeof window.sendOtp === 'function') {
        clearInterval(checkInterval)
        resolve(true)
      } else if (attempts >= maxAttempts) {
        clearInterval(checkInterval)
        resolve(false)
      }
    }, 100)
  })
}

/**
 * Send OTP to identifier (email or mobile)
 * Mobile numbers should include country code without + (e.g., 919999999999)
 */
export async function sendOTP(identifier: string): Promise<{ success: boolean; message: string }> {
  // Ensure widget is loaded and initialized
  const initialized = await initializeMSG91Widget()

  if (!initialized || !window.sendOtp) {
    return { success: false, message: 'OTP service not available. Please refresh the page.' }
  }

  // Small delay to ensure widget is fully ready
  await new Promise(resolve => setTimeout(resolve, 100))

  return new Promise(resolve => {
    window.sendOtp!(
      identifier,
      () => {
        resolve({ success: true, message: 'OTP sent successfully' })
      },
      (error: unknown) => {
        const errorMsg =
          error && typeof error === 'object' && 'message' in error
            ? String((error as { message: string }).message)
            : 'Failed to send OTP'
        resolve({ success: false, message: errorMsg })
      }
    )
  })
}

/**
 * Verify OTP entered by user
 * Returns a JWT token on success that can be verified server-side
 */
export async function verifyOTP(
  otp: string,
  _requestId?: string,
  _identifier?: string
): Promise<{ success: boolean; message: string; token?: string }> {
  // Ensure widget is initialized
  if (!window.verifyOtp) {
    await initializeMSG91Widget()
  }

  if (!window.verifyOtp) {
    return { success: false, message: 'OTP service not available. Please refresh the page.' }
  }

  return new Promise(resolve => {
    window.verifyOtp!(
      otp,
      (data: unknown) => {
        const token =
          data && typeof data === 'object' && 'token' in data
            ? String((data as { token: string }).token)
            : undefined
        resolve({ success: true, message: 'OTP verified successfully', token })
      },
      (error: unknown) => {
        const errorMsg =
          error && typeof error === 'object' && 'message' in error
            ? String((error as { message: string }).message)
            : 'Invalid OTP'
        resolve({ success: false, message: errorMsg })
      }
    )
  })
}

/**
 * Retry OTP via different channel
 * @param channel - 'sms' | 'voice' | 'email' | 'whatsapp' or null for default
 */
export async function retryOTP(
  channel?: RetryChannel,
  _requestId?: string,
  identifier?: string
): Promise<{ success: boolean; message: string }> {
  if (!window.retryOtp) {
    // Fallback: just send OTP again
    if (identifier) {
      return sendOTP(identifier)
    }
    return { success: false, message: 'Cannot resend OTP. Please try again.' }
  }

  return new Promise(resolve => {
    const channelValue = channel ? MSG91_CHANNELS[channel] : null

    window.retryOtp!(
      channelValue,
      () => {
        resolve({ success: true, message: 'OTP resent successfully' })
      },
      (error: unknown) => {
        const errorMsg =
          error && typeof error === 'object' && 'message' in error
            ? String((error as { message: string }).message)
            : 'Failed to resend OTP'
        resolve({ success: false, message: errorMsg })
      }
    )
  })
}

/**
 * Format phone number for MSG91
 * Removes + and any formatting characters
 */
export function formatPhoneForMSG91(phone: string, countryCode?: string): string {
  let formatted = phone.replace(/^\+/, '')
  formatted = formatted.replace(/[\s\-()]/g, '')

  if (countryCode && !formatted.startsWith(countryCode.replace(/^\+/, ''))) {
    formatted = countryCode.replace(/^\+/, '') + formatted
  }

  return formatted
}
