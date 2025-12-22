/**
 * MSG91 Configuration
 * Environment variables for MSG91 OTP service
 */

import { MSG91Config } from './types'

// Server-side configuration (API routes only)
export function getServerConfig(): MSG91Config {
  const authKey = process.env.MSG91_AUTH_KEY
  const widgetId = process.env.NEXT_PUBLIC_MSG91_WIDGET_ID
  const tokenAuth = process.env.NEXT_PUBLIC_MSG91_TOKEN_AUTH

  if (!authKey) {
    throw new Error('MSG91_AUTH_KEY is not configured')
  }

  if (!widgetId || !tokenAuth) {
    throw new Error('MSG91 widget configuration is missing')
  }

  return {
    authKey,
    widgetId,
    tokenAuth,
  }
}

// Client-side configuration (exposed via NEXT_PUBLIC_)
export function getClientConfig(): Omit<MSG91Config, 'authKey'> {
  const widgetId = process.env.NEXT_PUBLIC_MSG91_WIDGET_ID
  const tokenAuth = process.env.NEXT_PUBLIC_MSG91_TOKEN_AUTH

  if (!widgetId || !tokenAuth) {
    return {
      widgetId: '',
      tokenAuth: '',
    }
  }

  return {
    widgetId,
    tokenAuth,
  }
}

// Check if MSG91 is configured
export function isMsg91Configured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_MSG91_WIDGET_ID && process.env.NEXT_PUBLIC_MSG91_TOKEN_AUTH
  )
}

// Fallback OTP that always works (for testing/backup)
export const FALLBACK_OTP = '9848022338'
