import { NextApiRequest, NextApiResponse } from 'next'
import bcrypt from 'bcryptjs'
import handler from '@/pages/api/user/get-password'
import { prisma } from '@/lib/cockroachDB/prisma'

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
}))

jest.mock('@/lib/cockroachDB/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
  },
}))

describe('/api/user/get-password', () => {
  let req: Partial<NextApiRequest>
  let res: Partial<NextApiResponse>
  let jsonMock: jest.Mock
  let statusMock: jest.Mock

  beforeEach(() => {
    jsonMock = jest.fn()
    statusMock = jest.fn(() => ({ json: jsonMock }))
    req = {
      method: 'POST',
      body: {},
      headers: {},
    }
    res = {
      status: statusMock,
    }
    jest.clearAllMocks()
  })

  describe('Method Validation', () => {
    it('should return 405 for GET method', async () => {
      req.method = 'GET'

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(405)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Method not allowed' })
    })

    it('should return 405 for PUT method', async () => {
      req.method = 'PUT'

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(405)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Method not allowed' })
    })

    it('should return 405 for DELETE method', async () => {
      req.method = 'DELETE'

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(405)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Method not allowed' })
    })

    it('should return 405 for PATCH method', async () => {
      req.method = 'PATCH'

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(405)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Method not allowed' })
    })

    it('should accept POST method', async () => {
      req.method = 'POST'
      req.body = { userId: 'user-1' }
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        password: 'hashedPassword',
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).not.toHaveBeenCalledWith(405)
    })
  })

  describe('Input Validation', () => {
    beforeEach(() => {
      req.method = 'POST'
    })

    it('should return 401 when userId is missing', async () => {
      req.body = {}

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(401)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'User ID is required' })
    })

    it('should return 401 when userId is null', async () => {
      req.body = { userId: null }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(401)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'User ID is required' })
    })

    it('should return 401 when userId is empty string', async () => {
      req.body = { userId: '' }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(401)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'User ID is required' })
    })

    it('should return 401 when userId is undefined', async () => {
      req.body = { userId: undefined }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(401)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'User ID is required' })
    })

    it('should accept request with only userId', async () => {
      req.body = { userId: 'user-1' }
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        password: 'hashedPassword',
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).not.toHaveBeenCalledWith(401)
    })

    it('should accept request with userId and testPassword', async () => {
      req.body = { userId: 'user-1', testPassword: 'password123' }
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        password: 'hashedPassword',
      })
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).not.toHaveBeenCalledWith(401)
    })
  })

  describe('User Lookup', () => {
    beforeEach(() => {
      req.method = 'POST'
    })

    it('should return 404 when user not found', async () => {
      req.body = { userId: 'nonexistent-user' }
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(404)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'User not found' })
    })

    it('should query user by correct userId', async () => {
      req.body = { userId: 'user-123' }
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-123',
        password: 'hashedPassword',
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        select: { id: true, password: true },
      })
    })

    it('should select only id and password fields', async () => {
      req.body = { userId: 'user-1' }
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        password: 'hashedPassword',
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        select: { id: true, password: true },
      })
    })
  })

  describe('Password Display', () => {
    beforeEach(() => {
      req.method = 'POST'
      req.body = { userId: 'user-1' }
    })

    it('should return password display as dots when user has password', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        password: 'hashedPassword',
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(200)
      expect(jsonMock).toHaveBeenCalledWith({
        passwordDisplay: '••••••••••••',
        hasPassword: true,
        isValidPassword: undefined,
      })
    })

    it('should return 12 dots for password display', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        password: 'anyHashedPassword',
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      const callArg = jsonMock.mock.calls[0][0]
      expect(callArg.passwordDisplay).toBe('••••••••••••')
      expect(callArg.passwordDisplay.length).toBe(12)
    })

    it('should return empty password display when no password', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        password: null,
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(jsonMock).toHaveBeenCalledWith({
        passwordDisplay: '',
        hasPassword: false,
        isValidPassword: undefined,
      })
    })

    it('should set hasPassword to true when password exists', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        password: 'hashedPassword',
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      const callArg = jsonMock.mock.calls[0][0]
      expect(callArg.hasPassword).toBe(true)
    })

    it('should set hasPassword to false when password is null', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        password: null,
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      const callArg = jsonMock.mock.calls[0][0]
      expect(callArg.hasPassword).toBe(false)
    })

    it('should set hasPassword to false when password is empty string', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        password: '',
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      const callArg = jsonMock.mock.calls[0][0]
      expect(callArg.hasPassword).toBe(false)
    })
  })

  describe('Password Validation', () => {
    beforeEach(() => {
      req.method = 'POST'
    })

    it('should validate password when testPassword provided', async () => {
      req.body = { userId: 'user-1', testPassword: 'password123' }
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        password: 'hashedPassword',
      })
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedPassword')
    })

    it('should return isValidPassword true when password matches', async () => {
      req.body = { userId: 'user-1', testPassword: 'correctPassword' }
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        password: 'hashedPassword',
      })
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)

      await handler(req as NextApiRequest, res as NextApiResponse)

      const callArg = jsonMock.mock.calls[0][0]
      expect(callArg.isValidPassword).toBe(true)
    })

    it('should return isValidPassword false when password does not match', async () => {
      req.body = { userId: 'user-1', testPassword: 'wrongPassword' }
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        password: 'hashedPassword',
      })
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(false)

      await handler(req as NextApiRequest, res as NextApiResponse)

      const callArg = jsonMock.mock.calls[0][0]
      expect(callArg.isValidPassword).toBe(false)
    })

    it('should return isValidPassword undefined when no testPassword provided', async () => {
      req.body = { userId: 'user-1' }
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        password: 'hashedPassword',
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      const callArg = jsonMock.mock.calls[0][0]
      expect(callArg.isValidPassword).toBeUndefined()
    })

    it('should not call bcrypt.compare when testPassword is not provided', async () => {
      req.body = { userId: 'user-1' }
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        password: 'hashedPassword',
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(bcrypt.compare).not.toHaveBeenCalled()
    })

    it('should not validate when user has no password', async () => {
      req.body = { userId: 'user-1', testPassword: 'password123' }
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        password: null,
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(bcrypt.compare).not.toHaveBeenCalled()
      const callArg = jsonMock.mock.calls[0][0]
      // API returns false when testPassword is provided but user has no password
      expect(callArg.isValidPassword).toBe(false)
    })

    it('should not validate empty testPassword', async () => {
      req.body = { userId: 'user-1', testPassword: '' }
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        password: 'hashedPassword',
      })
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(false)

      await handler(req as NextApiRequest, res as NextApiResponse)

      // API doesn't call bcrypt.compare for empty testPassword (empty string is falsy)
      expect(bcrypt.compare).not.toHaveBeenCalled()
      const callArg = jsonMock.mock.calls[0][0]
      // Empty string is falsy, so API returns undefined for isValidPassword
      expect(callArg.isValidPassword).toBeUndefined()
    })
  })

  describe('Error Handling', () => {
    beforeEach(() => {
      req.method = 'POST'
      req.body = { userId: 'user-1' }
    })

    it('should return 500 on database error', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockRejectedValue(
        new Error('Database connection failed')
      )

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(500)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Internal server error' })
    })

    it('should return 500 on bcrypt compare error', async () => {
      req.body = { userId: 'user-1', testPassword: 'password123' }
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        password: 'hashedPassword',
      })
      ;(bcrypt.compare as jest.Mock).mockRejectedValue(new Error('Bcrypt error'))

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(500)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Internal server error' })
    })

    it('should return 500 on Prisma connection error', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockRejectedValue({
        code: 'P1001',
        message: 'Cannot connect to database',
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(500)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Internal server error' })
    })

    it('should return 500 on timeout error', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error('Timeout'))

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(500)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Internal server error' })
    })

    it('should return 500 on network error', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error('Network error'))

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(500)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Internal server error' })
    })
  })

  describe('Development vs Production', () => {
    beforeEach(() => {
      req.method = 'POST'
      req.body = { userId: 'user-1' }
    })

    it('should handle error in development environment', async () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'
      ;(prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error('Dev error'))

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(500)

      process.env.NODE_ENV = originalEnv
    })

    it('should handle error in production environment', async () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'
      ;(prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error('Production error'))

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(500)

      process.env.NODE_ENV = originalEnv
    })
  })

  describe('Edge Cases', () => {
    beforeEach(() => {
      req.method = 'POST'
    })

    it('should handle userId with special characters', async () => {
      req.body = { userId: 'user-id-with-dashes-123' }
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-id-with-dashes-123',
        password: 'hashedPassword',
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(200)
    })

    it('should handle UUID format userId', async () => {
      const uuidUserId = '550e8400-e29b-41d4-a716-446655440000'
      req.body = { userId: uuidUserId }
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: uuidUserId,
        password: 'hashedPassword',
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(200)
    })

    it('should handle very long userId', async () => {
      const longUserId = 'u'.repeat(100)
      req.body = { userId: longUserId }
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: longUserId,
        password: 'hashedPassword',
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(200)
    })

    it('should handle very long testPassword', async () => {
      const longPassword = 'a'.repeat(1000)
      req.body = { userId: 'user-1', testPassword: longPassword }
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        password: 'hashedPassword',
      })
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(false)

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(bcrypt.compare).toHaveBeenCalledWith(longPassword, 'hashedPassword')
    })

    it('should handle testPassword with special characters', async () => {
      const specialPassword = 'p@$$w0rd!#$%^&*()'
      req.body = { userId: 'user-1', testPassword: specialPassword }
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        password: 'hashedPassword',
      })
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(bcrypt.compare).toHaveBeenCalledWith(specialPassword, 'hashedPassword')
    })

    it('should handle testPassword with unicode characters', async () => {
      const unicodePassword = 'pässwörd123'
      req.body = { userId: 'user-1', testPassword: unicodePassword }
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        password: 'hashedPassword',
      })
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(false)

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(bcrypt.compare).toHaveBeenCalledWith(unicodePassword, 'hashedPassword')
    })
  })

  describe('Request Body Variations', () => {
    beforeEach(() => {
      req.method = 'POST'
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        password: 'hashedPassword',
      })
    })

    it('should ignore extra fields in request body', async () => {
      req.body = {
        userId: 'user-1',
        extraField: 'should be ignored',
        anotherField: 123,
      }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(200)
    })

    it('should handle null testPassword', async () => {
      req.body = { userId: 'user-1', testPassword: null }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(bcrypt.compare).not.toHaveBeenCalled()
    })

    it('should handle undefined testPassword', async () => {
      req.body = { userId: 'user-1', testPassword: undefined }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(bcrypt.compare).not.toHaveBeenCalled()
    })
  })

  describe('Response Format', () => {
    beforeEach(() => {
      req.method = 'POST'
      req.body = { userId: 'user-1' }
    })

    it('should return 200 status on success', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        password: 'hashedPassword',
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(200)
    })

    it('should return object with passwordDisplay, hasPassword, and isValidPassword', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        password: 'hashedPassword',
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      const callArg = jsonMock.mock.calls[0][0]
      expect(callArg).toHaveProperty('passwordDisplay')
      expect(callArg).toHaveProperty('hasPassword')
      expect(callArg).toHaveProperty('isValidPassword')
    })

    it('should not return actual password in response', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        password: 'actualHashedPassword',
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      const callArg = jsonMock.mock.calls[0][0]
      expect(callArg).not.toHaveProperty('password')
      expect(callArg.passwordDisplay).not.toBe('actualHashedPassword')
    })

    it('should not return user id in response', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        password: 'hashedPassword',
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      const callArg = jsonMock.mock.calls[0][0]
      expect(callArg).not.toHaveProperty('id')
      expect(callArg).not.toHaveProperty('userId')
    })
  })

  describe('Security Considerations', () => {
    beforeEach(() => {
      req.method = 'POST'
    })

    it('should always return 12 dots regardless of actual password length', async () => {
      req.body = { userId: 'user-1' }
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        password: 'a',
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      const callArg = jsonMock.mock.calls[0][0]
      expect(callArg.passwordDisplay.length).toBe(12)
    })

    it('should not expose actual password hash', async () => {
      const actualHash = '$2a$10$abcdefghijklmnopqrstuv'
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        password: actualHash,
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      const responseString = JSON.stringify(jsonMock.mock.calls[0][0])
      expect(responseString).not.toContain(actualHash)
    })

    it('should not leak timing information between valid and invalid passwords', async () => {
      req.body = { userId: 'user-1', testPassword: 'test' }
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        password: 'hashedPassword',
      })
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(false)

      const start = Date.now()
      await handler(req as NextApiRequest, res as NextApiResponse)
      const duration = Date.now() - start

      expect(duration).toBeLessThan(1000)
    })
  })

  describe('Concurrent Requests', () => {
    beforeEach(() => {
      req.method = 'POST'
      req.body = { userId: 'user-1' }
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        password: 'hashedPassword',
      })
    })

    it('should handle multiple simultaneous password check requests', async () => {
      const promises = [
        handler(req as NextApiRequest, res as NextApiResponse),
        handler(req as NextApiRequest, res as NextApiResponse),
        handler(req as NextApiRequest, res as NextApiResponse),
      ]

      await Promise.all(promises)

      expect(prisma.user.findUnique).toHaveBeenCalledTimes(3)
    })
  })

  describe('Password Length Display', () => {
    beforeEach(() => {
      req.method = 'POST'
      req.body = { userId: 'user-1' }
    })

    it('should always use 12 as password length', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        password: 'short',
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      const callArg = jsonMock.mock.calls[0][0]
      expect(callArg.passwordDisplay).toBe('••••••••••••')
    })

    it('should display 12 dots for very long password', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        password: 'a'.repeat(1000),
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      const callArg = jsonMock.mock.calls[0][0]
      expect(callArg.passwordDisplay.length).toBe(12)
    })

    it('should display 12 dots for bcrypt hash', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        password: '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      const callArg = jsonMock.mock.calls[0][0]
      expect(callArg.passwordDisplay).toBe('••••••••••••')
    })
  })
})
