import { createMocks } from 'node-mocks-http'
import handler from '@/pages/api/projects/[id]/register-agent'
import { prisma } from '@/lib/cockroachDB/prisma'
import { getServerSession } from 'next-auth/next'

jest.mock('@/lib/cockroachDB/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    project: {
      findUnique: jest.fn(),
    },
    projectAgent: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}))

jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(),
}))

describe('/api/projects/[id]/register-agent', () => {
  const mockSession = {
    user: { email: 'test@example.com' },
  }

  const mockAgentUser = {
    id: 'user-123',
    role: 'AGENT',
  }

  const mockProject = {
    id: 'project-123',
    name: 'Test Project',
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

    it('should accept valid string id', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)
      const { req, res } = createMocks({ method: 'POST', query: { id: 'project-123' } })
      await handler(req, res)
      expect(res._getStatusCode()).not.toBe(400)
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
        message: 'Only agents can register for projects',
      })
    })

    it('should return 403 when user is a seller', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'user-123', role: 'SELLER' })
      const { req, res } = createMocks({ method: 'POST', query: { id: 'project-123' } })
      await handler(req, res)
      expect(res._getStatusCode()).toBe(403)
    })

    it('should continue when user is an agent', async () => {
      ;(prisma.project.findUnique as jest.Mock).mockResolvedValue(null)
      const { req, res } = createMocks({ method: 'POST', query: { id: 'project-123' } })
      await handler(req, res)
      expect(res._getStatusCode()).not.toBe(403)
    })
  })

  describe('Project Existence Check', () => {
    beforeEach(() => {
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockAgentUser)
    })

    it('should return 404 when project not found', async () => {
      ;(prisma.project.findUnique as jest.Mock).mockResolvedValue(null)
      const { req, res } = createMocks({ method: 'POST', query: { id: 'nonexistent' } })
      await handler(req, res)
      expect(res._getStatusCode()).toBe(404)
      expect(JSON.parse(res._getData())).toEqual({ message: 'Project not found' })
    })

    it('should continue when project exists', async () => {
      ;(prisma.projectAgent.findUnique as jest.Mock).mockResolvedValue(null)
      ;(prisma.projectAgent.create as jest.Mock).mockResolvedValue({ id: 'pa-1' })
      const { req, res } = createMocks({ method: 'POST', query: { id: 'project-123' } })
      await handler(req, res)
      expect(res._getStatusCode()).toBe(201)
    })
  })

  describe('Duplicate Registration Check', () => {
    beforeEach(() => {
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockAgentUser)
      ;(prisma.project.findUnique as jest.Mock).mockResolvedValue(mockProject)
    })

    it('should return 400 when already registered', async () => {
      ;(prisma.projectAgent.findUnique as jest.Mock).mockResolvedValue({ id: 'pa-1' })
      const { req, res } = createMocks({ method: 'POST', query: { id: 'project-123' } })
      await handler(req, res)
      expect(res._getStatusCode()).toBe(400)
      expect(JSON.parse(res._getData())).toEqual({
        message: 'You are already registered for this project',
      })
    })

    it('should check unique constraint on projectId and userId', async () => {
      ;(prisma.projectAgent.findUnique as jest.Mock).mockResolvedValue(null)
      ;(prisma.projectAgent.create as jest.Mock).mockResolvedValue({ id: 'pa-1' })

      const { req, res } = createMocks({ method: 'POST', query: { id: 'project-123' } })
      await handler(req, res)

      expect(prisma.projectAgent.findUnique).toHaveBeenCalledWith({
        where: {
          projectId_userId: {
            projectId: 'project-123',
            userId: 'user-123',
          },
        },
      })
    })
  })

  describe('Agent Registration', () => {
    beforeEach(() => {
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockAgentUser)
      ;(prisma.project.findUnique as jest.Mock).mockResolvedValue(mockProject)
      ;(prisma.projectAgent.findUnique as jest.Mock).mockResolvedValue(null)
    })

    it('should create project agent registration', async () => {
      const mockProjectAgent = {
        id: 'pa-1',
        registeredAt: new Date(),
      }
      ;(prisma.projectAgent.create as jest.Mock).mockResolvedValue(mockProjectAgent)

      const { req, res } = createMocks({ method: 'POST', query: { id: 'project-123' } })
      await handler(req, res)

      expect(prisma.projectAgent.create).toHaveBeenCalledWith({
        data: {
          projectId: 'project-123',
          userId: 'user-123',
        },
      })
    })

    it('should return 201 on successful registration', async () => {
      ;(prisma.projectAgent.create as jest.Mock).mockResolvedValue({
        id: 'pa-1',
        registeredAt: new Date(),
      })

      const { req, res } = createMocks({ method: 'POST', query: { id: 'project-123' } })
      await handler(req, res)

      expect(res._getStatusCode()).toBe(201)
    })

    it('should return success message and registration details', async () => {
      const now = new Date()
      const mockProjectAgent = {
        id: 'pa-1',
        registeredAt: now,
      }
      ;(prisma.projectAgent.create as jest.Mock).mockResolvedValue(mockProjectAgent)

      const { req, res } = createMocks({ method: 'POST', query: { id: 'project-123' } })
      await handler(req, res)

      const data = JSON.parse(res._getData())
      expect(data.message).toBe('Successfully registered as agent for this project')
      expect(data.projectAgent).toHaveProperty('id')
      expect(data.projectAgent).toHaveProperty('registeredAt')
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
