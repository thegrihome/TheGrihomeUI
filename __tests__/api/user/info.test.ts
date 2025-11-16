import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import handler from '@/pages/api/user/info'
import { prisma } from '@/lib/cockroachDB/prisma'

jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(),
}))

jest.mock('@/lib/cockroachDB/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
  },
}))

describe('/api/user/info', () => {
  let req: Partial<NextApiRequest>
  let res: Partial<NextApiResponse>
  let jsonMock: jest.Mock
  let statusMock: jest.Mock

  beforeEach(() => {
    jsonMock = jest.fn()
    statusMock = jest.fn(() => ({ json: jsonMock }))
    req = {
      method: 'GET',
      headers: {},
    }
    res = {
      status: statusMock,
    }
    jest.clearAllMocks()
  })

  describe('Method Validation', () => {
    it('should return 405 for POST method', async () => {
      req.method = 'POST'

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

    it('should accept GET method', async () => {
      req.method = 'GET'
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'test@example.com' },
      })
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).not.toHaveBeenCalledWith(405)
    })
  })

  describe('Authentication', () => {
    it('should return 401 when no session exists', async () => {
      req.method = 'GET'
      ;(getServerSession as jest.Mock).mockResolvedValue(null)

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(401)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Unauthorized' })
    })

    it('should return 401 when session has no user', async () => {
      req.method = 'GET'
      ;(getServerSession as jest.Mock).mockResolvedValue({})

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(401)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Unauthorized' })
    })

    it('should return 401 when session user has no email', async () => {
      req.method = 'GET'
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: {},
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(401)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Unauthorized' })
    })

    it('should return 401 when session user email is empty string', async () => {
      req.method = 'GET'
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { email: '' },
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(401)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Unauthorized' })
    })

    it('should pass authentication with valid session', async () => {
      req.method = 'GET'
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'test@example.com' },
      })
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).not.toHaveBeenCalledWith(401)
    })
  })

  describe('User Retrieval', () => {
    beforeEach(() => {
      req.method = 'GET'
    })

    it('should return 404 when user not found', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'test@example.com' },
      })
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(404)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'User not found' })
    })

    it('should query database with correct email', async () => {
      const email = 'test@example.com'
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { email },
      })
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email,
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email },
        select: {
          id: true,
          username: true,
          name: true,
          email: true,
          phone: true,
          emailVerified: true,
          mobileVerified: true,
          role: true,
          isAdmin: true,
          companyName: true,
          licenseNumber: true,
          image: true,
          createdAt: true,
        },
      })
    })

    it('should return user with all fields', async () => {
      const mockUser = {
        id: 'user-1',
        username: 'testuser',
        name: 'Test User',
        email: 'test@example.com',
        phone: '+911234567890',
        emailVerified: new Date('2024-01-01'),
        mobileVerified: new Date('2024-01-02'),
        role: 'BUYER',
        isAdmin: false,
        companyName: null,
        licenseNumber: null,
        image: 'https://example.com/avatar.jpg',
        createdAt: new Date('2024-01-01'),
      }

      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'test@example.com' },
      })
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(200)
      expect(jsonMock).toHaveBeenCalledWith({ user: mockUser })
    })

    it('should return user with minimal fields', async () => {
      const mockUser = {
        id: 'user-1',
        username: 'testuser',
        name: null,
        email: 'test@example.com',
        phone: null,
        emailVerified: null,
        mobileVerified: null,
        role: 'BUYER',
        isAdmin: false,
        companyName: null,
        licenseNumber: null,
        image: null,
        createdAt: new Date('2024-01-01'),
      }

      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'test@example.com' },
      })
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(200)
      expect(jsonMock).toHaveBeenCalledWith({ user: mockUser })
    })

    it('should return user with SELLER role', async () => {
      const mockUser = {
        id: 'user-1',
        username: 'seller',
        name: 'Seller User',
        email: 'seller@example.com',
        phone: '+911234567890',
        emailVerified: new Date(),
        mobileVerified: new Date(),
        role: 'SELLER',
        isAdmin: false,
        companyName: null,
        licenseNumber: null,
        image: null,
        createdAt: new Date(),
      }

      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'seller@example.com' },
      })
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(200)
      expect(jsonMock).toHaveBeenCalledWith({ user: mockUser })
    })

    it('should return user with AGENT role', async () => {
      const mockUser = {
        id: 'user-1',
        username: 'agent',
        name: 'Agent User',
        email: 'agent@example.com',
        phone: '+911234567890',
        emailVerified: new Date(),
        mobileVerified: new Date(),
        role: 'AGENT',
        isAdmin: false,
        companyName: 'Real Estate Co.',
        licenseNumber: 'LIC-12345',
        image: null,
        createdAt: new Date(),
      }

      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'agent@example.com' },
      })
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(200)
      expect(jsonMock).toHaveBeenCalledWith({ user: mockUser })
    })

    it('should return user with ADMIN role and isAdmin true', async () => {
      const mockUser = {
        id: 'user-1',
        username: 'admin',
        name: 'Admin User',
        email: 'admin@example.com',
        phone: '+911234567890',
        emailVerified: new Date(),
        mobileVerified: new Date(),
        role: 'ADMIN',
        isAdmin: true,
        companyName: null,
        licenseNumber: null,
        image: null,
        createdAt: new Date(),
      }

      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'admin@example.com' },
      })
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(200)
      expect(jsonMock).toHaveBeenCalledWith({ user: mockUser })
    })
  })

  describe('Error Handling', () => {
    beforeEach(() => {
      req.method = 'GET'
    })

    it('should return 500 on database error', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'test@example.com' },
      })
      ;(prisma.user.findUnique as jest.Mock).mockRejectedValue(
        new Error('Database connection failed')
      )

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(500)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Internal server error' })
    })

    it('should return 500 on session error', async () => {
      ;(getServerSession as jest.Mock).mockRejectedValue(new Error('Session error'))

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(500)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Internal server error' })
    })

    it('should handle Prisma not found error', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'test@example.com' },
      })
      ;(prisma.user.findUnique as jest.Mock).mockRejectedValue({
        code: 'P2025',
        message: 'Record not found',
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(500)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Internal server error' })
    })

    it('should handle timeout error', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'test@example.com' },
      })
      ;(prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error('Timeout'))

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(500)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Internal server error' })
    })

    it('should handle network error', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'test@example.com' },
      })
      ;(prisma.user.findUnique as jest.Mock).mockRejectedValue(
        new Error('Network error')
      )

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(500)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Internal server error' })
    })
  })

  describe('Email Variations', () => {
    beforeEach(() => {
      req.method = 'GET'
    })

    it('should handle lowercase email', async () => {
      const email = 'test@example.com'
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { email },
      })
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email,
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.user.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { email },
        })
      )
    })

    it('should handle uppercase email', async () => {
      const email = 'TEST@EXAMPLE.COM'
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { email },
      })
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email,
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.user.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { email },
        })
      )
    })

    it('should handle email with plus addressing', async () => {
      const email = 'test+tag@example.com'
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { email },
      })
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email,
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.user.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { email },
        })
      )
    })

    it('should handle email with dots', async () => {
      const email = 'test.user.name@example.com'
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { email },
      })
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email,
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.user.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { email },
        })
      )
    })

    it('should handle email with subdomain', async () => {
      const email = 'test@mail.example.com'
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { email },
      })
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email,
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.user.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { email },
        })
      )
    })
  })

  describe('Field Selection', () => {
    beforeEach(() => {
      req.method = 'GET'
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'test@example.com' },
      })
    })

    it('should select only specified fields', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        select: expect.objectContaining({
          id: true,
          username: true,
          name: true,
          email: true,
          phone: true,
          emailVerified: true,
          mobileVerified: true,
          role: true,
          isAdmin: true,
          companyName: true,
          licenseNumber: true,
          image: true,
          createdAt: true,
        }),
      })
    })

    it('should not select password field', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      const selectArg = (prisma.user.findUnique as jest.Mock).mock.calls[0][0].select
      expect(selectArg).not.toHaveProperty('password')
    })

    it('should not select updatedAt field', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      const selectArg = (prisma.user.findUnique as jest.Mock).mock.calls[0][0].select
      expect(selectArg).not.toHaveProperty('updatedAt')
    })
  })

  describe('Response Format', () => {
    beforeEach(() => {
      req.method = 'GET'
    })

    it('should return user wrapped in object', async () => {
      const mockUser = {
        id: 'user-1',
        username: 'testuser',
        email: 'test@example.com',
      }

      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'test@example.com' },
      })
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(jsonMock).toHaveBeenCalledWith({ user: mockUser })
      expect(jsonMock).not.toHaveBeenCalledWith(mockUser)
    })

    it('should return 200 status code on success', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'test@example.com' },
      })
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(200)
    })
  })

  describe('Date Handling', () => {
    beforeEach(() => {
      req.method = 'GET'
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'test@example.com' },
      })
    })

    it('should handle emailVerified as Date object', async () => {
      const emailVerified = new Date('2024-01-15T10:30:00Z')
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        emailVerified,
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(jsonMock).toHaveBeenCalledWith({
        user: expect.objectContaining({
          emailVerified,
        }),
      })
    })

    it('should handle mobileVerified as Date object', async () => {
      const mobileVerified = new Date('2024-01-20T14:45:00Z')
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        mobileVerified,
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(jsonMock).toHaveBeenCalledWith({
        user: expect.objectContaining({
          mobileVerified,
        }),
      })
    })

    it('should handle createdAt as Date object', async () => {
      const createdAt = new Date('2023-12-01T08:00:00Z')
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        createdAt,
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(jsonMock).toHaveBeenCalledWith({
        user: expect.objectContaining({
          createdAt,
        }),
      })
    })

    it('should handle null verification dates', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        emailVerified: null,
        mobileVerified: null,
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(jsonMock).toHaveBeenCalledWith({
        user: expect.objectContaining({
          emailVerified: null,
          mobileVerified: null,
        }),
      })
    })
  })

  describe('Special Characters in Email', () => {
    beforeEach(() => {
      req.method = 'GET'
    })

    it('should handle email with numbers', async () => {
      const email = 'user123@example.com'
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { email },
      })
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email,
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(200)
    })

    it('should handle email with hyphens', async () => {
      const email = 'test-user@example.com'
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { email },
      })
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email,
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(200)
    })

    it('should handle email with underscores', async () => {
      const email = 'test_user@example.com'
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { email },
      })
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email,
      })

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(200)
    })
  })

  describe('Concurrent Requests', () => {
    beforeEach(() => {
      req.method = 'GET'
    })

    it('should handle multiple simultaneous requests', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({
        user: { email: 'test@example.com' },
      })
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
      })

      const promises = [
        handler(req as NextApiRequest, res as NextApiResponse),
        handler(req as NextApiRequest, res as NextApiResponse),
        handler(req as NextApiRequest, res as NextApiResponse),
      ]

      await Promise.all(promises)

      expect(prisma.user.findUnique).toHaveBeenCalledTimes(3)
    })
  })
})
