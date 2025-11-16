import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import handler from '@/pages/api/user/verification-status'
import { prisma } from '@/lib/cockroachDB/prisma'

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}))

jest.mock('@/lib/cockroachDB/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
  },
}))

describe('/api/user/verification-status', () => {
  let req: Partial<NextApiRequest>
  let res: Partial<NextApiResponse>
  let jsonMock: jest.Mock
  let statusMock: jest.Mock
  let setHeaderMock: jest.Mock

  beforeEach(() => {
    jsonMock = jest.fn()
    statusMock = jest.fn(() => ({ json: jsonMock }))
    setHeaderMock = jest.fn()
    req = {
      method: 'GET',
      headers: {},
    }
    res = {
      status: statusMock,
      setHeader: setHeaderMock,
    }
    jest.clearAllMocks()
  })

  describe('Method Validation', () => {
    it('should accept GET method', async () => {
      req.method = 'GET'
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user-1' },
      })
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        emailVerified: null,
        mobileVerified: null,
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).not.toHaveBeenCalledWith(405)
    })

    it('should return 405 for POST method', async () => {
      req.method = 'POST'

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(setHeaderMock).toHaveBeenCalledWith('Allow', ['GET'])
      expect(statusMock).toHaveBeenCalledWith(405)
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Method POST not allowed' })
    })

    it('should return 405 for PUT method', async () => {
      req.method = 'PUT'

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(setHeaderMock).toHaveBeenCalledWith('Allow', ['GET'])
      expect(statusMock).toHaveBeenCalledWith(405)
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Method PUT not allowed' })
    })

    it('should return 405 for DELETE method', async () => {
      req.method = 'DELETE'

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(setHeaderMock).toHaveBeenCalledWith('Allow', ['GET'])
      expect(statusMock).toHaveBeenCalledWith(405)
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Method DELETE not allowed' })
    })

    it('should return 405 for PATCH method', async () => {
      req.method = 'PATCH'

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(setHeaderMock).toHaveBeenCalledWith('Allow', ['GET'])
      expect(statusMock).toHaveBeenCalledWith(405)
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Method PATCH not allowed' })
    })

    it('should set Allow header for invalid methods', async () => {
      req.method = 'POST'

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(setHeaderMock).toHaveBeenCalledWith('Allow', ['GET'])
    })
  })

  describe('Authentication', () => {
    beforeEach(() => {
      req.method = 'GET'
    })

    it('should return 401 when no session exists', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(null)

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(401)
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Authentication required' })
    })

    it('should return 401 when session has no user', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({})

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(401)
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Authentication required' })
    })

    it('should return 401 when session user has no id', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: {},
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(401)
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Authentication required' })
    })

    it('should return 401 when session user id is empty string', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: '' },
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(401)
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Authentication required' })
    })

    it('should pass authentication with valid session', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user-1' },
      })
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        emailVerified: null,
        mobileVerified: null,
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).not.toHaveBeenCalledWith(401)
    })
  })

  describe('User Retrieval', () => {
    beforeEach(() => {
      req.method = 'GET'
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user-1' },
      })
    })

    it('should return 404 when user not found', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(404)
      expect(jsonMock).toHaveBeenCalledWith({ error: 'User not found' })
    })

    it('should query user by correct id', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user-123' },
      })
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-123',
        emailVerified: null,
        mobileVerified: null,
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        select: {
          emailVerified: true,
          mobileVerified: true,
        },
      })
    })

    it('should select only emailVerified and mobileVerified fields', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        emailVerified: null,
        mobileVerified: null,
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        select: {
          emailVerified: true,
          mobileVerified: true,
        },
      })
    })

    it('should not select password field', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        emailVerified: null,
        mobileVerified: null,
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      const selectArg = (prisma.user.findUnique as jest.Mock).mock.calls[0][0].select
      expect(selectArg).not.toHaveProperty('password')
    })

    it('should not select email field', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        emailVerified: null,
        mobileVerified: null,
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      const selectArg = (prisma.user.findUnique as jest.Mock).mock.calls[0][0].select
      expect(selectArg).not.toHaveProperty('email')
    })
  })

  describe('Verification Status Response', () => {
    beforeEach(() => {
      req.method = 'GET'
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user-1' },
      })
    })

    it('should return null for both when neither verified', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        emailVerified: null,
        mobileVerified: null,
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(200)
      expect(jsonMock).toHaveBeenCalledWith({
        emailVerified: null,
        mobileVerified: null,
      })
    })

    it('should return emailVerified date when email is verified', async () => {
      const emailVerifiedDate = new Date('2024-01-15T10:30:00Z')
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        emailVerified: emailVerifiedDate,
        mobileVerified: null,
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(200)
      expect(jsonMock).toHaveBeenCalledWith({
        emailVerified: emailVerifiedDate,
        mobileVerified: null,
      })
    })

    it('should return mobileVerified date when mobile is verified', async () => {
      const mobileVerifiedDate = new Date('2024-01-20T14:45:00Z')
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        emailVerified: null,
        mobileVerified: mobileVerifiedDate,
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(200)
      expect(jsonMock).toHaveBeenCalledWith({
        emailVerified: null,
        mobileVerified: mobileVerifiedDate,
      })
    })

    it('should return both dates when both are verified', async () => {
      const emailVerifiedDate = new Date('2024-01-15T10:30:00Z')
      const mobileVerifiedDate = new Date('2024-01-20T14:45:00Z')
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        emailVerified: emailVerifiedDate,
        mobileVerified: mobileVerifiedDate,
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(200)
      expect(jsonMock).toHaveBeenCalledWith({
        emailVerified: emailVerifiedDate,
        mobileVerified: mobileVerifiedDate,
      })
    })

    it('should handle different date formats', async () => {
      const emailDate = new Date('2023-12-01T08:00:00Z')
      const mobileDate = new Date('2024-02-28T23:59:59Z')
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        emailVerified: emailDate,
        mobileVerified: mobileDate,
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(jsonMock).toHaveBeenCalledWith({
        emailVerified: emailDate,
        mobileVerified: mobileDate,
      })
    })

    it('should return 200 status on success', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        emailVerified: null,
        mobileVerified: null,
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(200)
    })

    it('should return only verification fields in response', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        emailVerified: null,
        mobileVerified: null,
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      const callArg = jsonMock.mock.calls[0][0]
      expect(Object.keys(callArg)).toEqual(['emailVerified', 'mobileVerified'])
    })

    it('should not include user id in response', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        emailVerified: null,
        mobileVerified: null,
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      const callArg = jsonMock.mock.calls[0][0]
      expect(callArg).not.toHaveProperty('id')
    })
  })

  describe('Error Handling', () => {
    beforeEach(() => {
      req.method = 'GET'
    })

    it('should return 500 on session error', async () => {
      ;(getServerSession as jest.Mock).mockRejectedValue(new Error('Session error'))

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(500)
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Internal server error' })
    })

    it('should return 500 on database error', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user-1' },
      })
      ;(prisma.user.findUnique as jest.Mock).mockRejectedValue(
        new Error('Database connection failed')
      )

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(500)
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Internal server error' })
    })

    it('should return 500 on Prisma connection error', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user-1' },
      })
      ;(prisma.user.findUnique as jest.Mock).mockRejectedValue({
        code: 'P1001',
        message: 'Cannot connect to database',
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(500)
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Internal server error' })
    })

    it('should return 500 on timeout error', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user-1' },
      })
      ;(prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error('Timeout'))

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(500)
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Internal server error' })
    })

    it('should return 500 on network error', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user-1' },
      })
      ;(prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error('Network error'))

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(500)
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Internal server error' })
    })
  })

  describe('Edge Cases', () => {
    beforeEach(() => {
      req.method = 'GET'
    })

    it('should handle user id with special characters', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user-id-with-dashes-123' },
      })
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-id-with-dashes-123',
        emailVerified: null,
        mobileVerified: null,
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(200)
    })

    it('should handle UUID format user id', async () => {
      const uuidUserId = '550e8400-e29b-41d4-a716-446655440000'
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: uuidUserId },
      })
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: uuidUserId,
        emailVerified: null,
        mobileVerified: null,
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(200)
    })

    it('should handle very long user id', async () => {
      const longUserId = 'u'.repeat(100)
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: longUserId },
      })
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: longUserId,
        emailVerified: null,
        mobileVerified: null,
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(200)
    })

    it('should handle session with additional user properties', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: {
          id: 'user-1',
          email: 'test@example.com',
          name: 'Test User',
          username: 'testuser',
        },
      })
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        emailVerified: null,
        mobileVerified: null,
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(200)
    })
  })

  describe('Date Handling', () => {
    beforeEach(() => {
      req.method = 'GET'
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user-1' },
      })
    })

    it('should handle Date objects correctly', async () => {
      const emailDate = new Date('2024-01-15T10:30:00Z')
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        emailVerified: emailDate,
        mobileVerified: null,
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      const callArg = jsonMock.mock.calls[0][0]
      expect(callArg.emailVerified).toBe(emailDate)
    })

    it('should handle very old verification dates', async () => {
      const oldDate = new Date('2020-01-01T00:00:00Z')
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        emailVerified: oldDate,
        mobileVerified: null,
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(jsonMock).toHaveBeenCalledWith({
        emailVerified: oldDate,
        mobileVerified: null,
      })
    })

    it('should handle very recent verification dates', async () => {
      const recentDate = new Date()
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        emailVerified: null,
        mobileVerified: recentDate,
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(jsonMock).toHaveBeenCalledWith({
        emailVerified: null,
        mobileVerified: recentDate,
      })
    })
  })

  describe('Response Headers', () => {
    beforeEach(() => {
      req.method = 'GET'
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user-1' },
      })
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        emailVerified: null,
        mobileVerified: null,
      })
    })

    it('should not set Allow header for successful GET request', async () => {
      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(setHeaderMock).not.toHaveBeenCalled()
    })
  })

  describe('Concurrent Requests', () => {
    beforeEach(() => {
      req.method = 'GET'
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user-1' },
      })
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        emailVerified: null,
        mobileVerified: null,
      })
    })

    it('should handle multiple simultaneous requests', async () => {
      const promises = [
        handler(req as NextApiRequest, res as NextApiResponse),
        handler(req as NextApiRequest, res as NextApiResponse),
        handler(req as NextApiRequest, res as NextApiResponse),
      ]

      await Promise.all(promises)

      expect(prisma.user.findUnique).toHaveBeenCalledTimes(3)
    })
  })

  describe('Error Response Format', () => {
    beforeEach(() => {
      req.method = 'GET'
    })

    it('should use error key instead of message for 401', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(null)

      await handler(req as NextApiRequest, res as NextApiResponse)

      const callArg = jsonMock.mock.calls[0][0]
      expect(callArg).toHaveProperty('error')
      expect(callArg).not.toHaveProperty('message')
    })

    it('should use error key instead of message for 404', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user-1' },
      })
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

      await handler(req as NextApiRequest, res as NextApiResponse)

      const callArg = jsonMock.mock.calls[0][0]
      expect(callArg).toHaveProperty('error')
      expect(callArg).not.toHaveProperty('message')
    })

    it('should use error key instead of message for 500', async () => {
      ;(getServerSession as jest.Mock).mockRejectedValue(new Error('Test error'))

      await handler(req as NextApiRequest, res as NextApiResponse)

      const callArg = jsonMock.mock.calls[0][0]
      expect(callArg).toHaveProperty('error')
      expect(callArg).not.toHaveProperty('message')
    })
  })

  describe('HTTP Method Case Sensitivity', () => {
    it('should handle lowercase method names', async () => {
      req.method = 'get'
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user-1' },
      })
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        emailVerified: null,
        mobileVerified: null,
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(405)
    })

    it('should handle mixed case method names', async () => {
      req.method = 'Get'
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { id: 'user-1' },
      })
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        emailVerified: null,
        mobileVerified: null,
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(405)
    })
  })
})
