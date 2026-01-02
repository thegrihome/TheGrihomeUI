import { NextApiRequest, NextApiResponse } from 'next'

interface RateLimitEntry {
  count: number
  resetTime: number
}

// In-memory rate limit store (resets on server restart)
// For production with multiple instances, use Redis instead
const rateLimitStore: Map<string, RateLimitEntry> = new Map()

// Clean up expired entries periodically
const CLEANUP_INTERVAL = 60 * 1000 // 1 minute
if (typeof setInterval !== 'undefined' && process.env.NODE_ENV !== 'test') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of rateLimitStore.entries()) {
      if (entry.resetTime < now) {
        rateLimitStore.delete(key)
      }
    }
  }, CLEANUP_INTERVAL)
}

interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Max requests per window
  keyPrefix?: string // Optional prefix for rate limit key
}

// Default configs for different endpoint types
export const RATE_LIMITS = {
  // Forum write operations - stricter limits
  forumPost: { windowMs: 60 * 1000, maxRequests: 10, keyPrefix: 'forum-post' },
  forumReply: { windowMs: 60 * 1000, maxRequests: 30, keyPrefix: 'forum-reply' },
  forumReaction: { windowMs: 60 * 1000, maxRequests: 60, keyPrefix: 'forum-reaction' },

  // Property operations
  propertyCreate: { windowMs: 60 * 1000, maxRequests: 5, keyPrefix: 'property-create' },
  propertyUpdate: { windowMs: 60 * 1000, maxRequests: 20, keyPrefix: 'property-update' },
  imageUpload: { windowMs: 60 * 1000, maxRequests: 30, keyPrefix: 'image-upload' },

  // Read operations - more lenient
  read: { windowMs: 60 * 1000, maxRequests: 100, keyPrefix: 'read' },

  // Search operations
  search: { windowMs: 60 * 1000, maxRequests: 30, keyPrefix: 'search' },

  // Auth operations - strict to prevent brute force
  auth: { windowMs: 60 * 1000, maxRequests: 10, keyPrefix: 'auth' },
} as const

function getClientIdentifier(req: NextApiRequest, userId?: string): string {
  // Prefer user ID if authenticated
  if (userId) {
    return `user:${userId}`
  }

  // Fall back to IP address
  const forwarded = req.headers['x-forwarded-for']
  const ip =
    typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : req.socket.remoteAddress
  return `ip:${ip || 'unknown'}`
}

export function checkRateLimit(
  req: NextApiRequest,
  config: RateLimitConfig,
  userId?: string
): { allowed: boolean; remaining: number; resetTime: number } {
  const clientId = getClientIdentifier(req, userId)
  const key = `${config.keyPrefix || 'default'}:${clientId}`
  const now = Date.now()

  let entry = rateLimitStore.get(key)

  // Reset if window has passed
  if (!entry || entry.resetTime < now) {
    entry = {
      count: 0,
      resetTime: now + config.windowMs,
    }
  }

  entry.count++
  rateLimitStore.set(key, entry)

  const remaining = Math.max(0, config.maxRequests - entry.count)
  const allowed = entry.count <= config.maxRequests

  return { allowed, remaining, resetTime: entry.resetTime }
}

export function withRateLimit(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void,
  config: RateLimitConfig,
  getUserId?: (req: NextApiRequest) => string | undefined
): (req: NextApiRequest, res: NextApiResponse) => Promise<void> {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const userId = getUserId ? getUserId(req) : undefined
    const { allowed, remaining, resetTime } = checkRateLimit(req, config, userId)

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', config.maxRequests)
    res.setHeader('X-RateLimit-Remaining', remaining)
    res.setHeader('X-RateLimit-Reset', Math.ceil(resetTime / 1000))

    if (!allowed) {
      const retryAfter = Math.ceil((resetTime - Date.now()) / 1000)
      res.setHeader('Retry-After', retryAfter)
      return res.status(429).json({
        error: 'Too many requests',
        message: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
        retryAfter,
      })
    }

    return handler(req, res)
  }
}

// Utility to apply rate limit inline without wrapper
export function applyRateLimit(
  req: NextApiRequest,
  res: NextApiResponse,
  config: RateLimitConfig,
  userId?: string
): boolean {
  const { allowed, remaining, resetTime } = checkRateLimit(req, config, userId)

  res.setHeader('X-RateLimit-Limit', config.maxRequests)
  res.setHeader('X-RateLimit-Remaining', remaining)
  res.setHeader('X-RateLimit-Reset', Math.ceil(resetTime / 1000))

  if (!allowed) {
    const retryAfter = Math.ceil((resetTime - Date.now()) / 1000)
    res.setHeader('Retry-After', retryAfter)
    res.status(429).json({
      error: 'Too many requests',
      message: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
      retryAfter,
    })
    return false
  }

  return true
}
