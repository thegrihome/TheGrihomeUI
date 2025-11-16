import { NextApiRequest, NextApiResponse } from 'next'
import handler from '@/pages/api/auth/check-verification'
import { prisma } from '@/lib/cockroachDB/prisma'

jest.mock('@/lib/cockroachDB/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
    },
  },
}))

describe('POST /api/auth/check-verification', () => {
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
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

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
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

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

  describe('Email Lookup and Verification', () => {
    it('should query database with email using findUnique', async () => {
      req.body = { type: 'email', value: 'test@example.com' }
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: '1',
        emailVerified: new Date(),
      })

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        select: {
          id: true,
          emailVerified: true,
        },
      })
    })

    it('should return 404 if email not found', async () => {
      req.body = { type: 'email', value: 'nonexistent@example.com' }
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(404)
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Email not registered',
        canSendOTP: false,
      })
    })

    it('should return 200 if email is verified', async () => {
      req.body = { type: 'email', value: 'verified@example.com' }
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: '1',
        emailVerified: new Date(),
      })

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(200)
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Can send OTP',
        canSendOTP: true,
      })
    })

    it('should return 400 if email is not verified', async () => {
      req.body = { type: 'email', value: 'unverified@example.com' }
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: '1',
        emailVerified: null,
      })

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Email not verified. Please verify in your profile first.',
        canSendOTP: false,
      })
    })

    it('should check emailVerified field specifically', async () => {
      req.body = { type: 'email', value: 'test@example.com' }
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: '1',
        emailVerified: new Date('2023-01-01'),
      })

      await handler(req as NextApiRequest, res as NextApiResponse)
      const response = jsonMock.mock.calls[0][0]
      expect(response.canSendOTP).toBe(true)
    })

    it('should handle email with uppercase letters', async () => {
      req.body = { type: 'email', value: 'TEST@EXAMPLE.COM' }
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: '1',
        emailVerified: new Date(),
      })

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'TEST@EXAMPLE.COM' },
        select: expect.any(Object),
      })
    })

    it('should handle email with special characters', async () => {
      req.body = { type: 'email', value: 'user+tag@example.com' }
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: '1',
        emailVerified: new Date(),
      })

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(200)
    })
  })

  describe('Mobile Lookup and Verification', () => {
    it('should query database with phone using findFirst', async () => {
      req.body = { type: 'mobile', value: '+911234567890' }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue({
        id: '1',
        mobileVerified: new Date(),
      })

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: { phone: '+911234567890' },
        select: {
          id: true,
          mobileVerified: true,
        },
      })
    })

    it('should return 404 if mobile not found', async () => {
      req.body = { type: 'mobile', value: '+919999999999' }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(null)

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(404)
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Mobile number not registered',
        canSendOTP: false,
      })
    })

    it('should return 200 if mobile is verified', async () => {
      req.body = { type: 'mobile', value: '+911234567890' }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue({
        id: '1',
        mobileVerified: new Date(),
      })

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(200)
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Can send OTP',
        canSendOTP: true,
      })
    })

    it('should return 400 if mobile is not verified', async () => {
      req.body = { type: 'mobile', value: '+911234567890' }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue({
        id: '1',
        mobileVerified: null,
      })

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Mobile number not verified. Please verify in your profile first.',
        canSendOTP: false,
      })
    })

    it('should check mobileVerified field specifically', async () => {
      req.body = { type: 'mobile', value: '+911234567890' }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue({
        id: '1',
        mobileVerified: new Date('2023-01-01'),
      })

      await handler(req as NextApiRequest, res as NextApiResponse)
      const response = jsonMock.mock.calls[0][0]
      expect(response.canSendOTP).toBe(true)
    })

    it('should handle mobile with different formats', async () => {
      req.body = { type: 'mobile', value: '911234567890' }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue({
        id: '1',
        mobileVerified: new Date(),
      })

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: { phone: '911234567890' },
        select: expect.any(Object),
      })
    })
  })

  describe('Verification Status Check Logic', () => {
    it('should verify emailVerified is not null for email type', async () => {
      req.body = { type: 'email', value: 'test@example.com' }
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: '1',
        emailVerified: new Date(),
      })

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(200)
    })

    it('should verify mobileVerified is not null for mobile type', async () => {
      req.body = { type: 'mobile', value: '+911234567890' }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue({
        id: '1',
        mobileVerified: new Date(),
      })

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(200)
    })

    it('should treat null emailVerified as not verified', async () => {
      req.body = { type: 'email', value: 'test@example.com' }
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: '1',
        emailVerified: null,
      })

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(400)
    })

    it('should treat null mobileVerified as not verified', async () => {
      req.body = { type: 'mobile', value: '+911234567890' }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue({
        id: '1',
        mobileVerified: null,
      })

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(400)
    })

    it('should accept any date for emailVerified', async () => {
      const dates = [new Date('2020-01-01'), new Date('2099-12-31'), new Date()]
      for (const date of dates) {
        req.body = { type: 'email', value: 'test@example.com' }
        ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
          id: '1',
          emailVerified: date,
        })

        await handler(req as NextApiRequest, res as NextApiResponse)
        expect(statusMock).toHaveBeenCalledWith(200)
        jest.clearAllMocks()
      }
    })

    it('should accept any date for mobileVerified', async () => {
      const dates = [new Date('2020-01-01'), new Date('2099-12-31'), new Date()]
      for (const date of dates) {
        req.body = { type: 'mobile', value: '+911234567890' }
        ;(prisma.user.findFirst as jest.Mock).mockResolvedValue({
          id: '1',
          mobileVerified: date,
        })

        await handler(req as NextApiRequest, res as NextApiResponse)
        expect(statusMock).toHaveBeenCalledWith(200)
        jest.clearAllMocks()
      }
    })
  })

  describe('Response Messages', () => {
    it('should return correct message when email not registered', async () => {
      req.body = { type: 'email', value: 'test@example.com' }
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

      await handler(req as NextApiRequest, res as NextApiResponse)
      const response = jsonMock.mock.calls[0][0]
      expect(response.message).toBe('Email not registered')
    })

    it('should return correct message when mobile not registered', async () => {
      req.body = { type: 'mobile', value: '+911234567890' }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(null)

      await handler(req as NextApiRequest, res as NextApiResponse)
      const response = jsonMock.mock.calls[0][0]
      expect(response.message).toBe('Mobile number not registered')
    })

    it('should return correct message when email not verified', async () => {
      req.body = { type: 'email', value: 'test@example.com' }
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: '1',
        emailVerified: null,
      })

      await handler(req as NextApiRequest, res as NextApiResponse)
      const response = jsonMock.mock.calls[0][0]
      expect(response.message).toBe('Email not verified. Please verify in your profile first.')
    })

    it('should return correct message when mobile not verified', async () => {
      req.body = { type: 'mobile', value: '+911234567890' }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue({
        id: '1',
        mobileVerified: null,
      })

      await handler(req as NextApiRequest, res as NextApiResponse)
      const response = jsonMock.mock.calls[0][0]
      expect(response.message).toBe(
        'Mobile number not verified. Please verify in your profile first.'
      )
    })

    it('should return correct message when can send OTP', async () => {
      req.body = { type: 'email', value: 'test@example.com' }
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: '1',
        emailVerified: new Date(),
      })

      await handler(req as NextApiRequest, res as NextApiResponse)
      const response = jsonMock.mock.calls[0][0]
      expect(response.message).toBe('Can send OTP')
    })
  })

  describe('canSendOTP Flag', () => {
    it('should return canSendOTP false when user not found', async () => {
      req.body = { type: 'email', value: 'test@example.com' }
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

      await handler(req as NextApiRequest, res as NextApiResponse)
      const response = jsonMock.mock.calls[0][0]
      expect(response.canSendOTP).toBe(false)
    })

    it('should return canSendOTP false when not verified', async () => {
      req.body = { type: 'email', value: 'test@example.com' }
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: '1',
        emailVerified: null,
      })

      await handler(req as NextApiRequest, res as NextApiResponse)
      const response = jsonMock.mock.calls[0][0]
      expect(response.canSendOTP).toBe(false)
    })

    it('should return canSendOTP true when verified', async () => {
      req.body = { type: 'email', value: 'test@example.com' }
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: '1',
        emailVerified: new Date(),
      })

      await handler(req as NextApiRequest, res as NextApiResponse)
      const response = jsonMock.mock.calls[0][0]
      expect(response.canSendOTP).toBe(true)
    })

    it('should include canSendOTP in all responses', async () => {
      const testCases = [
        { type: 'email', value: 'test@example.com', user: null },
        { type: 'email', value: 'test@example.com', user: { id: '1', emailVerified: null } },
        {
          type: 'email',
          value: 'test@example.com',
          user: { id: '1', emailVerified: new Date() },
        },
      ]

      for (const testCase of testCases) {
        req.body = { type: testCase.type, value: testCase.value }
        ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(testCase.user)

        await handler(req as NextApiRequest, res as NextApiResponse)
        const response = jsonMock.mock.calls[jsonMock.mock.calls.length - 1][0]
        expect(response).toHaveProperty('canSendOTP')
        jest.clearAllMocks()
      }
    })
  })

  describe('Error Handling', () => {
    it('should return 500 on database error for email lookup', async () => {
      req.body = { type: 'email', value: 'test@example.com' }
      ;(prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'))

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
      ;(prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error('Network error'))

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(500)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Internal server error' })
    })

    it('should handle timeout errors gracefully', async () => {
      req.body = { type: 'email', value: 'test@example.com' }
      ;(prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error('Timeout'))

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(500)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Internal server error' })
    })

    it('should handle unexpected errors gracefully', async () => {
      req.body = { type: 'email', value: 'test@example.com' }
      ;(prisma.user.findUnique as jest.Mock).mockImplementation(() => {
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

    it('should log error in development mode', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      req.body = { type: 'email', value: 'test@example.com' }
      ;(prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error('Test error'))

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })

    it('should not log in non-development mode', async () => {
      process.env.NODE_ENV = 'production'
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      req.body = { type: 'email', value: 'test@example.com' }
      ;(prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error('Test error'))

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(consoleSpy).not.toHaveBeenCalled()
      consoleSpy.mockRestore()
    })
  })

  describe('Edge Cases', () => {
    it('should handle user with both email and mobile fields', async () => {
      req.body = { type: 'email', value: 'test@example.com' }
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: '1',
        emailVerified: new Date(),
        mobileVerified: new Date(),
      })

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(200)
    })

    it('should handle user with email verified but mobile not verified', async () => {
      req.body = { type: 'email', value: 'test@example.com' }
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: '1',
        emailVerified: new Date(),
        mobileVerified: null,
      })

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(200)
      const response = jsonMock.mock.calls[0][0]
      expect(response.canSendOTP).toBe(true)
    })

    it('should handle user with mobile verified but email not verified', async () => {
      req.body = { type: 'mobile', value: '+911234567890' }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue({
        id: '1',
        emailVerified: null,
        mobileVerified: new Date(),
      })

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(200)
      const response = jsonMock.mock.calls[0][0]
      expect(response.canSendOTP).toBe(true)
    })

    it('should handle very long email addresses', async () => {
      const longEmail =
        'verylongemailaddresswithmanycharacters@verylongdomainnamewithmanycharacters.com'
      req.body = { type: 'email', value: longEmail }
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: '1',
        emailVerified: new Date(),
      })

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(200)
    })

    it('should handle international mobile numbers', async () => {
      req.body = { type: 'mobile', value: '+441234567890' }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue({
        id: '1',
        mobileVerified: new Date(),
      })

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(200)
    })

    it('should handle mobile with dashes', async () => {
      req.body = { type: 'mobile', value: '+91-123-456-7890' }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue({
        id: '1',
        mobileVerified: new Date(),
      })

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(200)
    })

    it('should handle mobile with spaces', async () => {
      req.body = { type: 'mobile', value: '+91 123 456 7890' }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue({
        id: '1',
        mobileVerified: new Date(),
      })

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(200)
    })
  })

  describe('Database Query Patterns', () => {
    it('should use findUnique for email lookups', async () => {
      req.body = { type: 'email', value: 'test@example.com' }
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: '1',
        emailVerified: new Date(),
      })

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(prisma.user.findUnique).toHaveBeenCalled()
      expect(prisma.user.findFirst).not.toHaveBeenCalled()
    })

    it('should use findFirst for mobile lookups', async () => {
      req.body = { type: 'mobile', value: '+911234567890' }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue({
        id: '1',
        mobileVerified: new Date(),
      })

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(prisma.user.findFirst).toHaveBeenCalled()
      expect(prisma.user.findUnique).not.toHaveBeenCalled()
    })

    it('should select only necessary fields for email', async () => {
      req.body = { type: 'email', value: 'test@example.com' }
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: '1',
        emailVerified: new Date(),
      })

      await handler(req as NextApiRequest, res as NextApiResponse)
      const query = (prisma.user.findUnique as jest.Mock).mock.calls[0][0]
      expect(query.select).toEqual({
        id: true,
        emailVerified: true,
      })
    })

    it('should select only necessary fields for mobile', async () => {
      req.body = { type: 'mobile', value: '+911234567890' }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue({
        id: '1',
        mobileVerified: new Date(),
      })

      await handler(req as NextApiRequest, res as NextApiResponse)
      const query = (prisma.user.findFirst as jest.Mock).mock.calls[0][0]
      expect(query.select).toEqual({
        id: true,
        mobileVerified: true,
      })
    })
  })
})
