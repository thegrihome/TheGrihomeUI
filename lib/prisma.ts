import { PrismaClient } from '@prisma/client'
import { getDatabaseConfig, logDatabaseConnection } from './database-config'
import { createRUMiddleware } from './ru-monitor'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Get the appropriate database URL based on environment
const databaseConfig = getDatabaseConfig()

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
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

// Add RU monitoring middleware in development
if (process.env.NODE_ENV === 'development') {
  prisma.$use(createRUMiddleware())
}

// Log connection info on startup (without exposing credentials)
if (process.env.NODE_ENV !== 'test') {
  logDatabaseConnection()
}

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
