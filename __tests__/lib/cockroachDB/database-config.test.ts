// Unmock this module so we can test the real implementation
jest.unmock('@/lib/cockroachDB/database-config')

import { getDatabaseConfig, logDatabaseConnection } from '@/lib/cockroachDB/database-config'

describe('lib/cockroachDB/database-config', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('getDatabaseConfig', () => {
    describe('production environment', () => {
      it('should return production config when on main branch in Vercel production', () => {
        process.env.VERCEL_ENV = 'production'
        process.env.VERCEL_GIT_COMMIT_REF = 'main'
        process.env.DATABASE_URL_PROD = 'postgresql://prod-url'

        const config = getDatabaseConfig()

        expect(config.environment).toBe('production')
        expect(config.url).toBe('postgresql://prod-url')
      })

      it('should throw error when DATABASE_URL_PROD is missing in production', () => {
        process.env.VERCEL_ENV = 'production'
        process.env.VERCEL_GIT_COMMIT_REF = 'main'
        delete process.env.DATABASE_URL_PROD

        expect(() => getDatabaseConfig()).toThrow(
          'DATABASE_URL_PROD environment variable is required for production'
        )
      })
    })

    describe('development environment', () => {
      it('should return development config when not on main branch', () => {
        process.env.VERCEL_ENV = 'preview'
        process.env.VERCEL_GIT_COMMIT_REF = 'feature-branch'
        process.env.DATABASE_URL = 'postgresql://dev-url'

        const config = getDatabaseConfig()

        expect(config.environment).toBe('development')
        expect(config.url).toBe('postgresql://dev-url')
      })

      it('should return development config when VERCEL_ENV is not production', () => {
        process.env.VERCEL_ENV = 'preview'
        process.env.VERCEL_GIT_COMMIT_REF = 'main'
        process.env.DATABASE_URL = 'postgresql://dev-url'

        const config = getDatabaseConfig()

        expect(config.environment).toBe('development')
        expect(config.url).toBe('postgresql://dev-url')
      })

      it('should use DATABASE_URL_DEV if DATABASE_URL is not set', () => {
        delete process.env.DATABASE_URL
        process.env.DATABASE_URL_DEV = 'postgresql://dev-url-alt'

        const config = getDatabaseConfig()

        expect(config.environment).toBe('development')
        expect(config.url).toBe('postgresql://dev-url-alt')
      })

      it('should prefer DATABASE_URL over DATABASE_URL_DEV', () => {
        process.env.DATABASE_URL = 'postgresql://dev-url-primary'
        process.env.DATABASE_URL_DEV = 'postgresql://dev-url-alt'

        const config = getDatabaseConfig()

        expect(config.url).toBe('postgresql://dev-url-primary')
      })

      it('should throw error when no dev database URL is available', () => {
        delete process.env.DATABASE_URL
        delete process.env.DATABASE_URL_DEV

        expect(() => getDatabaseConfig()).toThrow(
          'DATABASE_URL or DATABASE_URL_DEV environment variable is required for development'
        )
      })
    })

    describe('edge cases', () => {
      it('should return development config when on main branch but not in Vercel production', () => {
        process.env.VERCEL_ENV = 'preview'
        process.env.VERCEL_GIT_COMMIT_REF = 'main'
        process.env.DATABASE_URL = 'postgresql://dev-url'

        const config = getDatabaseConfig()

        expect(config.environment).toBe('development')
      })

      it('should return development config when in Vercel production but not on main branch', () => {
        process.env.VERCEL_ENV = 'production'
        process.env.VERCEL_GIT_COMMIT_REF = 'develop'
        process.env.DATABASE_URL = 'postgresql://dev-url'

        const config = getDatabaseConfig()

        expect(config.environment).toBe('development')
      })

      it('should handle undefined VERCEL_ENV', () => {
        delete process.env.VERCEL_ENV
        process.env.DATABASE_URL = 'postgresql://dev-url'

        const config = getDatabaseConfig()

        expect(config.environment).toBe('development')
      })

      it('should handle undefined VERCEL_GIT_COMMIT_REF', () => {
        process.env.VERCEL_ENV = 'production'
        delete process.env.VERCEL_GIT_COMMIT_REF
        process.env.DATABASE_URL = 'postgresql://dev-url'

        const config = getDatabaseConfig()

        expect(config.environment).toBe('development')
      })
    })
  })

  describe('logDatabaseConnection', () => {
    let consoleLogSpy: jest.SpyInstance

    beforeEach(() => {
      consoleLogSpy = jest.spyOn(console, 'log').mockImplementation()
    })

    afterEach(() => {
      consoleLogSpy.mockRestore()
    })

    it('should log database connection in development', () => {
      process.env.NODE_ENV = 'development'
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/dbname'

      logDatabaseConnection()

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Database Environment: development')
      )
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Database Host: localhost:5432')
      )
    })

    it('should not log database connection in production', () => {
      process.env.NODE_ENV = 'production'
      process.env.VERCEL_ENV = 'production'
      process.env.VERCEL_GIT_COMMIT_REF = 'main'
      process.env.DATABASE_URL_PROD = 'postgresql://user:pass@prod-host:5432/dbname'

      logDatabaseConnection()

      expect(consoleLogSpy).not.toHaveBeenCalled()
    })

    it('should sanitize database credentials in logs', () => {
      process.env.NODE_ENV = 'development'
      process.env.DATABASE_URL = 'postgresql://username:password@localhost:5432/dbname'

      logDatabaseConnection()

      const calls = consoleLogSpy.mock.calls
      const logMessages = calls.map(call => call.join(' ')).join(' ')

      expect(logMessages).not.toContain('username')
      expect(logMessages).not.toContain('password')
      expect(logMessages).toContain('localhost:5432')
    })

    it('should handle missing host in URL', () => {
      process.env.NODE_ENV = 'development'
      process.env.DATABASE_URL = 'postgresql://invalid-url'

      logDatabaseConnection()

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Database Host: unknown'))
    })

    it('should display production environment label correctly', () => {
      process.env.NODE_ENV = 'development'
      process.env.VERCEL_ENV = 'production'
      process.env.VERCEL_GIT_COMMIT_REF = 'main'
      process.env.DATABASE_URL_PROD = 'postgresql://user:pass@prod-host:5432/dbname'

      logDatabaseConnection()

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Database Environment: production')
      )
    })

    it('should not log in test environment', () => {
      process.env.NODE_ENV = 'test'
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/dbname'

      logDatabaseConnection()

      expect(consoleLogSpy).not.toHaveBeenCalled()
    })
  })
})
