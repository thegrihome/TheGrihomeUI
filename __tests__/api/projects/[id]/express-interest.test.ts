import { createMocks } from 'node-mocks-http'
import handler from '@/pages/api/projects/[id]/express-interest'
import { prisma } from '@/lib/cockroachDB/prisma'
import { getServerSession } from 'next-auth/next'
import { Resend } from 'resend'

jest.mock('@/lib/cockroachDB/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    project: {
      findUnique: jest.fn(),
    },
    interest: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}))

jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(),
}))

jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: {
      send: jest.fn().mockResolvedValue({ id: 'email-id' }),
    },
  })),
}))

describe('/api/projects/[id]/express-interest', () => {
  const mockSession = {
    user: { email: 'test@example.com' },
  }

  const mockUser = {
    id: 'user-123',
    name: 'Test User',
    username: 'testuser',
    email: 'test@example.com',
    phone: '+911234567890',
    emailVerified: true,
    mobileVerified: false,
  }

  const mockProject = {
    id: 'project-123',
    name: 'Test Project',
    builder: { name: 'Test Builder' },
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Method Validation', () => {
    it('should return 405 for GET method', async () => {
      const { req, res } = createMocks({ method: 'GET' })
      await handler(req, res)
      expect(res._getStatusCode()).toBe(405)
      expect(JSON.parse(res._getData())).toEqual({ message: 'Method not allowed' })
    })

    it('should return 405 for PUT method', async () => {
      const { req, res } = createMocks({ method: 'PUT' })
      await handler(req, res)
      expect(res._getStatusCode()).toBe(405)
    })

    it('should return 405 for DELETE method', async () => {
      const { req, res } = createMocks({ method: 'DELETE' })
      await handler(req, res)
      expect(res._getStatusCode()).toBe(405)
    })

    it('should accept POST method', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(null)
      const { req, res } = createMocks({ method: 'POST', query: { id: 'project-123' } })
      await handler(req, res)
      expect(res._getStatusCode()).not.toBe(405)
    })
  })

  describe('Authentication', () => {
    it('should return 401 when no session', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(null)
      const { req, res } = createMocks({ method: 'POST', query: { id: 'project-123' } })
      await handler(req, res)
      expect(res._getStatusCode()).toBe(401)
      expect(JSON.parse(res._getData())).toEqual({ message: 'Unauthorized' })
    })

    it('should return 401 when no user email', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue({ user: {} })
      const { req, res } = createMocks({ method: 'POST', query: { id: 'project-123' } })
      await handler(req, res)
      expect(res._getStatusCode()).toBe(401)
    })
  })

  describe('Project ID Validation', () => {
    beforeEach(() => {
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
    })

    it('should return 400 when id is missing', async () => {
      const { req, res } = createMocks({ method: 'POST', query: {} })
      await handler(req, res)
      expect(res._getStatusCode()).toBe(400)
      expect(JSON.parse(res._getData())).toEqual({ message: 'Invalid project ID' })
    })

    it('should return 400 when id is not a string', async () => {
      const { req, res } = createMocks({ method: 'POST', query: { id: ['array'] } })
      await handler(req, res)
      expect(res._getStatusCode()).toBe(400)
    })
  })

  describe('User Verification Check', () => {
    beforeEach(() => {
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
    })

    it('should return 404 when user not found', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)
      const { req, res } = createMocks({ method: 'POST', query: { id: 'project-123' } })
      await handler(req, res)
      expect(res._getStatusCode()).toBe(404)
      expect(JSON.parse(res._getData())).toEqual({ message: 'User not found' })
    })

    it('should return 400 when neither email nor mobile verified', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        ...mockUser,
        emailVerified: false,
        mobileVerified: false,
      })
      const { req, res } = createMocks({ method: 'POST', query: { id: 'project-123' } })
      await handler(req, res)
      expect(res._getStatusCode()).toBe(400)
      expect(JSON.parse(res._getData())).toEqual({
        message: 'Please verify your email or mobile number to express interest',
      })
    })

    it('should continue when email is verified', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
      ;(prisma.project.findUnique as jest.Mock).mockResolvedValue(null)
      const { req, res } = createMocks({ method: 'POST', query: { id: 'project-123' } })
      await handler(req, res)
      expect(res._getStatusCode()).not.toBe(400)
    })

    it('should continue when mobile is verified', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        ...mockUser,
        emailVerified: false,
        mobileVerified: true,
      })
      ;(prisma.project.findUnique as jest.Mock).mockResolvedValue(null)
      const { req, res } = createMocks({ method: 'POST', query: { id: 'project-123' } })
      await handler(req, res)
      expect(res._getStatusCode()).not.toBe(400)
    })
  })

  describe('Project Existence Check', () => {
    beforeEach(() => {
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
    })

    it('should return 404 when project not found', async () => {
      ;(prisma.project.findUnique as jest.Mock).mockResolvedValue(null)
      const { req, res } = createMocks({ method: 'POST', query: { id: 'project-123' } })
      await handler(req, res)
      expect(res._getStatusCode()).toBe(404)
      expect(JSON.parse(res._getData())).toEqual({ message: 'Project not found' })
    })

    it('should continue when project exists', async () => {
      ;(prisma.project.findUnique as jest.Mock).mockResolvedValue(mockProject)
      ;(prisma.interest.findUnique as jest.Mock).mockResolvedValue(null)
      ;(prisma.interest.create as jest.Mock).mockResolvedValue({ id: 'interest-123' })
      const { req, res } = createMocks({ method: 'POST', query: { id: 'project-123' } })
      await handler(req, res)
      expect(res._getStatusCode()).toBe(201)
    })
  })

  describe('Duplicate Interest Check', () => {
    beforeEach(() => {
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
      ;(prisma.project.findUnique as jest.Mock).mockResolvedValue(mockProject)
    })

    it('should return 400 when user already expressed interest', async () => {
      ;(prisma.interest.findUnique as jest.Mock).mockResolvedValue({ id: 'existing' })
      const { req, res } = createMocks({ method: 'POST', query: { id: 'project-123' } })
      await handler(req, res)
      expect(res._getStatusCode()).toBe(400)
      expect(JSON.parse(res._getData())).toEqual({
        message: 'You have already expressed interest in this project',
      })
    })

    it('should continue when no existing interest', async () => {
      ;(prisma.interest.findUnique as jest.Mock).mockResolvedValue(null)
      ;(prisma.interest.create as jest.Mock).mockResolvedValue({ id: 'interest-123' })
      const { req, res } = createMocks({ method: 'POST', query: { id: 'project-123' } })
      await handler(req, res)
      expect(res._getStatusCode()).toBe(201)
    })
  })

  describe('Interest Creation', () => {
    beforeEach(() => {
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
      ;(prisma.project.findUnique as jest.Mock).mockResolvedValue(mockProject)
      ;(prisma.interest.findUnique as jest.Mock).mockResolvedValue(null)
    })

    it('should create interest record', async () => {
      const mockInterest = { id: 'interest-123', createdAt: new Date() }
      ;(prisma.interest.create as jest.Mock).mockResolvedValue(mockInterest)
      
      const { req, res } = createMocks({ method: 'POST', query: { id: 'project-123' } })
      await handler(req, res)

      expect(prisma.interest.create).toHaveBeenCalledWith({
        data: {
          userId: mockUser.id,
          projectId: 'project-123',
          message: null,
        },
      })
    })

    it('should include message when provided', async () => {
      const mockInterest = { id: 'interest-123', createdAt: new Date() }
      ;(prisma.interest.create as jest.Mock).mockResolvedValue(mockInterest)
      
      const { req, res } = createMocks({
        method: 'POST',
        query: { id: 'project-123' },
        body: { message: 'I am interested' },
      })
      await handler(req, res)

      expect(prisma.interest.create).toHaveBeenCalledWith({
        data: {
          userId: mockUser.id,
          projectId: 'project-123',
          message: 'I am interested',
        },
      })
    })

    it('should return 201 on successful creation', async () => {
      const mockInterest = { id: 'interest-123', createdAt: new Date() }
      ;(prisma.interest.create as jest.Mock).mockResolvedValue(mockInterest)
      
      const { req, res } = createMocks({ method: 'POST', query: { id: 'project-123' } })
      await handler(req, res)

      expect(res._getStatusCode()).toBe(201)
    })

    it('should return success message and interest', async () => {
      const mockInterest = { id: 'interest-123', createdAt: new Date() }
      ;(prisma.interest.create as jest.Mock).mockResolvedValue(mockInterest)
      
      const { req, res } = createMocks({ method: 'POST', query: { id: 'project-123' } })
      await handler(req, res)

      const data = JSON.parse(res._getData())
      expect(data.message).toBe('Interest expressed successfully')
      expect(data.interest).toHaveProperty('id')
      expect(data.interest).toHaveProperty('createdAt')
    })
  })

  describe('Email Notification', () => {
    beforeEach(() => {
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
      ;(prisma.project.findUnique as jest.Mock).mockResolvedValue(mockProject)
      ;(prisma.interest.findUnique as jest.Mock).mockResolvedValue(null)
      ;(prisma.interest.create as jest.Mock).mockResolvedValue({ id: 'interest-123', createdAt: new Date() })
    })

    it('should send email notification', async () => {
      const { req, res } = createMocks({ method: 'POST', query: { id: 'project-123' } })
      await handler(req, res)

      const resendInstance = new Resend('')
      expect(resendInstance.emails.send).toHaveBeenCalled()
    })

    it('should not fail request if email fails', async () => {
      const resendInstance = new Resend('')
      ;(resendInstance.emails.send as jest.Mock).mockRejectedValue(new Error('Email failed'))
      
      const { req, res } = createMocks({ method: 'POST', query: { id: 'project-123' } })
      await handler(req, res)

      expect(res._getStatusCode()).toBe(201)
    })
  })

  describe('Error Handling', () => {
    it('should return 500 on database error', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
      ;(prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'))
      
      const { req, res } = createMocks({ method: 'POST', query: { id: 'project-123' } })
      await handler(req, res)

      expect(res._getStatusCode()).toBe(500)
      expect(JSON.parse(res._getData())).toEqual({ message: 'Internal server error' })
    })

    it('should handle unexpected errors', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
      ;(prisma.user.findUnique as jest.Mock).mockImplementation(() => {
        throw new Error('Unexpected error')
      })
      
      const { req, res } = createMocks({ method: 'POST', query: { id: 'project-123' } })
      await handler(req, res)

      expect(res._getStatusCode()).toBe(500)
    })
  })
})
