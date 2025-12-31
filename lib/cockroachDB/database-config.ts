/**
 * Database configuration that automatically selects the correct database
 * based on the deployment environment without storing secrets in code
 */

interface DatabaseConfig {
  url: string
  environment: 'development' | 'production'
}

/**
 * Get database configuration based on environment
 * - Main branch: Uses production CockroachDB cluster (grihome.com)
 * - Other branches: Uses development CockroachDB cluster
 */
export function getDatabaseConfig(): DatabaseConfig {
  // Use production database for main branch deployments (regardless of VERCEL_ENV)
  // VERCEL_GIT_COMMIT_REF is set by Vercel to the branch name
  const isMainBranch = process.env.VERCEL_GIT_COMMIT_REF === 'main'

  // Also check VERCEL_ENV for production deployments (fallback)
  const isVercelProduction = process.env.VERCEL_ENV === 'production'

  // Use prod database if it's main branch OR production environment
  const useProduction = isMainBranch || isVercelProduction

  if (useProduction) {
    // Production - use prod database
    const prodUrl = process.env.DATABASE_URL_PROD
    if (!prodUrl) {
      throw new Error('DATABASE_URL_PROD environment variable is required for production')
    }
    return {
      url: prodUrl,
      environment: 'production',
    }
  } else {
    // Development/preview/local - use dev database
    const devUrl = process.env.DATABASE_URL || process.env.DATABASE_URL_DEV
    if (!devUrl) {
      throw new Error(
        'DATABASE_URL or DATABASE_URL_DEV environment variable is required for development'
      )
    }
    return {
      url: devUrl,
      environment: 'development',
    }
  }
}

/**
 * Log database connection info (without exposing credentials)
 */
export function logDatabaseConnection(): void {
  const config = getDatabaseConfig()
  const sanitizedUrl = config.url.replace(/:\/\/[^@]+@/, '://***:***@')

  // Only log in development environment
  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.log(`🗃️  Database Environment: ${config.environment}`)
    // eslint-disable-next-line no-console
    console.log(`🔗 Database Host: ${sanitizedUrl.split('@')[1]?.split('/')[0] || 'unknown'}`)
  }
}
