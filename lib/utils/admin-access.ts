/**
 * Admin Access Control Utility
 *
 * Provides centralized access control for admin features.
 * Production (grihome.com): Only thegrihome@gmail.com can access
 * Non-production (localhost, Vercel preview): Everyone can access for testing
 */

export interface AdminAccessResult {
  isProduction: boolean
  canAccessAdmin: boolean
  reason?: string
}

const ADMIN_EMAIL = 'thegrihome@gmail.com'

/**
 * Check if a user can access admin features.
 * This should be called server-side where environment variables are available.
 *
 * @param userEmail - The email of the user to check
 * @returns AdminAccessResult with access decision and reason
 */
export function checkAdminAccess(userEmail: string | null | undefined): AdminAccessResult {
  // Detect production environment
  // Production = grihome.com (main branch deployed to production)
  // Non-production = localhost, Vercel preview deployments (sai-dev, adi-dev, etc.)
  const vercelEnv = process.env.VERCEL_ENV // 'production', 'preview', 'development', or undefined
  const gitBranch = process.env.VERCEL_GIT_COMMIT_REF // e.g., 'main', 'sai-dev', 'adi-dev'

  // Only consider it production if BOTH conditions are true:
  // 1. VERCEL_ENV is 'production' (deployed to production domain)
  // 2. Branch is 'main' (not a feature branch)
  const isProduction = vercelEnv === 'production' && gitBranch === 'main'

  if (!isProduction) {
    // Non-production: Everyone can access (for testing)
    // This includes: localhost, Vercel preview, and feature branch deployments
    return {
      isProduction: false,
      canAccessAdmin: true,
      reason: `Non-production environment (${vercelEnv || 'local'}/${gitBranch || 'unknown'}) - access granted for testing`,
    }
  }

  // Production: Only specific email can access
  if (!userEmail) {
    return {
      isProduction: true,
      canAccessAdmin: false,
      reason: 'Authentication required',
    }
  }

  if (userEmail.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
    return {
      isProduction: true,
      canAccessAdmin: true,
      reason: 'Authorized admin user',
    }
  }

  return {
    isProduction: true,
    canAccessAdmin: false,
    reason: 'Not authorized for admin access',
  }
}
