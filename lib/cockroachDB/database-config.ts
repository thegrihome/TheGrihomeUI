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
 * - Main branch (production): Uses production CockroachDB cluster
 * - Other branches (preview/development): Uses development CockroachDB cluster
 */
export function getDatabaseConfig(): DatabaseConfig {
  // Detect if this is a Vercel production deployment (main branch)
  const isVercelProduction = process.env.VERCEL_ENV === 'production'

  // Detect if this is a main branch deployment
  const isMainBranch = process.env.VERCEL_GIT_COMMIT_REF === 'main'

  // Use production database only for main branch deployments
  const isProduction = isVercelProduction && isMainBranch

  if (isProduction) {
    // Production environment - database URL comes from Vercel environment variables
    const prodUrl = process.env.DATABASE_URL_PROD
    if (!prodUrl) {
      throw new Error('DATABASE_URL_PROD environment variable is required for production')
    }
    return {
      url: prodUrl,
      environment: 'production',
    }
  } else {
    // Development/preview/local environment - use dev database
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
