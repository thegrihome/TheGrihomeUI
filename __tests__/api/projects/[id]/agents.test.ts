import { createMocks } from 'node-mocks-http'
import handler from '@/pages/api/projects/[id]/agents'
import { prisma } from '@/lib/cockroachDB/prisma'

jest.mock('@/lib/cockroachDB/prisma', () => ({
  prisma: {
    project: {
      findUnique: jest.fn(),
    },
    projectAgent: {
      findMany: jest.fn(),
      update: jest.fn(),
    },
  },
}))

describe('/api/projects/[id]/agents', () => {
  const mockProject = { id: 'project-123' }

  const mockAgent = {
    id: 'pa-1',
    user: {
      id: 'user-1',
      name: 'Agent 1',
      username: 'agent1',
      email: 'agent1@test.com',
      phone: '+911234567890',
      image: null,
      companyName: 'Realty Co',
      licenseNumber: 'LIC123',
      role: 'AGENT',
      emailVerified: true,
      mobileVerified: true,
    },
    registeredAt: new Date('2024-01-01'),
    isPromoted: false,
    promotionEndDate: null,
  }

  const now = new Date()

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    jest.setSystemTime(now)
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('Method Validation', () => {
    it('should return 405 for POST method', async () => {
      const { req, res } = createMocks({ method: 'POST' })
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

    it('should return 405 for PATCH method', async () => {
      const { req, res } = createMocks({ method: 'PATCH' })
      await handler(req, res)
      expect(res._getStatusCode()).toBe(405)
    })

    it('should accept GET method', async () => {
      ;(prisma.project.findUnique as jest.Mock).mockResolvedValue(null)
      const { req, res } = createMocks({ method: 'GET', query: { id: 'project-123' } })
      await handler(req, res)
      expect(res._getStatusCode()).not.toBe(405)
    })
  })

  describe('Project ID Validation', () => {
    it('should return 400 when id is missing', async () => {
      const { req, res } = createMocks({ method: 'GET', query: {} })
      await handler(req, res)
      expect(res._getStatusCode()).toBe(400)
      expect(JSON.parse(res._getData())).toEqual({ message: 'Invalid project ID' })
    })

    it('should return 400 when id is not a string', async () => {
      const { req, res } = createMocks({ method: 'GET', query: { id: ['array'] } })
      await handler(req, res)
      expect(res._getStatusCode()).toBe(400)
    })

    it('should accept valid string id', async () => {
      ;(prisma.project.findUnique as jest.Mock).mockResolvedValue(null)
      const { req, res } = createMocks({ method: 'GET', query: { id: 'project-123' } })
      await handler(req, res)
      expect(res._getStatusCode()).not.toBe(400)
    })
  })

  describe('Project Existence Check', () => {
    it('should return 404 when project does not exist', async () => {
      ;(prisma.project.findUnique as jest.Mock).mockResolvedValue(null)
      const { req, res } = createMocks({ method: 'GET', query: { id: 'nonexistent' } })
      await handler(req, res)
      expect(res._getStatusCode()).toBe(404)
      expect(JSON.parse(res._getData())).toEqual({ message: 'Project not found' })
    })

    it('should continue when project exists', async () => {
      ;(prisma.project.findUnique as jest.Mock).mockResolvedValue(mockProject)
      ;(prisma.projectAgent.findMany as jest.Mock).mockResolvedValue([])
      const { req, res } = createMocks({ method: 'GET', query: { id: 'project-123' } })
      await handler(req, res)
      expect(res._getStatusCode()).toBe(200)
    })
  })

  describe('Agents Query', () => {
    beforeEach(() => {
      ;(prisma.project.findUnique as jest.Mock).mockResolvedValue(mockProject)
    })

    it('should query agents with correct projectId', async () => {
      ;(prisma.projectAgent.findMany as jest.Mock).mockResolvedValue([])
      const { req, res } = createMocks({ method: 'GET', query: { id: 'project-123' } })
      await handler(req, res)
      expect(prisma.projectAgent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { projectId: 'project-123' } })
      )
    })

    it('should include user information', async () => {
      ;(prisma.projectAgent.findMany as jest.Mock).mockResolvedValue([])
      const { req, res } = createMocks({ method: 'GET', query: { id: 'project-123' } })
      await handler(req, res)
      expect(prisma.projectAgent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: { user: { select: expect.any(Object) } },
        })
      )
    })

    it('should order by promotion status desc', async () => {
      ;(prisma.projectAgent.findMany as jest.Mock).mockResolvedValue([])
      const { req, res } = createMocks({ method: 'GET', query: { id: 'project-123' } })
      await handler(req, res)
      expect(prisma.projectAgent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: expect.arrayContaining([{ isPromoted: 'desc' }]),
        })
      )
    })
  })

  describe('Promotion Expiry Check', () => {
    beforeEach(() => {
      ;(prisma.project.findUnique as jest.Mock).mockResolvedValue(mockProject)
    })

    it('should update expired promotions', async () => {
      const expiredAgent = {
        ...mockAgent,
        isPromoted: true,
        promotionEndDate: new Date(now.getTime() - 1000),
      }
      ;(prisma.projectAgent.findMany as jest.Mock).mockResolvedValue([expiredAgent])
      ;(prisma.projectAgent.update as jest.Mock).mockResolvedValue({
        ...expiredAgent,
        isPromoted: false,
      })

      const { req, res } = createMocks({ method: 'GET', query: { id: 'project-123' } })
      await handler(req, res)

      expect(prisma.projectAgent.update).toHaveBeenCalledWith({
        where: { id: expiredAgent.id },
        data: { isPromoted: false, promotionStartDate: null, promotionEndDate: null },
      })
    })

    it('should not update active promotions', async () => {
      const activeAgent = {
        ...mockAgent,
        isPromoted: true,
        promotionEndDate: new Date(now.getTime() + 10000),
      }
      ;(prisma.projectAgent.findMany as jest.Mock).mockResolvedValue([activeAgent])

      const { req, res } = createMocks({ method: 'GET', query: { id: 'project-123' } })
      await handler(req, res)

      expect(prisma.projectAgent.update).not.toHaveBeenCalled()
    })

    it('should not update non-promoted agents', async () => {
      ;(prisma.projectAgent.findMany as jest.Mock).mockResolvedValue([mockAgent])

      const { req, res } = createMocks({ method: 'GET', query: { id: 'project-123' } })
      await handler(req, res)

      expect(prisma.projectAgent.update).not.toHaveBeenCalled()
    })
  })

  describe('Response Structure', () => {
    beforeEach(() => {
      ;(prisma.project.findUnique as jest.Mock).mockResolvedValue(mockProject)
    })

    it('should return empty arrays when no agents', async () => {
      ;(prisma.projectAgent.findMany as jest.Mock).mockResolvedValue([])
      const { req, res } = createMocks({ method: 'GET', query: { id: 'project-123' } })
      await handler(req, res)

      const data = JSON.parse(res._getData())
      expect(data.featuredAgents).toEqual([])
      expect(data.regularAgents).toEqual([])
      expect(data.totalAgents).toBe(0)
    })

    it('should separate featured and regular agents', async () => {
      const featuredAgent = {
        ...mockAgent,
        id: 'pa-1',
        isPromoted: true,
        promotionEndDate: new Date(now.getTime() + 10000),
      }
      const regularAgent = { ...mockAgent, id: 'pa-2', isPromoted: false }

      ;(prisma.projectAgent.findMany as jest.Mock).mockResolvedValue([featuredAgent, regularAgent])
      const { req, res } = createMocks({ method: 'GET', query: { id: 'project-123' } })
      await handler(req, res)

      const data = JSON.parse(res._getData())
      expect(data.featuredAgents).toHaveLength(1)
      expect(data.regularAgents).toHaveLength(1)
    })

    it('should limit featured agents to 5', async () => {
      const agents = Array(10)
        .fill(null)
        .map((_, i) => ({
          ...mockAgent,
          id: `pa-${i}`,
          isPromoted: true,
          promotionEndDate: new Date(now.getTime() + 10000),
        }))
      ;(prisma.projectAgent.findMany as jest.Mock).mockResolvedValue(agents)

      const { req, res } = createMocks({ method: 'GET', query: { id: 'project-123' } })
      await handler(req, res)

      const data = JSON.parse(res._getData())
      expect(data.featuredAgents).toHaveLength(5)
    })

    it('should include correct agent information', async () => {
      ;(prisma.projectAgent.findMany as jest.Mock).mockResolvedValue([mockAgent])
      const { req, res } = createMocks({ method: 'GET', query: { id: 'project-123' } })
      await handler(req, res)

      const data = JSON.parse(res._getData())
      expect(data.regularAgents[0].agent).toHaveProperty('id')
      expect(data.regularAgents[0].agent).toHaveProperty('name')
      expect(data.regularAgents[0].agent).toHaveProperty('email')
    })

    it('should include registration date', async () => {
      ;(prisma.projectAgent.findMany as jest.Mock).mockResolvedValue([mockAgent])
      const { req, res } = createMocks({ method: 'GET', query: { id: 'project-123' } })
      await handler(req, res)

      const data = JSON.parse(res._getData())
      expect(data.regularAgents[0]).toHaveProperty('registeredAt')
    })

    it('should include isFeatured flag', async () => {
      ;(prisma.projectAgent.findMany as jest.Mock).mockResolvedValue([mockAgent])
      const { req, res } = createMocks({ method: 'GET', query: { id: 'project-123' } })
      await handler(req, res)

      const data = JSON.parse(res._getData())
      expect(data.regularAgents[0]).toHaveProperty('isFeatured', false)
    })

    it('should include totalAgents count', async () => {
      const agents = [mockAgent, { ...mockAgent, id: 'pa-2' }, { ...mockAgent, id: 'pa-3' }]
      ;(prisma.projectAgent.findMany as jest.Mock).mockResolvedValue(agents)
      const { req, res } = createMocks({ method: 'GET', query: { id: 'project-123' } })
      await handler(req, res)

      const data = JSON.parse(res._getData())
      expect(data.totalAgents).toBe(3)
    })
  })

  describe('Error Handling', () => {
    it('should return 500 on database error', async () => {
      ;(prisma.project.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'))
      const { req, res } = createMocks({ method: 'GET', query: { id: 'project-123' } })
      await handler(req, res)

      expect(res._getStatusCode()).toBe(500)
      expect(JSON.parse(res._getData())).toEqual({ message: 'Internal server error' })
    })

    it('should handle unexpected errors', async () => {
      ;(prisma.project.findUnique as jest.Mock).mockImplementation(() => {
        throw new Error('Unexpected error')
      })
      const { req, res } = createMocks({ method: 'GET', query: { id: 'project-123' } })
      await handler(req, res)

      expect(res._getStatusCode()).toBe(500)
    })
  })
})
