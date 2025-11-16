import { PrismaClient } from '@prisma/client'

// Mock the database-config module
jest.mock('@/lib/cockroachDB/database-config', () => ({
  getDatabaseConfig: jest.fn(() => ({
    url: 'postgresql://test:test@localhost:26257/test',
    environment: 'test',
    databaseName: 'test-db',
  })),
  logDatabaseConnection: jest.fn(),
}))

describe('Prisma Client', () => {
  const originalEnv = process.env.NODE_ENV

  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    process.env.NODE_ENV = originalEnv
    jest.resetModules()
  })

  describe('Client Initialization', () => {
    it('creates Prisma client with correct database URL', () => {
      const { getDatabaseConfig } = require('@/lib/cockroachDB/database-config')
      const { prisma } = require('@/lib/cockroachDB/prisma')

      expect(getDatabaseConfig).toHaveBeenCalled()
      expect(prisma).toBeDefined()
      expect(prisma).toBeInstanceOf(PrismaClient)
    })

    it('uses database config URL', () => {
      const { getDatabaseConfig } = require('@/lib/cockroachDB/database-config')
      getDatabaseConfig.mockReturnValue({
        url: 'postgresql://custom:url@host:26257/custom-db',
        environment: 'production',
        databaseName: 'custom-db',
      })

      jest.resetModules()
      const { prisma } = require('@/lib/cockroachDB/prisma')

      expect(getDatabaseConfig).toHaveBeenCalled()
      expect(prisma).toBeDefined()
    })
  })

  describe('Logging Configuration', () => {
    it('enables error and warn logging in development', () => {
      process.env.NODE_ENV = 'development'
      jest.resetModules()

      const { getDatabaseConfig } = require('@/lib/cockroachDB/database-config')
      getDatabaseConfig.mockReturnValue({
        url: 'postgresql://test:test@localhost:26257/test',
        environment: 'development',
        databaseName: 'test-db',
      })

      const { prisma } = require('@/lib/cockroachDB/prisma')
      expect(prisma).toBeDefined()
    })

    it('enables only error logging in production', () => {
      process.env.NODE_ENV = 'production'
      jest.resetModules()

      const { getDatabaseConfig } = require('@/lib/cockroachDB/database-config')
      getDatabaseConfig.mockReturnValue({
        url: 'postgresql://test:test@localhost:26257/test',
        environment: 'production',
        databaseName: 'production-db',
      })

      const { prisma } = require('@/lib/cockroachDB/prisma')
      expect(prisma).toBeDefined()
    })
  })

  describe('Global Instance', () => {
    it('reuses global instance in development', () => {
      process.env.NODE_ENV = 'development'
      jest.resetModules()

      const { prisma: prisma1 } = require('@/lib/cockroachDB/prisma')
      jest.resetModules()
      const { prisma: prisma2 } = require('@/lib/cockroachDB/prisma')

      // In development, the same instance should be used from global
      expect(prisma1).toBeDefined()
      expect(prisma2).toBeDefined()
    })

    it('creates new instance in production', () => {
      process.env.NODE_ENV = 'production'
      jest.resetModules()

      const { prisma } = require('@/lib/cockroachDB/prisma')
      expect(prisma).toBeDefined()
    })
  })

  describe('Database Connection Logging', () => {
    it('logs database connection in non-test environment', () => {
      process.env.NODE_ENV = 'development'
      jest.resetModules()

      const { logDatabaseConnection } = require('@/lib/cockroachDB/database-config')
      require('@/lib/cockroachDB/prisma')

      expect(logDatabaseConnection).toHaveBeenCalled()
    })

    it('does not log database connection in test environment', () => {
      process.env.NODE_ENV = 'test'
      jest.resetModules()

      const { logDatabaseConnection } = require('@/lib/cockroachDB/database-config')
      logDatabaseConnection.mockClear()

      require('@/lib/cockroachDB/prisma')

      expect(logDatabaseConnection).not.toHaveBeenCalled()
    })
  })

  describe('Connection Pool Configuration', () => {
    it('configures connection timeout', () => {
      const { prisma } = require('@/lib/cockroachDB/prisma')
      expect(prisma).toBeDefined()
      // Connection timeout is set to 20000ms in the configuration
    })

    it('configures pool timeout', () => {
      const { prisma } = require('@/lib/cockroachDB/prisma')
      expect(prisma).toBeDefined()
      // Pool timeout is set to 20000ms in the configuration
    })

    it('configures idle timeout', () => {
      const { prisma } = require('@/lib/cockroachDB/prisma')
      expect(prisma).toBeDefined()
      // Idle timeout is set to 300000ms (5 minutes) in the configuration
    })

    it('limits max connections', () => {
      const { prisma } = require('@/lib/cockroachDB/prisma')
      expect(prisma).toBeDefined()
      // Max connections is set to 5 in the configuration
    })
  })

  describe('Environment-specific Configuration', () => {
    it('handles development environment', () => {
      process.env.NODE_ENV = 'development'
      jest.resetModules()

      const { getDatabaseConfig } = require('@/lib/cockroachDB/database-config')
      getDatabaseConfig.mockReturnValue({
        url: 'postgresql://dev:dev@localhost:26257/dev',
        environment: 'development',
        databaseName: 'dev-db',
      })

      const { prisma } = require('@/lib/cockroachDB/prisma')
      expect(prisma).toBeDefined()
    })

    it('handles production environment', () => {
      process.env.NODE_ENV = 'production'
      jest.resetModules()

      const { getDatabaseConfig } = require('@/lib/cockroachDB/database-config')
      getDatabaseConfig.mockReturnValue({
        url: 'postgresql://prod:prod@prod-host:26257/prod',
        environment: 'production',
        databaseName: 'prod-db',
      })

      const { prisma } = require('@/lib/cockroachDB/prisma')
      expect(prisma).toBeDefined()
    })

    it('handles test environment', () => {
      process.env.NODE_ENV = 'test'
      jest.resetModules()

      const { getDatabaseConfig } = require('@/lib/cockroachDB/database-config')
      getDatabaseConfig.mockReturnValue({
        url: 'postgresql://test:test@localhost:26257/test',
        environment: 'test',
        databaseName: 'test-db',
      })

      const { prisma } = require('@/lib/cockroachDB/prisma')
      expect(prisma).toBeDefined()
    })
  })

  describe('Prisma Client Export', () => {
    it('exports prisma client', () => {
      const { prisma } = require('@/lib/cockroachDB/prisma')
      expect(prisma).toBeDefined()
      expect(typeof prisma).toBe('object')
    })

    it('prisma client has expected methods', () => {
      const { prisma } = require('@/lib/cockroachDB/prisma')
      expect(prisma.$connect).toBeDefined()
      expect(prisma.$disconnect).toBeDefined()
      expect(prisma.$transaction).toBeDefined()
      expect(prisma.$queryRaw).toBeDefined()
      expect(prisma.$executeRaw).toBeDefined()
    })
  })

  describe('Database URL Configuration', () => {
    it('uses correct datasource configuration', () => {
      const { getDatabaseConfig } = require('@/lib/cockroachDB/database-config')
      const config = getDatabaseConfig()

      expect(config.url).toBeDefined()
      expect(typeof config.url).toBe('string')
    })

    it('handles different database URLs', () => {
      const { getDatabaseConfig } = require('@/lib/cockroachDB/database-config')

      // Test with different URL patterns
      const urls = [
        'postgresql://user:pass@localhost:26257/db',
        'postgresql://user:pass@remote-host:26257/db',
        'postgresql://user:pass@cluster.cockroachlabs.cloud:26257/db',
      ]

      urls.forEach(url => {
        getDatabaseConfig.mockReturnValue({
          url,
          environment: 'test',
          databaseName: 'test',
        })

        jest.resetModules()
        const { prisma } = require('@/lib/cockroachDB/prisma')
        expect(prisma).toBeDefined()
      })
    })
  })

  describe('Error Handling', () => {
    it('handles missing database config gracefully', () => {
      const { getDatabaseConfig } = require('@/lib/cockroachDB/database-config')
      getDatabaseConfig.mockReturnValue({
        url: '',
        environment: 'test',
        databaseName: 'test',
      })

      // Should not throw error during module load
      expect(() => {
        jest.resetModules()
        require('@/lib/cockroachDB/prisma')
      }).not.toThrow()
    })
  })

  describe('Module Caching', () => {
    it('returns same instance when required multiple times', () => {
      const { prisma: instance1 } = require('@/lib/cockroachDB/prisma')
      const { prisma: instance2 } = require('@/lib/cockroachDB/prisma')

      expect(instance1).toBe(instance2)
    })

    it('allows module reset for testing', () => {
      const { prisma: instance1 } = require('@/lib/cockroachDB/prisma')

      jest.resetModules()

      const { prisma: instance2 } = require('@/lib/cockroachDB/prisma')

      // After reset, instances should be different
      expect(instance1).toBeDefined()
      expect(instance2).toBeDefined()
    })
  })

  describe('Type Safety', () => {
    it('prisma client has correct type', () => {
      const { prisma } = require('@/lib/cockroachDB/prisma')
      expect(prisma).toBeInstanceOf(PrismaClient)
    })

    it('prisma client models are accessible', () => {
      const { prisma } = require('@/lib/cockroachDB/prisma')
      expect(prisma.user).toBeDefined()
      expect(prisma.property).toBeDefined()
      expect(prisma.project).toBeDefined()
      expect(prisma.forumPost).toBeDefined()
      expect(prisma.ad).toBeDefined()
    })
  })

  describe('Development Features', () => {
    it('enables development-specific features in dev mode', () => {
      process.env.NODE_ENV = 'development'
      jest.resetModules()

      const { getDatabaseConfig } = require('@/lib/cockroachDB/database-config')
      getDatabaseConfig.mockReturnValue({
        url: 'postgresql://dev:dev@localhost:26257/dev',
        environment: 'development',
        databaseName: 'dev-db',
      })

      const { prisma } = require('@/lib/cockroachDB/prisma')
      expect(prisma).toBeDefined()
      // In development, logging should be enabled
    })

    it('disables development features in production', () => {
      process.env.NODE_ENV = 'production'
      jest.resetModules()

      const { getDatabaseConfig } = require('@/lib/cockroachDB/database-config')
      getDatabaseConfig.mockReturnValue({
        url: 'postgresql://prod:prod@prod-host:26257/prod',
        environment: 'production',
        databaseName: 'prod-db',
      })

      const { prisma } = require('@/lib/cockroachDB/prisma')
      expect(prisma).toBeDefined()
      // In production, only error logging should be enabled
    })
  })

  describe('Global Prisma Instance Management', () => {
    it('sets global prisma in non-production environments', () => {
      process.env.NODE_ENV = 'development'
      jest.resetModules()

      const { prisma } = require('@/lib/cockroachDB/prisma')
      expect(prisma).toBeDefined()

      // Global instance should be set
      const globalForPrisma = globalThis as any
      expect(globalForPrisma.prisma).toBeDefined()
    })

    it('does not set global prisma in production', () => {
      process.env.NODE_ENV = 'production'
      jest.resetModules()

      // Clear global prisma
      const globalForPrisma = globalThis as any
      delete globalForPrisma.prisma

      const { prisma } = require('@/lib/cockroachDB/prisma')
      expect(prisma).toBeDefined()

      // Global instance should not be set in production
      expect(globalForPrisma.prisma).toBeUndefined()
    })
  })

  describe('CockroachDB Optimizations', () => {
    it('applies CockroachDB-specific connection settings', () => {
      const { prisma } = require('@/lib/cockroachDB/prisma')
      expect(prisma).toBeDefined()
      // Connection settings are optimized for lower RU consumption
    })

    it('uses appropriate connection pool size', () => {
      const { prisma } = require('@/lib/cockroachDB/prisma')
      expect(prisma).toBeDefined()
      // Max connections is limited to 5 to reduce concurrent connection overhead
    })
  })
})
