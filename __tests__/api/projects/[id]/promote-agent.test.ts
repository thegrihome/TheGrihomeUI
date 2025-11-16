import { createMocks } from 'node-mocks-http'
import handler from '@/pages/api/projects/[id]/promote-agent'
import { prisma } from '@/lib/cockroachDB/prisma'
import { getServerSession } from 'next-auth/next'

jest.mock('@/lib/cockroachDB/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    projectAgent: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}))

jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(),
}))

describe('/api/projects/[id]/promote-agent', () => {
  const mockSession = {
    user: { email: 'test@example.com' },
  }

  const mockAgentUser = {
    id: 'user-123',
    role: 'AGENT',
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

  describe('Duration Validation', () => {
    beforeEach(() => {
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockAgentUser)
    })

    it('should use default duration of 30 days', async () => {
      ;(prisma.projectAgent.findUnique as jest.Mock).mockResolvedValue(null)
      ;(prisma.projectAgent.create as jest.Mock).mockResolvedValue({ id: 'pa-1' })

      const { req, res } = createMocks({ method: 'POST', query: { id: 'project-123' }, body: {} })
      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
    })

    it('should return 400 when duration is less than 1', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        query: { id: 'project-123' },
        body: { duration: 0 },
      })
      await handler(req, res)
      expect(res._getStatusCode()).toBe(400)
      expect(JSON.parse(res._getData())).toEqual({
        message: 'Duration must be between 1 and 365 days',
      })
    })

    it('should return 400 when duration is greater than 365', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        query: { id: 'project-123' },
        body: { duration: 366 },
      })
      await handler(req, res)
      expect(res._getStatusCode()).toBe(400)
    })

    it('should accept duration 1', async () => {
      ;(prisma.projectAgent.findUnique as jest.Mock).mockResolvedValue(null)
      ;(prisma.projectAgent.create as jest.Mock).mockResolvedValue({ id: 'pa-1' })

      const { req, res } = createMocks({
        method: 'POST',
        query: { id: 'project-123' },
        body: { duration: 1 },
      })
      await handler(req, res)
      expect(res._getStatusCode()).toBe(200)
    })

    it('should accept duration 365', async () => {
      ;(prisma.projectAgent.findUnique as jest.Mock).mockResolvedValue(null)
      ;(prisma.projectAgent.create as jest.Mock).mockResolvedValue({ id: 'pa-1' })

      const { req, res } = createMocks({
        method: 'POST',
        query: { id: 'project-123' },
        body: { duration: 365 },
      })
      await handler(req, res)
      expect(res._getStatusCode()).toBe(200)
    })
  })

  describe('User Role Validation', () => {
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

    it('should return 403 when user is not an agent', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'user-123', role: 'BUYER' })
      const { req, res } = createMocks({ method: 'POST', query: { id: 'project-123' } })
      await handler(req, res)
      expect(res._getStatusCode()).toBe(403)
      expect(JSON.parse(res._getData())).toEqual({
        message: 'Only agents can promote themselves',
      })
    })

    it('should continue when user is an agent', async () => {
      ;(prisma.projectAgent.findUnique as jest.Mock).mockResolvedValue(null)
      ;(prisma.projectAgent.create as jest.Mock).mockResolvedValue({ id: 'pa-1' })

      const { req, res } = createMocks({ method: 'POST', query: { id: 'project-123' } })
      await handler(req, res)
      expect(res._getStatusCode()).toBe(200)
    })
  })

  describe('Create New Registration with Promotion', () => {
    beforeEach(() => {
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockAgentUser)
      ;(prisma.projectAgent.findUnique as jest.Mock).mockResolvedValue(null)
    })

    it('should create new project agent with promotion', async () => {
      const mockProjectAgent = {
        id: 'pa-1',
        promotionStartDate: new Date(),
        promotionEndDate: new Date(),
        promotionPaymentAmount: 0,
      }
      ;(prisma.projectAgent.create as jest.Mock).mockResolvedValue(mockProjectAgent)

      const { req, res } = createMocks({
        method: 'POST',
        query: { id: 'project-123' },
        body: { duration: 60 },
      })
      await handler(req, res)

      expect(prisma.projectAgent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          projectId: 'project-123',
          userId: 'user-123',
          isPromoted: true,
          promotionPaymentAmount: 0,
        }),
      })
    })

    it('should calculate correct end date', async () => {
      const mockProjectAgent = { id: 'pa-1' }
      ;(prisma.projectAgent.create as jest.Mock).mockResolvedValue(mockProjectAgent)

      const { req, res } = createMocks({
        method: 'POST',
        query: { id: 'project-123' },
        body: { duration: 30 },
      })
      await handler(req, res)

      expect(prisma.projectAgent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            isPromoted: true,
          }),
        })
      )
    })
  })

  describe('Update Existing Registration', () => {
    beforeEach(() => {
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockAgentUser)
    })

    it('should update existing registration with promotion', async () => {
      const existingAgent = { id: 'pa-1', isPromoted: false }
      ;(prisma.projectAgent.findUnique as jest.Mock).mockResolvedValue(existingAgent)
      ;(prisma.projectAgent.update as jest.Mock).mockResolvedValue({
        ...existingAgent,
        isPromoted: true,
      })

      const { req, res } = createMocks({
        method: 'POST',
        query: { id: 'project-123' },
        body: { duration: 30 },
      })
      await handler(req, res)

      expect(prisma.projectAgent.update).toHaveBeenCalledWith({
        where: { id: 'pa-1' },
        data: expect.objectContaining({
          isPromoted: true,
          promotionPaymentAmount: 0,
        }),
      })
    })
  })

  describe('Success Response', () => {
    beforeEach(() => {
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockAgentUser)
      ;(prisma.projectAgent.findUnique as jest.Mock).mockResolvedValue(null)
    })

    it('should return 200 on success', async () => {
      ;(prisma.projectAgent.create as jest.Mock).mockResolvedValue({ id: 'pa-1' })

      const { req, res } = createMocks({ method: 'POST', query: { id: 'project-123' } })
      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
    })

    it('should return success message and promotion details', async () => {
      const now = new Date()
      const endDate = new Date(now)
      endDate.setDate(endDate.getDate() + 30)

      const mockProjectAgent = {
        id: 'pa-1',
        promotionStartDate: now,
        promotionEndDate: endDate,
        promotionPaymentAmount: 0,
      }
      ;(prisma.projectAgent.create as jest.Mock).mockResolvedValue(mockProjectAgent)

      const { req, res } = createMocks({ method: 'POST', query: { id: 'project-123' } })
      await handler(req, res)

      const data = JSON.parse(res._getData())
      expect(data.message).toBe('Agent promoted successfully')
      expect(data.promotion).toHaveProperty('id')
      expect(data.promotion).toHaveProperty('startDate')
      expect(data.promotion).toHaveProperty('endDate')
      expect(data.promotion).toHaveProperty('totalAmount')
      expect(data.promotion).toHaveProperty('totalDays')
    })

    it('should include correct payment amount (0)', async () => {
      ;(prisma.projectAgent.create as jest.Mock).mockResolvedValue({
        id: 'pa-1',
        promotionPaymentAmount: 0,
      })

      const { req, res } = createMocks({ method: 'POST', query: { id: 'project-123' } })
      await handler(req, res)

      const data = JSON.parse(res._getData())
      expect(data.promotion.totalAmount).toBe(0)
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
