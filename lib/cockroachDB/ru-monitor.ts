/**
 * Request Units (RU) monitoring utilities for CockroachDB
 * Helps track and optimize database usage
 */

interface QueryMetrics {
  query: string
  duration: number
  timestamp: Date
  estimatedRUs?: number
}

class RUMonitor {
  private queries: QueryMetrics[] = []
  private readonly maxQueries = 100 // Keep last 100 queries in memory

  // Log query execution for RU tracking
  logQuery(query: string, duration: number, estimatedRUs?: number) {
    if (process.env.NODE_ENV !== 'development') return

    const metric: QueryMetrics = {
      query: this.sanitizeQuery(query),
      duration,
      timestamp: new Date(),
      estimatedRUs,
    }

    this.queries.push(metric)

    // Keep only recent queries
    if (this.queries.length > this.maxQueries) {
      this.queries.shift()
    }

    // Log expensive queries
    if (duration > 1000 || (estimatedRUs && estimatedRUs > 100)) {
      // eslint-disable-next-line no-console
      console.warn(`🐌 Slow query detected:`, {
        query: metric.query,
        duration: `${duration}ms`,
        estimatedRUs: estimatedRUs || 'unknown',
      })
    }
  }

  // Get query statistics
  getStats() {
    if (this.queries.length === 0) return null

    const totalDuration = this.queries.reduce((sum, q) => sum + q.duration, 0)
    const avgDuration = totalDuration / this.queries.length
    const slowQueries = this.queries.filter(q => q.duration > 500)

    return {
      totalQueries: this.queries.length,
      avgDuration: Math.round(avgDuration),
      slowQueries: slowQueries.length,
      totalDuration,
      recentQueries: this.queries.slice(-10),
    }
  }

  // Sanitize query for logging (remove sensitive data)
  private sanitizeQuery(query: string): string {
    return query
      .replace(/VALUES\s*\([^)]+\)/gi, 'VALUES (...)')
      .replace(/'[^']*'/g, "'***'")
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 200)
  }

  // Clear stored queries
  clear() {
    this.queries = []
  }
}

export const ruMonitor = new RUMonitor()

// Prisma middleware to track query performance
export function createRUMiddleware() {
  return async (params: any, next: any) => {
    const start = Date.now()
    const result = await next(params)
    const duration = Date.now() - start

    // Estimate RUs based on operation type and duration
    const estimatedRUs = estimateRUs(params.action, params.model, duration)

    ruMonitor.logQuery(`${params.action} ${params.model || 'unknown'}`, duration, estimatedRUs)

    return result
  }
}

// Rough RU estimation based on operation patterns
function estimateRUs(action: string, model: string, duration: number): number {
  const baseRUs = {
    findMany: 10,
    findUnique: 5,
    findFirst: 8,
    create: 15,
    createMany: 25,
    update: 12,
    updateMany: 20,
    delete: 8,
    deleteMany: 15,
    count: 5,
    aggregate: 15,
  }

  const base = baseRUs[action as keyof typeof baseRUs] || 10

  // Adjust based on duration (slow queries likely use more RUs)
  const durationMultiplier = duration > 1000 ? 3 : duration > 500 ? 2 : 1

  // Adjust based on model complexity
  const modelMultiplier = ['Property', 'User'].includes(model) ? 1.5 : 1

  return Math.round(base * durationMultiplier * modelMultiplier)
}

// Helper to log RU usage in API routes
export function logAPIMetrics(route: string, startTime: number) {
  if (process.env.NODE_ENV !== 'development') return

  const duration = Date.now() - startTime
  const stats = ruMonitor.getStats()

  if (duration > 2000 || (stats && stats.slowQueries > 0)) {
    // eslint-disable-next-line no-console
    console.log(`📊 API Route: ${route}`, {
      duration: `${duration}ms`,
      dbQueries: stats?.totalQueries || 0,
      slowQueries: stats?.slowQueries || 0,
    })
  }
}

// Connection pool monitoring
export function logConnectionStats() {
  if (process.env.NODE_ENV !== 'development') return

  // eslint-disable-next-line no-console
  console.log(`🔌 Database connections: Active connections should be ≤ 5`)
}
