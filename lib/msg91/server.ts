/**
 * MSG91 Server-side utilities
 * Use these functions in API routes only
 */

import { getServerConfig } from './config'
import { VerifyAccessTokenResponse } from './types'

/**
 * Verify MSG91 access token on server-side
 * This should be called after client-side OTP verification
 * to validate the JWT token received from MSG91 widget
 *
 * @param accessToken - JWT token from MSG91 widget success callback
 * @returns Verification result with identifier info
 */
export async function verifyAccessToken(accessToken: string): Promise<VerifyAccessTokenResponse> {
  try {
    const config = getServerConfig()

    const response = await fetch('https://control.msg91.com/api/v5/widget/verifyAccessToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        authkey: config.authKey,
        'access-token': accessToken,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        message: data.message || 'Token verification failed',
      }
    }

    return {
      success: true,
      message: 'Token verified successfully',
      type: data.type,
      identifier: data.identifier,
    }
  } catch {
    return {
      success: false,
      message: 'Token verification failed',
    }
  }
}

/**
 * Format phone number for MSG91
 * MSG91 expects phone numbers without the + prefix
 *
 * @param phone - Phone number (may include + or country code)
 * @param countryCode - Country code if not included in phone
 * @returns Formatted phone number for MSG91
 */
export function formatPhoneForMSG91(phone: string, countryCode?: string): string {
  // Remove + if present
  let formatted = phone.replace(/^\+/, '')

  // Remove any spaces, dashes, or parentheses
  formatted = formatted.replace(/[\s\-()]/g, '')

  // If country code provided and not already in the number, prepend it
  if (countryCode && !formatted.startsWith(countryCode.replace(/^\+/, ''))) {
    formatted = countryCode.replace(/^\+/, '') + formatted
  }

  return formatted
}

/**
 * Extract identifier type from value
 *
 * @param identifier - Email or phone number
 * @returns 'email' or 'mobile'
 */
export function getIdentifierType(identifier: string): 'email' | 'mobile' {
  return identifier.includes('@') ? 'email' : 'mobile'
}
