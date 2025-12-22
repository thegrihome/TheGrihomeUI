/**
 * MSG91 OTP Integration Types
 */

export interface MSG91Config {
  widgetId: string
  tokenAuth: string
  authKey: string
}

export interface SendOTPRequest {
  identifier: string // Email or mobile number (with country code, no +)
  type: 'email' | 'mobile'
}

export interface SendOTPResponse {
  success: boolean
  message: string
  requestId?: string
}

export interface VerifyOTPRequest {
  identifier: string
  otp: string
  requestId?: string
}

export interface VerifyOTPResponse {
  success: boolean
  message: string
  token?: string // JWT token from MSG91 for server-side verification
}

export interface RetryOTPRequest {
  identifier: string
  channel?: RetryChannel
  requestId?: string
}

export type RetryChannel = 'sms' | 'voice' | 'email' | 'whatsapp'

export interface RetryOTPResponse {
  success: boolean
  message: string
  requestId?: string
}

export interface VerifyAccessTokenRequest {
  authKey: string
  accessToken: string
}

export interface VerifyAccessTokenResponse {
  success: boolean
  message: string
  type?: string // 'email' or 'mobile'
  identifier?: string
}

// Channel values for MSG91 retry
export const MSG91_CHANNELS: Record<RetryChannel, string | null> = {
  sms: '11',
  voice: '4',
  email: '3',
  whatsapp: '12',
}

// MSG91 Widget configuration interface
export interface MSG91WidgetConfig {
  widgetId: string
  tokenAuth: string
  identifier?: string
  exposeMethods: boolean
  captchaRenderId?: string
  success: (data: { message: string; token?: string }) => void
  failure: (error: { message: string }) => void
}
