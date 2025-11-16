import { NextApiRequest, NextApiResponse } from 'next'
import handler from '@/pages/api/auth/check-unique'
import { prisma } from '@/lib/cockroachDB/prisma'

jest.mock('@/lib/cockroachDB/prisma', () => ({
  prisma: {
    user: {
      findFirst: jest.fn(),
    },
  },
}))

describe('POST /api/auth/check-unique', () => {
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
      req.body = { field: 'username', value: 'testuser' }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(null)

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).not.toHaveBeenCalledWith(405)
    })
  })

  describe('Request Body Validation - Missing Fields', () => {
    it('should return 400 if field is missing', async () => {
      req.body = { value: 'testuser' }
      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Field and value are required' })
    })

    it('should return 400 if value is missing', async () => {
      req.body = { field: 'username' }
      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Field and value are required' })
    })

    it('should return 400 if both field and value are missing', async () => {
      req.body = {}
      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Field and value are required' })
    })

    it('should return 400 if field is null', async () => {
      req.body = { field: null, value: 'testuser' }
      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Field and value are required' })
    })

    it('should return 400 if value is null', async () => {
      req.body = { field: 'username', value: null }
      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Field and value are required' })
    })

    it('should return 400 if field is empty string', async () => {
      req.body = { field: '', value: 'testuser' }
      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Field and value are required' })
    })

    it('should return 400 if value is empty string', async () => {
      req.body = { field: 'username', value: '' }
      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Field and value are required' })
    })
  })

  describe('Field Type Validation', () => {
    it('should return 400 for invalid field type', async () => {
      req.body = { field: 'invalid', value: 'test' }
      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Invalid field' })
    })

    it('should return 400 for phone field', async () => {
      req.body = { field: 'phone', value: '+911234567890' }
      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Invalid field' })
    })

    it('should return 400 for password field', async () => {
      req.body = { field: 'password', value: 'password123' }
      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Invalid field' })
    })

    it('should accept username field', async () => {
      req.body = { field: 'username', value: 'testuser' }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(null)

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).not.toHaveBeenCalledWith(400)
    })

    it('should accept email field', async () => {
      req.body = { field: 'email', value: 'test@example.com' }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(null)

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).not.toHaveBeenCalledWith(400)
    })

    it('should accept mobile field', async () => {
      req.body = { field: 'mobile', value: '+911234567890' }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(null)

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).not.toHaveBeenCalledWith(400)
    })

    it('should be case-sensitive for field type', async () => {
      req.body = { field: 'USERNAME', value: 'testuser' }
      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Invalid field' })
    })
  })

  describe('Email Format Validation', () => {
    it('should return 400 for invalid email format', async () => {
      req.body = { field: 'email', value: 'invalid-email' }
      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Invalid email format', isUnique: false })
    })

    it('should return 400 for email missing @ symbol', async () => {
      req.body = { field: 'email', value: 'test.example.com' }
      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Invalid email format', isUnique: false })
    })

    it('should return 400 for email with no domain', async () => {
      req.body = { field: 'email', value: 'test@' }
      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Invalid email format', isUnique: false })
    })

    it('should return 400 for email with no local part', async () => {
      req.body = { field: 'email', value: '@example.com' }
      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Invalid email format', isUnique: false })
    })

    it('should trim whitespace from email before validation', async () => {
      req.body = { field: 'email', value: '  test@example.com  ' }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(null)

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(200)
    })

    it('should accept valid email format', async () => {
      req.body = { field: 'email', value: 'test@example.com' }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(null)

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(200)
    })

    it('should accept email with plus sign', async () => {
      req.body = { field: 'email', value: 'user+tag@example.com' }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(null)

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(200)
    })

    it('should accept email with dots', async () => {
      req.body = { field: 'email', value: 'user.name@example.com' }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(null)

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(200)
    })

    it('should accept email with subdomain', async () => {
      req.body = { field: 'email', value: 'test@mail.example.com' }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(null)

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(200)
    })
  })

  describe('Mobile Format Validation', () => {
    it('should return 400 for invalid mobile format', async () => {
      req.body = { field: 'mobile', value: 'invalid' }
      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Invalid mobile number format',
        isUnique: false,
      })
    })

    it('should return 400 for mobile without country code', async () => {
      req.body = { field: 'mobile', value: '1234567890' }
      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Invalid mobile number format',
        isUnique: false,
      })
    })

    it('should return 400 for too short mobile', async () => {
      req.body = { field: 'mobile', value: '+9112345' }
      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Invalid mobile number format',
        isUnique: false,
      })
    })

    it('should accept valid mobile with country code', async () => {
      req.body = { field: 'mobile', value: '+911234567890' }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(null)

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(200)
    })

    it('should accept international mobile numbers', async () => {
      req.body = { field: 'mobile', value: '+441234567890' }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(null)

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(200)
    })

    it('should accept US mobile numbers', async () => {
      req.body = { field: 'mobile', value: '+11234567890' }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(null)

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(200)
    })

    it('should handle mobile validation errors', async () => {
      req.body = { field: 'mobile', value: 'abc' }
      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Invalid mobile number format',
        isUnique: false,
      })
    })
  })

  describe('Username Uniqueness Check', () => {
    it('should query database for username', async () => {
      req.body = { field: 'username', value: 'testuser' }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(null)

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: { username: 'testuser' },
        select: { id: true },
      })
    })

    it('should return isUnique true if username not found', async () => {
      req.body = { field: 'username', value: 'newuser' }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(null)

      await handler(req as NextApiRequest, res as NextApiResponse)
      const response = jsonMock.mock.calls[0][0]
      expect(response.isUnique).toBe(true)
    })

    it('should return isUnique false if username exists', async () => {
      req.body = { field: 'username', value: 'existinguser' }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue({ id: '123' })

      await handler(req as NextApiRequest, res as NextApiResponse)
      const response = jsonMock.mock.calls[0][0]
      expect(response.isUnique).toBe(false)
    })

    it('should return 200 even if username is not unique', async () => {
      req.body = { field: 'username', value: 'existinguser' }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue({ id: '123' })

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(200)
    })

    it('should check username without verification filter', async () => {
      req.body = { field: 'username', value: 'testuser' }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(null)

      await handler(req as NextApiRequest, res as NextApiResponse)
      const query = (prisma.user.findFirst as jest.Mock).mock.calls[0][0]
      expect(query.where).not.toHaveProperty('emailVerified')
      expect(query.where).not.toHaveProperty('mobileVerified')
    })
  })

  describe('Email Uniqueness Check', () => {
    it('should query database for verified email only', async () => {
      req.body = { field: 'email', value: 'test@example.com' }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(null)

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: { email: 'test@example.com', emailVerified: { not: null } },
        select: { id: true },
      })
    })

    it('should return isUnique true if verified email not found', async () => {
      req.body = { field: 'email', value: 'new@example.com' }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(null)

      await handler(req as NextApiRequest, res as NextApiResponse)
      const response = jsonMock.mock.calls[0][0]
      expect(response.isUnique).toBe(true)
    })

    it('should return isUnique false if verified email exists', async () => {
      req.body = { field: 'email', value: 'existing@example.com' }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue({ id: '123' })

      await handler(req as NextApiRequest, res as NextApiResponse)
      const response = jsonMock.mock.calls[0][0]
      expect(response.isUnique).toBe(false)
    })

    it('should return isUnique true if email exists but not verified', async () => {
      req.body = { field: 'email', value: 'unverified@example.com' }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(null)

      await handler(req as NextApiRequest, res as NextApiResponse)
      const response = jsonMock.mock.calls[0][0]
      expect(response.isUnique).toBe(true)
    })

    it('should check for emailVerified not null', async () => {
      req.body = { field: 'email', value: 'test@example.com' }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(null)

      await handler(req as NextApiRequest, res as NextApiResponse)
      const query = (prisma.user.findFirst as jest.Mock).mock.calls[0][0]
      expect(query.where.emailVerified).toEqual({ not: null })
    })
  })

  describe('Mobile Uniqueness Check', () => {
    it('should query database for verified mobile only', async () => {
      req.body = { field: 'mobile', value: '+911234567890' }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(null)

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: { phone: '+911234567890', mobileVerified: { not: null } },
        select: { id: true },
      })
    })

    it('should return isUnique true if verified mobile not found', async () => {
      req.body = { field: 'mobile', value: '+919999999999' }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(null)

      await handler(req as NextApiRequest, res as NextApiResponse)
      const response = jsonMock.mock.calls[0][0]
      expect(response.isUnique).toBe(true)
    })

    it('should return isUnique false if verified mobile exists', async () => {
      req.body = { field: 'mobile', value: '+911234567890' }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue({ id: '123' })

      await handler(req as NextApiRequest, res as NextApiResponse)
      const response = jsonMock.mock.calls[0][0]
      expect(response.isUnique).toBe(false)
    })

    it('should return isUnique true if mobile exists but not verified', async () => {
      req.body = { field: 'mobile', value: '+911234567890' }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(null)

      await handler(req as NextApiRequest, res as NextApiResponse)
      const response = jsonMock.mock.calls[0][0]
      expect(response.isUnique).toBe(true)
    })

    it('should check for mobileVerified not null', async () => {
      req.body = { field: 'mobile', value: '+911234567890' }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(null)

      await handler(req as NextApiRequest, res as NextApiResponse)
      const query = (prisma.user.findFirst as jest.Mock).mock.calls[0][0]
      expect(query.where.mobileVerified).toEqual({ not: null })
    })
  })

  describe('Success Response', () => {
    it('should return 200 on successful check', async () => {
      req.body = { field: 'username', value: 'testuser' }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(null)

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(200)
    })

    it('should return only isUnique field for unique value', async () => {
      req.body = { field: 'username', value: 'testuser' }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(null)

      await handler(req as NextApiRequest, res as NextApiResponse)
      const response = jsonMock.mock.calls[0][0]
      expect(response).toEqual({ isUnique: true })
    })

    it('should return only isUnique field for non-unique value', async () => {
      req.body = { field: 'username', value: 'existinguser' }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue({ id: '123' })

      await handler(req as NextApiRequest, res as NextApiResponse)
      const response = jsonMock.mock.calls[0][0]
      expect(response).toEqual({ isUnique: false })
    })
  })

  describe('Error Handling', () => {
    it('should return 500 on database error for username check', async () => {
      req.body = { field: 'username', value: 'testuser' }
      ;(prisma.user.findFirst as jest.Mock).mockRejectedValue(new Error('Database error'))

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(500)
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Internal server error',
        error: 'Database error',
      })
    })

    it('should return 500 on database error for email check', async () => {
      req.body = { field: 'email', value: 'test@example.com' }
      ;(prisma.user.findFirst as jest.Mock).mockRejectedValue(new Error('Database error'))

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(500)
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Internal server error',
        error: 'Database error',
      })
    })

    it('should return 500 on database error for mobile check', async () => {
      req.body = { field: 'mobile', value: '+911234567890' }
      ;(prisma.user.findFirst as jest.Mock).mockRejectedValue(new Error('Database error'))

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(500)
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Internal server error',
        error: 'Database error',
      })
    })

    it('should include error message in response', async () => {
      req.body = { field: 'username', value: 'testuser' }
      ;(prisma.user.findFirst as jest.Mock).mockRejectedValue(new Error('Connection timeout'))

      await handler(req as NextApiRequest, res as NextApiResponse)
      const response = jsonMock.mock.calls[0][0]
      expect(response.error).toBe('Connection timeout')
    })

    it('should handle non-Error objects', async () => {
      req.body = { field: 'username', value: 'testuser' }
      ;(prisma.user.findFirst as jest.Mock).mockRejectedValue('String error')

      await handler(req as NextApiRequest, res as NextApiResponse)
      const response = jsonMock.mock.calls[0][0]
      expect(response.error).toBe('String error')
    })

    it('should handle unexpected errors gracefully', async () => {
      req.body = { field: 'username', value: 'testuser' }
      ;(prisma.user.findFirst as jest.Mock).mockImplementation(() => {
        throw new Error('Unexpected error')
      })

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(500)
    })

    it('should handle network errors', async () => {
      req.body = { field: 'email', value: 'test@example.com' }
      ;(prisma.user.findFirst as jest.Mock).mockRejectedValue(new Error('Network error'))

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(500)
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Internal server error',
        error: 'Network error',
      })
    })

    it('should handle timeout errors', async () => {
      req.body = { field: 'username', value: 'testuser' }
      ;(prisma.user.findFirst as jest.Mock).mockRejectedValue(new Error('Timeout'))

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(500)
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Internal server error',
        error: 'Timeout',
      })
    })
  })

  describe('Development Mode Logging', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development'
    })

    it('should log query result in development mode', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
      req.body = { field: 'username', value: 'testuser' }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(null)

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })

    it('should not log in non-development mode', async () => {
      process.env.NODE_ENV = 'production'
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
      req.body = { field: 'username', value: 'testuser' }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(null)

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(consoleSpy).not.toHaveBeenCalled()
      consoleSpy.mockRestore()
    })
  })

  describe('Edge Cases', () => {
    it('should handle very long usernames', async () => {
      req.body = { field: 'username', value: 'a'.repeat(100) }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(null)

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(200)
    })

    it('should handle usernames with special characters', async () => {
      req.body = { field: 'username', value: 'user_name-123' }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(null)

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(200)
    })

    it('should handle very long emails', async () => {
      const longEmail = 'a'.repeat(50) + '@' + 'b'.repeat(50) + '.com'
      req.body = { field: 'email', value: longEmail }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(null)

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(200)
    })

    it('should handle email with multiple subdomains', async () => {
      req.body = { field: 'email', value: 'test@mail.corporate.example.com' }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(null)

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(200)
    })

    it('should handle mobile with maximum length', async () => {
      req.body = { field: 'mobile', value: '+123456789012345' }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(null)

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(200)
    })

    it('should handle mobile with spaces and parentheses', async () => {
      req.body = { field: 'mobile', value: '+91 (123) 456-7890' }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(null)

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(statusMock).toHaveBeenCalledWith(200)
    })

    it('should handle concurrent requests', async () => {
      req.body = { field: 'username', value: 'testuser' }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(null)

      const promise1 = handler(req as NextApiRequest, res as NextApiResponse)
      const promise2 = handler(req as NextApiRequest, res as NextApiResponse)

      await Promise.all([promise1, promise2])
      expect(statusMock).toHaveBeenCalledWith(200)
    })
  })

  describe('Database Query Optimization', () => {
    it('should select only id field for efficiency', async () => {
      req.body = { field: 'username', value: 'testuser' }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(null)

      await handler(req as NextApiRequest, res as NextApiResponse)
      const query = (prisma.user.findFirst as jest.Mock).mock.calls[0][0]
      expect(query.select).toEqual({ id: true })
    })

    it('should not fetch unnecessary user fields', async () => {
      req.body = { field: 'email', value: 'test@example.com' }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue({ id: '123' })

      await handler(req as NextApiRequest, res as NextApiResponse)
      const query = (prisma.user.findFirst as jest.Mock).mock.calls[0][0]
      expect(Object.keys(query.select)).toEqual(['id'])
    })

    it('should use findFirst for efficient querying', async () => {
      req.body = { field: 'username', value: 'testuser' }
      ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(null)

      await handler(req as NextApiRequest, res as NextApiResponse)
      expect(prisma.user.findFirst).toHaveBeenCalled()
    })
  })
})
