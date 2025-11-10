import { PrismaClient } from '@prisma/client'
import { getDatabaseConfig, logDatabaseConnection } from './database-config'
import { ruMonitor } from './ru-monitor'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Get the appropriate database URL based on environment
const databaseConfig = getDatabaseConfig()

const basePrisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseConfig.url,
    },
  },
  log: databaseConfig.environment === 'development' ? ['error', 'warn'] : ['error'],
  // Optimize connection settings for lower RU consumption
  // @ts-ignore - CockroachDB specific optimizations
  __internal: {
    engine: {
      connectTimeout: 20000,
      pool: {
        timeout: 20000,
        idleTimeout: 300000,
        maxConnections: 5, // Limit concurrent connections
      },
    },
  },
})

// Create extended Prisma client with RU monitoring in development
const createPrismaClient = () => {
  if (process.env.NODE_ENV === 'development') {
    return basePrisma.$extends({
      query: {
        $allModels: {
          async $allOperations({ model, operation, args, query }) {
            const start = Date.now()
            const result = await query(args)
            const duration = Date.now() - start

            // Estimate RUs based on operation type and duration
            const estimatedRUs = estimateRUs(operation, model, duration)
            ruMonitor.logQuery(`${operation} ${model || 'unknown'}`, duration, estimatedRUs)

            return result
          },
        },
      },
    })
  }
  return basePrisma
}

// Rough RU estimation based on operation patterns
function estimateRUs(action: string, model: string, duration: number): number {
  const baseRUs: Record<string, number> = {
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

  const base = baseRUs[action] || 10

  // Adjust based on duration (slow queries likely use more RUs)
  const durationMultiplier = duration > 1000 ? 3 : duration > 500 ? 2 : 1

  // Adjust based on model complexity
  const modelMultiplier = ['Property', 'User'].includes(model) ? 1.5 : 1

  return Math.round(base * durationMultiplier * modelMultiplier)
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

// Log connection info on startup (without exposing credentials)
if (process.env.NODE_ENV !== 'test') {
  logDatabaseConnection()
}

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
