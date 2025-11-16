import { NextApiRequest, NextApiResponse } from 'next'
import bcrypt from 'bcryptjs'
import handler from '@/pages/api/user/update-password'
import { prisma } from '@/lib/cockroachDB/prisma'

jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
}))

jest.mock('@/lib/cockroachDB/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}))

describe('/api/user/update-password', () => {
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
      req.body = { userId: 'user-1', newPassword: 'newpass123' }
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'user-1' })
      ;(bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword')
      ;(prisma.user.update as jest.Mock).mockResolvedValue({ id: 'user-1' })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).not.toHaveBeenCalledWith(405)
    })
  })

  describe('Input Validation', () => {
    beforeEach(() => {
      req.method = 'POST'
    })

    it('should return 400 when userId is missing', async () => {
      req.body = { newPassword: 'password123' }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'User ID and new password are required',
      })
    })

    it('should return 400 when newPassword is missing', async () => {
      req.body = { userId: 'user-1' }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'User ID and new password are required',
      })
    })

    it('should return 400 when both userId and newPassword are missing', async () => {
      req.body = {}

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'User ID and new password are required',
      })
    })

    it('should return 400 when userId is empty string', async () => {
      req.body = { userId: '', newPassword: 'password123' }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'User ID and new password are required',
      })
    })

    it('should return 400 when newPassword is empty string', async () => {
      req.body = { userId: 'user-1', newPassword: '' }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'User ID and new password are required',
      })
    })

    it('should return 400 when password is less than 6 characters', async () => {
      req.body = { userId: 'user-1', newPassword: '12345' }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Password must be at least 6 characters',
      })
    })

    it('should return 400 when password is exactly 5 characters', async () => {
      req.body = { userId: 'user-1', newPassword: 'pass5' }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(400)
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Password must be at least 6 characters',
      })
    })

    it('should accept password with exactly 6 characters', async () => {
      req.body = { userId: 'user-1', newPassword: 'pass12' }
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'user-1' })
      ;(bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword')
      ;(prisma.user.update as jest.Mock).mockResolvedValue({ id: 'user-1' })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).not.toHaveBeenCalledWith(400)
    })

    it('should accept password with more than 6 characters', async () => {
      req.body = { userId: 'user-1', newPassword: 'password123456' }
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'user-1' })
      ;(bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword')
      ;(prisma.user.update as jest.Mock).mockResolvedValue({ id: 'user-1' })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).not.toHaveBeenCalledWith(400)
    })

    it('should return 400 when userId is null', async () => {
      req.body = { userId: null, newPassword: 'password123' }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(400)
    })

    it('should return 400 when newPassword is null', async () => {
      req.body = { userId: 'user-1', newPassword: null }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(400)
    })

    it('should return 400 when userId is undefined', async () => {
      req.body = { userId: undefined, newPassword: 'password123' }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(400)
    })
  })

  describe('User Lookup', () => {
    beforeEach(() => {
      req.method = 'POST'
    })

    it('should return 404 when user not found', async () => {
      req.body = { userId: 'nonexistent-user', newPassword: 'password123' }
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(404)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'User not found' })
    })

    it('should query user by correct userId', async () => {
      req.body = { userId: 'user-123', newPassword: 'password123' }
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'user-123' })
      ;(bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword')
      ;(prisma.user.update as jest.Mock).mockResolvedValue({ id: 'user-123' })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        select: { id: true },
      })
    })

    it('should select only id field for user lookup', async () => {
      req.body = { userId: 'user-1', newPassword: 'password123' }
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'user-1' })
      ;(bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword')
      ;(prisma.user.update as jest.Mock).mockResolvedValue({ id: 'user-1' })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        select: { id: true },
      })
    })
  })

  describe('Password Hashing', () => {
    beforeEach(() => {
      req.method = 'POST'
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'user-1' })
    })

    it('should hash password with bcrypt', async () => {
      const password = 'myNewPassword123'
      req.body = { userId: 'user-1', newPassword: password }
      ;(bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword')
      ;(prisma.user.update as jest.Mock).mockResolvedValue({ id: 'user-1' })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(bcrypt.hash).toHaveBeenCalledWith(password, 10)
    })

    it('should use salt rounds of 10', async () => {
      req.body = { userId: 'user-1', newPassword: 'password123' }
      ;(bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword')
      ;(prisma.user.update as jest.Mock).mockResolvedValue({ id: 'user-1' })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(bcrypt.hash).toHaveBeenCalledWith(expect.any(String), 10)
    })

    it('should hash special characters in password', async () => {
      const password = 'p@ssw0rd!#$%'
      req.body = { userId: 'user-1', newPassword: password }
      ;(bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword')
      ;(prisma.user.update as jest.Mock).mockResolvedValue({ id: 'user-1' })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(bcrypt.hash).toHaveBeenCalledWith(password, 10)
    })

    it('should hash unicode characters in password', async () => {
      const password = 'pässwörd123'
      req.body = { userId: 'user-1', newPassword: password }
      ;(bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword')
      ;(prisma.user.update as jest.Mock).mockResolvedValue({ id: 'user-1' })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(bcrypt.hash).toHaveBeenCalledWith(password, 10)
    })

    it('should hash very long password', async () => {
      const password = 'a'.repeat(100)
      req.body = { userId: 'user-1', newPassword: password }
      ;(bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword')
      ;(prisma.user.update as jest.Mock).mockResolvedValue({ id: 'user-1' })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(bcrypt.hash).toHaveBeenCalledWith(password, 10)
    })
  })

  describe('Password Update', () => {
    beforeEach(() => {
      req.method = 'POST'
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'user-1' })
      ;(bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword123')
    })

    it('should update user password in database', async () => {
      req.body = { userId: 'user-1', newPassword: 'password123' }
      ;(prisma.user.update as jest.Mock).mockResolvedValue({ id: 'user-1' })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { password: 'hashedPassword123' },
      })
    })

    it('should use correct userId in update', async () => {
      req.body = { userId: 'user-456', newPassword: 'password123' }
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'user-456' })
      ;(prisma.user.update as jest.Mock).mockResolvedValue({ id: 'user-456' })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-456' },
        data: { password: 'hashedPassword123' },
      })
    })

    it('should use hashed password in update', async () => {
      req.body = { userId: 'user-1', newPassword: 'password123' }
      const hashedPassword = '$2a$10$abcdefghijklmnopqrstuv'
      ;(bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword)
      ;(prisma.user.update as jest.Mock).mockResolvedValue({ id: 'user-1' })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { password: hashedPassword },
      })
    })

    it('should return 200 on successful update', async () => {
      req.body = { userId: 'user-1', newPassword: 'password123' }
      ;(prisma.user.update as jest.Mock).mockResolvedValue({ id: 'user-1' })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(200)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Password updated successfully' })
    })
  })

  describe('Error Handling', () => {
    beforeEach(() => {
      req.method = 'POST'
      req.body = { userId: 'user-1', newPassword: 'password123' }
    })

    it('should return 500 on database error during lookup', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockRejectedValue(
        new Error('Database connection failed')
      )

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(500)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Internal server error' })
    })

    it('should return 500 on database error during update', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'user-1' })
      ;(bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword')
      ;(prisma.user.update as jest.Mock).mockRejectedValue(
        new Error('Database update failed')
      )

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(500)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Internal server error' })
    })

    it('should return 500 on bcrypt hashing error', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'user-1' })
      ;(bcrypt.hash as jest.Mock).mockRejectedValue(new Error('Hashing failed'))

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(500)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Internal server error' })
    })

    it('should handle Prisma connection error', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockRejectedValue({
        code: 'P1001',
        message: 'Cannot connect to database',
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(500)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Internal server error' })
    })

    it('should handle timeout error', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error('Timeout'))

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(500)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Internal server error' })
    })

    it('should handle network error', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockRejectedValue(
        new Error('Network error')
      )

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(500)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Internal server error' })
    })
  })

  describe('Password Requirements', () => {
    beforeEach(() => {
      req.method = 'POST'
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'user-1' })
      ;(bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword')
      ;(prisma.user.update as jest.Mock).mockResolvedValue({ id: 'user-1' })
    })

    it('should accept password with only letters', async () => {
      req.body = { userId: 'user-1', newPassword: 'abcdefgh' }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(200)
    })

    it('should accept password with only numbers', async () => {
      req.body = { userId: 'user-1', newPassword: '123456789' }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(200)
    })

    it('should accept password with letters and numbers', async () => {
      req.body = { userId: 'user-1', newPassword: 'abc123' }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(200)
    })

    it('should accept password with special characters', async () => {
      req.body = { userId: 'user-1', newPassword: 'p@ssw0rd!' }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(200)
    })

    it('should accept password with spaces', async () => {
      req.body = { userId: 'user-1', newPassword: 'pass word 123' }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(200)
    })

    it('should accept password with mixed case', async () => {
      req.body = { userId: 'user-1', newPassword: 'PaSsWoRd123' }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(200)
    })
  })

  describe('Edge Cases', () => {
    beforeEach(() => {
      req.method = 'POST'
    })

    it('should handle userId with special characters', async () => {
      req.body = { userId: 'user-id-with-dashes', newPassword: 'password123' }
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-id-with-dashes',
      })
      ;(bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword')
      ;(prisma.user.update as jest.Mock).mockResolvedValue({
        id: 'user-id-with-dashes',
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(200)
    })

    it('should handle very long userId', async () => {
      const longUserId = 'u'.repeat(100)
      req.body = { userId: longUserId, newPassword: 'password123' }
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: longUserId })
      ;(bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword')
      ;(prisma.user.update as jest.Mock).mockResolvedValue({ id: longUserId })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(200)
    })

    it('should handle UUID format userId', async () => {
      const uuidUserId = '550e8400-e29b-41d4-a716-446655440000'
      req.body = { userId: uuidUserId, newPassword: 'password123' }
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: uuidUserId })
      ;(bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword')
      ;(prisma.user.update as jest.Mock).mockResolvedValue({ id: uuidUserId })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(200)
    })

    it('should trim or handle whitespace in password', async () => {
      req.body = { userId: 'user-1', newPassword: '  password123  ' }
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'user-1' })
      ;(bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword')
      ;(prisma.user.update as jest.Mock).mockResolvedValue({ id: 'user-1' })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(bcrypt.hash).toHaveBeenCalledWith('  password123  ', 10)
    })
  })

  describe('Development vs Production', () => {
    beforeEach(() => {
      req.method = 'POST'
      req.body = { userId: 'user-1', newPassword: 'password123' }
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

      ;(prisma.user.findUnique as jest.Mock).mockRejectedValue(
        new Error('Production error')
      )

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(500)

      process.env.NODE_ENV = originalEnv
    })
  })

  describe('Request Body Variations', () => {
    beforeEach(() => {
      req.method = 'POST'
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'user-1' })
      ;(bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword')
      ;(prisma.user.update as jest.Mock).mockResolvedValue({ id: 'user-1' })
    })

    it('should ignore extra fields in request body', async () => {
      req.body = {
        userId: 'user-1',
        newPassword: 'password123',
        extraField: 'should be ignored',
        anotherField: 123,
      }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(200)
    })

    it('should handle request body with only required fields', async () => {
      req.body = {
        userId: 'user-1',
        newPassword: 'password123',
      }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(200)
    })
  })

  describe('Concurrency', () => {
    beforeEach(() => {
      req.method = 'POST'
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'user-1' })
      ;(bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword')
      ;(prisma.user.update as jest.Mock).mockResolvedValue({ id: 'user-1' })
    })

    it('should handle multiple simultaneous password updates', async () => {
      req.body = { userId: 'user-1', newPassword: 'password123' }

      const promises = [
        handler(req as NextApiRequest, res as NextApiResponse),
        handler(req as NextApiRequest, res as NextApiResponse),
        handler(req as NextApiRequest, res as NextApiResponse),
      ]

      await Promise.all(promises)

      expect(prisma.user.update).toHaveBeenCalledTimes(3)
    })
  })

  describe('Response Format', () => {
    beforeEach(() => {
      req.method = 'POST'
      req.body = { userId: 'user-1', newPassword: 'password123' }
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'user-1' })
      ;(bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword')
      ;(prisma.user.update as jest.Mock).mockResolvedValue({ id: 'user-1' })
    })

    it('should return success message on update', async () => {
      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Password updated successfully',
      })
    })

    it('should not return user data in response', async () => {
      await handler(req as NextApiRequest, res as NextApiResponse)

      const callArg = jsonMock.mock.calls[0][0]
      expect(callArg).not.toHaveProperty('user')
    })

    it('should not return password in response', async () => {
      await handler(req as NextApiRequest, res as NextApiResponse)

      const callArg = jsonMock.mock.calls[0][0]
      expect(callArg).not.toHaveProperty('password')
    })
  })
})
