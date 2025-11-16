import {
  ruMonitor,
  createRUMiddleware,
  logAPIMetrics,
  logConnectionStats,
} from '@/lib/cockroachDB/ru-monitor'

describe('lib/cockroachDB/ru-monitor', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv }
    ruMonitor.clear()
  })

  afterEach(() => {
    process.env = originalEnv
    ruMonitor.clear()
  })

  describe('RUMonitor class', () => {
    describe('logQuery', () => {
      it('should log queries in development environment', () => {
        process.env.NODE_ENV = 'development'

        ruMonitor.logQuery('SELECT * FROM users', 100, 10)

        const stats = ruMonitor.getStats()
        expect(stats).not.toBeNull()
        expect(stats?.totalQueries).toBe(1)
      })

      it('should not log queries in production environment', () => {
        process.env.NODE_ENV = 'production'

        ruMonitor.logQuery('SELECT * FROM users', 100, 10)

        const stats = ruMonitor.getStats()
        expect(stats).toBeNull()
      })

      it('should sanitize query strings', () => {
        process.env.NODE_ENV = 'development'

        ruMonitor.logQuery("INSERT INTO users VALUES ('test', 'password')", 100)

        const stats = ruMonitor.getStats()
        expect(stats?.recentQueries[0]?.query).toContain('VALUES (...)')
        // Values are sanitized to (...) not '***'
        expect(stats?.recentQueries[0]?.query).not.toContain('test')
        expect(stats?.recentQueries[0]?.query).not.toContain('password')
      })

      it('should warn about slow queries (duration > 1000ms)', () => {
        process.env.NODE_ENV = 'development'
        const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation()

        ruMonitor.logQuery('SELECT * FROM large_table', 1500, 50)

        expect(consoleWarnSpy).toHaveBeenCalledWith(
          expect.stringContaining('Slow query detected'),
          expect.objectContaining({
            duration: '1500ms',
          })
        )

        consoleWarnSpy.mockRestore()
      })

      it('should warn about high RU queries (estimatedRUs > 100)', () => {
        process.env.NODE_ENV = 'development'
        const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation()

        ruMonitor.logQuery('SELECT * FROM users', 500, 150)

        expect(consoleWarnSpy).toHaveBeenCalledWith(
          expect.stringContaining('Slow query detected'),
          expect.objectContaining({
            estimatedRUs: 150,
          })
        )

        consoleWarnSpy.mockRestore()
      })

      it('should not warn about fast queries with low RUs', () => {
        process.env.NODE_ENV = 'development'
        const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation()

        ruMonitor.logQuery('SELECT * FROM users WHERE id = 1', 50, 5)

        expect(consoleWarnSpy).not.toHaveBeenCalled()

        consoleWarnSpy.mockRestore()
      })

      it('should limit stored queries to maxQueries (100)', () => {
        process.env.NODE_ENV = 'development'

        for (let i = 0; i < 150; i++) {
          ruMonitor.logQuery(`Query ${i}`, 10)
        }

        const stats = ruMonitor.getStats()
        expect(stats?.totalQueries).toBe(100)
      })

      it('should store query with timestamp', () => {
        process.env.NODE_ENV = 'development'
        const beforeTime = new Date()

        ruMonitor.logQuery('SELECT * FROM users', 100, 10)

        const afterTime = new Date()
        const stats = ruMonitor.getStats()
        const queryTime = stats?.recentQueries[0]?.timestamp

        expect(queryTime).toBeInstanceOf(Date)
        expect(queryTime!.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime())
        expect(queryTime!.getTime()).toBeLessThanOrEqual(afterTime.getTime())
      })

      it('should handle queries without estimatedRUs', () => {
        process.env.NODE_ENV = 'development'

        ruMonitor.logQuery('SELECT * FROM users', 100)

        const stats = ruMonitor.getStats()
        expect(stats?.recentQueries[0]?.estimatedRUs).toBeUndefined()
      })

      it('should truncate long queries to 200 characters', () => {
        process.env.NODE_ENV = 'development'
        const longQuery = 'SELECT * FROM users WHERE ' + 'a'.repeat(300)

        ruMonitor.logQuery(longQuery, 100)

        const stats = ruMonitor.getStats()
        expect(stats?.recentQueries[0]?.query.length).toBeLessThanOrEqual(200)
      })
    })

    describe('getStats', () => {
      beforeEach(() => {
        process.env.NODE_ENV = 'development'
      })

      it('should return null when no queries are logged', () => {
        const stats = ruMonitor.getStats()
        expect(stats).toBeNull()
      })

      it('should calculate total queries correctly', () => {
        ruMonitor.logQuery('Query 1', 100)
        ruMonitor.logQuery('Query 2', 200)
        ruMonitor.logQuery('Query 3', 150)

        const stats = ruMonitor.getStats()
        expect(stats?.totalQueries).toBe(3)
      })

      it('should calculate average duration correctly', () => {
        ruMonitor.logQuery('Query 1', 100)
        ruMonitor.logQuery('Query 2', 200)
        ruMonitor.logQuery('Query 3', 300)

        const stats = ruMonitor.getStats()
        expect(stats?.avgDuration).toBe(200)
      })

      it('should round average duration', () => {
        ruMonitor.logQuery('Query 1', 100)
        ruMonitor.logQuery('Query 2', 150)

        const stats = ruMonitor.getStats()
        expect(stats?.avgDuration).toBe(125)
      })

      it('should count slow queries (duration > 500ms)', () => {
        ruMonitor.logQuery('Fast query', 100)
        ruMonitor.logQuery('Slow query 1', 600)
        ruMonitor.logQuery('Slow query 2', 1000)

        const stats = ruMonitor.getStats()
        expect(stats?.slowQueries).toBe(2)
      })

      it('should calculate total duration correctly', () => {
        ruMonitor.logQuery('Query 1', 100)
        ruMonitor.logQuery('Query 2', 200)
        ruMonitor.logQuery('Query 3', 300)

        const stats = ruMonitor.getStats()
        expect(stats?.totalDuration).toBe(600)
      })

      it('should return last 10 queries in recentQueries', () => {
        for (let i = 0; i < 15; i++) {
          ruMonitor.logQuery(`Query ${i}`, 100)
        }

        const stats = ruMonitor.getStats()
        expect(stats?.recentQueries.length).toBe(10)
      })

      it('should return all queries if less than 10', () => {
        ruMonitor.logQuery('Query 1', 100)
        ruMonitor.logQuery('Query 2', 200)
        ruMonitor.logQuery('Query 3', 300)

        const stats = ruMonitor.getStats()
        expect(stats?.recentQueries.length).toBe(3)
      })
    })

    describe('clear', () => {
      it('should clear all stored queries', () => {
        process.env.NODE_ENV = 'development'

        ruMonitor.logQuery('Query 1', 100)
        ruMonitor.logQuery('Query 2', 200)

        expect(ruMonitor.getStats()).not.toBeNull()

        ruMonitor.clear()

        expect(ruMonitor.getStats()).toBeNull()
      })
    })
  })

  describe('createRUMiddleware', () => {
    it('should create middleware function', () => {
      const middleware = createRUMiddleware()
      expect(middleware).toBeInstanceOf(Function)
    })

    it('should track query execution and call next', async () => {
      process.env.NODE_ENV = 'development'
      const middleware = createRUMiddleware()
      const next = jest.fn().mockResolvedValue({ id: 1 })
      const params = { action: 'findMany', model: 'User' }

      const result = await middleware(params, next)

      expect(next).toHaveBeenCalled()
      expect(result).toEqual({ id: 1 })
    })

    it('should log query metrics', async () => {
      process.env.NODE_ENV = 'development'
      const middleware = createRUMiddleware()
      const next = jest.fn().mockResolvedValue({ id: 1 })
      const params = { action: 'findMany', model: 'User' }

      await middleware(params, next)

      const stats = ruMonitor.getStats()
      expect(stats?.totalQueries).toBe(1)
      expect(stats?.recentQueries[0]?.query).toContain('findMany User')
    })

    it('should handle queries without model', async () => {
      process.env.NODE_ENV = 'development'
      const middleware = createRUMiddleware()
      const next = jest.fn().mockResolvedValue({})
      const params = { action: 'executeRaw' }

      await middleware(params, next)

      const stats = ruMonitor.getStats()
      expect(stats?.recentQueries[0]?.query).toContain('unknown')
    })

    it('should estimate RUs based on action and model', async () => {
      process.env.NODE_ENV = 'development'
      const middleware = createRUMiddleware()
      const next = jest.fn().mockResolvedValue({})
      const params = { action: 'create', model: 'Property' }

      await middleware(params, next)

      const stats = ruMonitor.getStats()
      expect(stats?.recentQueries[0]?.estimatedRUs).toBeGreaterThan(0)
    })
  })

  describe('logAPIMetrics', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development'
    })

    it('should log slow API routes (> 2000ms)', () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation()
      const startTime = Date.now() - 2500

      logAPIMetrics('/api/properties', startTime)

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('API Route: /api/properties'),
        expect.objectContaining({
          duration: expect.stringContaining('ms'),
        })
      )

      consoleLogSpy.mockRestore()
    })

    it('should log API routes with slow queries', () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation()

      ruMonitor.logQuery('Slow query', 600)

      const startTime = Date.now() - 1000
      logAPIMetrics('/api/users', startTime)

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('API Route: /api/users'),
        expect.objectContaining({
          slowQueries: 1,
        })
      )

      consoleLogSpy.mockRestore()
    })

    it('should not log fast API routes without slow queries', () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation()

      ruMonitor.logQuery('Fast query', 100)

      const startTime = Date.now() - 500
      logAPIMetrics('/api/users', startTime)

      expect(consoleLogSpy).not.toHaveBeenCalled()

      consoleLogSpy.mockRestore()
    })

    it('should not log in production environment', () => {
      process.env.NODE_ENV = 'production'
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation()
      const startTime = Date.now() - 3000

      logAPIMetrics('/api/properties', startTime)

      expect(consoleLogSpy).not.toHaveBeenCalled()

      consoleLogSpy.mockRestore()
    })

    it('should include database query count in logs', () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation()

      ruMonitor.logQuery('Query 1', 600)
      ruMonitor.logQuery('Query 2', 700)

      const startTime = Date.now() - 2500
      logAPIMetrics('/api/properties', startTime)

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          dbQueries: 2,
        })
      )

      consoleLogSpy.mockRestore()
    })
  })

  describe('logConnectionStats', () => {
    it('should log connection stats in development', () => {
      process.env.NODE_ENV = 'development'
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation()

      logConnectionStats()

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Database connections'))

      consoleLogSpy.mockRestore()
    })

    it('should not log in production', () => {
      process.env.NODE_ENV = 'production'
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation()

      logConnectionStats()

      expect(consoleLogSpy).not.toHaveBeenCalled()

      consoleLogSpy.mockRestore()
    })

    it('should mention connection limit in message', () => {
      process.env.NODE_ENV = 'development'
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation()

      logConnectionStats()

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('≤ 5'))

      consoleLogSpy.mockRestore()
    })
  })
})
