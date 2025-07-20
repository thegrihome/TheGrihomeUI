import { PrismaClient } from '@prisma/client'
import { getDatabaseConfig, logDatabaseConnection } from './database-config'

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
    log: databaseConfig.environment === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

// Log connection info on startup (without exposing credentials)
if (process.env.NODE_ENV !== 'test') {
  logDatabaseConnection()
}

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
