import { NextApiRequest, NextApiResponse } from 'next'
import handler from '@/pages/api/auth/check-user'
import { prisma } from '@/lib/cockroachDB/prisma'

jest.mock('@/lib/cockroachDB/prisma', () => ({
  prisma: {
    user: {
      findFirst: jest.fn(),
    },
  },
}))

describe('POST /api/auth/check-user', () => {
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
    }
    res = {
      status: statusMock,
    }
    jest.clearAllMocks()
    process.env.NODE_ENV = 'test'
  })

  describe('HTTP Method Validation', () => {
    it('should reject GET requests', async () => {
      req.method = 'GET'
      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(405)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Method not allowed' })
    })

    it('should reject PUT requests', async () => {
      req.method = 'PUT'
      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(405)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Method not allowed' })
    })

    it('should reject DELETE requests', async () => {
      req.method = 'DELETE'
      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(405)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Method not allowed' })
    })

    it('should reject PATCH requests', async () => {
      req.method = 'PATCH'
      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(405)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Method not allowed' })
    })

    it('should accept POST requests', async () => {
      req.method = 'POST'
      req.body = { type: 'email', value: 'test@example.com' }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(null)

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).not.toHaveBeenCalledWith(405)
    })
  })

  describe('Request Body Validation - Missing Fields', () => {
    it('should return 400 if type is missing', async () => {
      req.body = { value: 'test@example.com' }
      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Type and value are required' })
    })

    it('should return 400 if value is missing', async () => {
      req.body = { type: 'email' }
      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Type and value are required' })
    })

    it('should return 400 if both type and value are missing', async () => {
      req.body = {}
      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Type and value are required' })
    })

    it('should return 400 if type is null', async () => {
      req.body = { type: null, value: 'test@example.com' }
      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Type and value are required' })
    })

    it('should return 400 if value is null', async () => {
      req.body = { type: 'email', value: null }
      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Type and value are required' })
    })

    it('should return 400 if type is empty string', async () => {
      req.body = { type: '', value: 'test@example.com' }
      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Type and value are required' })
    })

    it('should return 400 if value is empty string', async () => {
      req.body = { type: 'email', value: '' }
      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Type and value are required' })
    })
  })

  describe('Type Validation', () => {
    it('should return 400 for invalid type', async () => {
      req.body = { type: 'invalid', value: 'test@example.com' }
      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Invalid type' })
    })

    it('should return 400 for username type', async () => {
      req.body = { type: 'username', value: 'testuser' }
      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Invalid type' })
    })

    it('should return 400 for phone type', async () => {
      req.body = { type: 'phone', value: '+911234567890' }
      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Invalid type' })
    })

    it('should accept email type', async () => {
      req.body = { type: 'email', value: 'test@example.com' }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(null)

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).not.toHaveBeenCalledWith(400)
    })

    it('should accept mobile type', async () => {
      req.body = { type: 'mobile', value: '+911234567890' }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(null)

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).not.toHaveBeenCalledWith(400)
    })

    it('should be case-sensitive for type', async () => {
      req.body = { type: 'EMAIL', value: 'test@example.com' }
      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Invalid type' })
    })
  })

  describe('Email Lookup', () => {
    it('should query database with email when type is email', async () => {
      req.body = { type: 'email', value: 'test@example.com' }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue({
        id: '1',
        emailVerified: new Date(),
        mobileVerified: null,
      })

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        select: {
          id: true,
          emailVerified: true,
          mobileVerified: true,
        },
      })
    })

    it('should return 404 if email not found', async () => {
      req.body = { type: 'email', value: 'nonexistent@example.com' }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(null)

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(404)
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Email not registered. Please sign up first',
        exists: false,
      })
    })

    it('should return 200 if verified email found', async () => {
      req.body = { type: 'email', value: 'verified@example.com' }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue({
        id: '1',
        emailVerified: new Date(),
        mobileVerified: null,
      })

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(200)
    })

    it('should return 200 if unverified email found', async () => {
      req.body = { type: 'email', value: 'unverified@example.com' }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue({
        id: '1',
        emailVerified: null,
        mobileVerified: null,
      })

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(200)
    })

    it('should handle email with uppercase letters', async () => {
      req.body = { type: 'email', value: 'TEST@EXAMPLE.COM' }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue({
        id: '1',
        emailVerified: new Date(),
        mobileVerified: null,
      })

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: { email: 'TEST@EXAMPLE.COM' },
        select: expect.any(Object),
      })
    })

    it('should handle email with special characters', async () => {
      req.body = { type: 'email', value: 'user+tag@example.com' }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue({
        id: '1',
        emailVerified: new Date(),
        mobileVerified: null,
      })

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: { email: 'user+tag@example.com' },
        select: expect.any(Object),
      })
    })
  })

  describe('Mobile Lookup', () => {
    it('should query database with phone when type is mobile', async () => {
      req.body = { type: 'mobile', value: '+911234567890' }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue({
        id: '1',
        emailVerified: null,
        mobileVerified: new Date(),
      })

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: { phone: '+911234567890' },
        select: {
          id: true,
          emailVerified: true,
          mobileVerified: true,
        },
      })
    })

    it('should try exact match first for mobile', async () => {
      req.body = { type: 'mobile', value: '+911234567890' }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue({
        id: '1',
        emailVerified: null,
        mobileVerified: new Date(),
      })

      await handler(req as NextApiRequest, res as NextApiResponse)
      const firstCall = (prisma.user.findFirst as jest.Mock).mock.calls[0][0]
      expect(firstCall.where.phone).toBe('+911234567890')
    })

    it('should try alternative formats if exact match fails', async () => {
      req.body = { type: 'mobile', value: '+911234567890' }
      ;(prisma.user.findFirst as jest.Mock)
        .mockResolvedValueOnce(null) // exact match fails
        .mockResolvedValueOnce(null) // first alternative fails
        .mockResolvedValueOnce({
          // second alternative succeeds
          id: '1',
          emailVerified: null,
          mobileVerified: new Date(),
        })

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(prisma.user.findFirst).toHaveBeenCalledTimes(3)
    })

    it('should return 404 if mobile not found in any format', async () => {
      req.body = { type: 'mobile', value: '+919999999999' }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(null)

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(404)
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Mobile number not registered. Please sign up first',
        exists: false,
      })
    })

    it('should return 200 if verified mobile found', async () => {
      req.body = { type: 'mobile', value: '+911234567890' }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue({
        id: '1',
        emailVerified: null,
        mobileVerified: new Date(),
      })

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(200)
    })

    it('should return 200 if unverified mobile found', async () => {
      req.body = { type: 'mobile', value: '+911234567890' }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue({
        id: '1',
        emailVerified: null,
        mobileVerified: null,
      })

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(200)
    })

    it('should handle mobile with just digits', async () => {
      req.body = { type: 'mobile', value: '1234567890' }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue({
        id: '1',
        emailVerified: null,
        mobileVerified: new Date(),
      })

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(prisma.user.findFirst).toHaveBeenCalled()
    })

    it('should handle mobile with country code without plus', async () => {
      req.body = { type: 'mobile', value: '911234567890' }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue({
        id: '1',
        emailVerified: null,
        mobileVerified: new Date(),
      })

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(prisma.user.findFirst).toHaveBeenCalled()
    })

    it('should handle mobile with dashes', async () => {
      req.body = { type: 'mobile', value: '+91-123-456-7890' }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue({
        id: '1',
        emailVerified: null,
        mobileVerified: new Date(),
      })

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(prisma.user.findFirst).toHaveBeenCalled()
    })

    it('should handle mobile with spaces', async () => {
      req.body = { type: 'mobile', value: '+91 123 456 7890' }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue({
        id: '1',
        emailVerified: null,
        mobileVerified: new Date(),
      })

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(prisma.user.findFirst).toHaveBeenCalled()
    })
  })

  describe('Verification Status Response', () => {
    it('should return verified true for verified email', async () => {
      req.body = { type: 'email', value: 'verified@example.com' }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue({
        id: '1',
        emailVerified: new Date(),
        mobileVerified: null,
      })

      await handler(req as NextApiRequest, res as NextApiResponse)
      const response = jsonMock.mock.calls[0][0]
      expect(response.verified).toBe(true)
    })

    it('should return verified false for unverified email', async () => {
      req.body = { type: 'email', value: 'unverified@example.com' }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue({
        id: '1',
        emailVerified: null,
        mobileVerified: null,
      })

      await handler(req as NextApiRequest, res as NextApiResponse)
      const response = jsonMock.mock.calls[0][0]
      expect(response.verified).toBe(false)
    })

    it('should return verified true for verified mobile', async () => {
      req.body = { type: 'mobile', value: '+911234567890' }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue({
        id: '1',
        emailVerified: null,
        mobileVerified: new Date(),
      })

      await handler(req as NextApiRequest, res as NextApiResponse)
      const response = jsonMock.mock.calls[0][0]
      expect(response.verified).toBe(true)
    })

    it('should return verified false for unverified mobile', async () => {
      req.body = { type: 'mobile', value: '+911234567890' }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue({
        id: '1',
        emailVerified: null,
        mobileVerified: null,
      })

      await handler(req as NextApiRequest, res as NextApiResponse)
      const response = jsonMock.mock.calls[0][0]
      expect(response.verified).toBe(false)
    })

    it('should check emailVerified for email type', async () => {
      req.body = { type: 'email', value: 'test@example.com' }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue({
        id: '1',
        emailVerified: new Date(),
        mobileVerified: null,
      })

      await handler(req as NextApiRequest, res as NextApiResponse)
      const response = jsonMock.mock.calls[0][0]
      expect(response.verified).toBe(true)
    })

    it('should check mobileVerified for mobile type', async () => {
      req.body = { type: 'mobile', value: '+911234567890' }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue({
        id: '1',
        emailVerified: new Date(),
        mobileVerified: null,
      })

      await handler(req as NextApiRequest, res as NextApiResponse)
      const response = jsonMock.mock.calls[0][0]
      expect(response.verified).toBe(false) // should check mobileVerified, not emailVerified
    })
  })

  describe('Success Response Structure', () => {
    it('should return exists true when user found', async () => {
      req.body = { type: 'email', value: 'test@example.com' }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue({
        id: '1',
        emailVerified: new Date(),
        mobileVerified: null,
      })

      await handler(req as NextApiRequest, res as NextApiResponse)
      const response = jsonMock.mock.calls[0][0]
      expect(response.exists).toBe(true)
    })

    it('should return user object with id', async () => {
      req.body = { type: 'email', value: 'test@example.com' }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue({
        id: '123',
        emailVerified: new Date(),
        mobileVerified: null,
      })

      await handler(req as NextApiRequest, res as NextApiResponse)
      const response = jsonMock.mock.calls[0][0]
      expect(response.user.id).toBe('123')
    })

    it('should return user object with emailVerified', async () => {
      const verifiedDate = new Date()
      req.body = { type: 'email', value: 'test@example.com' }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue({
        id: '1',
        emailVerified: verifiedDate,
        mobileVerified: null,
      })

      await handler(req as NextApiRequest, res as NextApiResponse)
      const response = jsonMock.mock.calls[0][0]
      expect(response.user.emailVerified).toBe(verifiedDate)
    })

    it('should return user object with mobileVerified', async () => {
      const verifiedDate = new Date()
      req.body = { type: 'mobile', value: '+911234567890' }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue({
        id: '1',
        emailVerified: null,
        mobileVerified: verifiedDate,
      })

      await handler(req as NextApiRequest, res as NextApiResponse)
      const response = jsonMock.mock.calls[0][0]
      expect(response.user.mobileVerified).toBe(verifiedDate)
    })

    it('should include all required response fields', async () => {
      req.body = { type: 'email', value: 'test@example.com' }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue({
        id: '1',
        emailVerified: new Date(),
        mobileVerified: null,
      })

      await handler(req as NextApiRequest, res as NextApiResponse)
      const response = jsonMock.mock.calls[0][0]
      expect(response).toHaveProperty('exists')
      expect(response).toHaveProperty('verified')
      expect(response).toHaveProperty('user')
      expect(response.user).toHaveProperty('id')
      expect(response.user).toHaveProperty('emailVerified')
      expect(response.user).toHaveProperty('mobileVerified')
    })
  })

  describe('Error Handling', () => {
    it('should return 500 on database error for email lookup', async () => {
      req.body = { type: 'email', value: 'test@example.com' }
      ;(prisma.user.findFirst as jest.Mock).mockRejectedValue(new Error('Database error'))

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(500)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Internal server error' })
    })

    it('should return 500 on database error for mobile lookup', async () => {
      req.body = { type: 'mobile', value: '+911234567890' }
      ;(prisma.user.findFirst as jest.Mock).mockRejectedValue(new Error('Database error'))

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(500)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Internal server error' })
    })

    it('should handle network errors gracefully', async () => {
      req.body = { type: 'email', value: 'test@example.com' }
      ;(prisma.user.findFirst as jest.Mock).mockRejectedValue(new Error('Network error'))

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(500)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Internal server error' })
    })

    it('should handle timeout errors gracefully', async () => {
      req.body = { type: 'email', value: 'test@example.com' }
      ;(prisma.user.findFirst as jest.Mock).mockRejectedValue(new Error('Timeout'))

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(500)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Internal server error' })
    })

    it('should handle unexpected errors gracefully', async () => {
      req.body = { type: 'email', value: 'test@example.com' }
      ;(prisma.user.findFirst as jest.Mock).mockImplementation(() => {
        throw new Error('Unexpected error')
      })

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(500)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Internal server error' })
    })
  })

  describe('Development Mode Logging', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development'
    })

    it('should log request in development mode', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
      req.body = { type: 'email', value: 'test@example.com' }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue({
        id: '1',
        emailVerified: new Date(),
        mobileVerified: null,
      })

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })

    it('should not log in non-development mode', async () => {
      process.env.NODE_ENV = 'production'
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
      req.body = { type: 'email', value: 'test@example.com' }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue({
        id: '1',
        emailVerified: new Date(),
        mobileVerified: null,
      })

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(consoleSpy).not.toHaveBeenCalled()
      consoleSpy.mockRestore()
    })

    it('should log error in development mode', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      req.body = { type: 'email', value: 'test@example.com' }
      ;(prisma.user.findFirst as jest.Mock).mockRejectedValue(new Error('Test error'))

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })
  })

  describe('Edge Cases', () => {
    it('should handle user with both email and mobile verified', async () => {
      req.body = { type: 'email', value: 'test@example.com' }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue({
        id: '1',
        emailVerified: new Date(),
        mobileVerified: new Date(),
      })

      await handler(req as NextApiRequest, res as NextApiResponse)
      const response = jsonMock.mock.calls[0][0]
      expect(response.verified).toBe(true)
      expect(response.user.emailVerified).toBeDefined()
      expect(response.user.mobileVerified).toBeDefined()
    })

    it('should handle user with neither email nor mobile verified', async () => {
      req.body = { type: 'email', value: 'test@example.com' }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue({
        id: '1',
        emailVerified: null,
        mobileVerified: null,
      })

      await handler(req as NextApiRequest, res as NextApiResponse)
      const response = jsonMock.mock.calls[0][0]
      expect(response.verified).toBe(false)
      expect(response.user.emailVerified).toBeNull()
      expect(response.user.mobileVerified).toBeNull()
    })

    it('should handle mobile lookup when email is verified but mobile is not', async () => {
      req.body = { type: 'mobile', value: '+911234567890' }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue({
        id: '1',
        emailVerified: new Date(),
        mobileVerified: null,
      })

      await handler(req as NextApiRequest, res as NextApiResponse)
      const response = jsonMock.mock.calls[0][0]
      expect(response.verified).toBe(false) // should be false because mobileVerified is null
    })

    it('should handle email lookup when mobile is verified but email is not', async () => {
      req.body = { type: 'email', value: 'test@example.com' }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue({
        id: '1',
        emailVerified: null,
        mobileVerified: new Date(),
      })

      await handler(req as NextApiRequest, res as NextApiResponse)
      const response = jsonMock.mock.calls[0][0]
      expect(response.verified).toBe(false) // should be false because emailVerified is null
    })

    it('should handle very long email addresses', async () => {
      const longEmail =
        'verylongemailaddresswithmanycharacters@verylongdomainnamewithmanycharacters.com'
      req.body = { type: 'email', value: longEmail }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue({
        id: '1',
        emailVerified: new Date(),
        mobileVerified: null,
      })

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(200)
    })

    it('should handle international mobile numbers', async () => {
      req.body = { type: 'mobile', value: '+441234567890' }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue({
        id: '1',
        emailVerified: null,
        mobileVerified: new Date(),
      })

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(200)
    })
  })
})
