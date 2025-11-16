import { createMocks } from 'node-mocks-http'
import handler from '@/pages/api/agents/[id]/properties'
import { prisma } from '@/lib/cockroachDB/prisma'

jest.mock('@/lib/cockroachDB/prisma', () => ({
  prisma: {
    user: { findUnique: jest.fn() },
    property: { findMany: jest.fn(), count: jest.fn() },
  },
}))

describe('/api/agents/[id]/properties', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return 400 when id is missing', async () => {
    const { req, res } = createMocks({ method: 'GET', query: {} })
    await handler(req, res)
    expect(res._getStatusCode()).toBe(400)
  })

  it('should return 404 when agent not found', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)
    const { req, res } = createMocks({ method: 'GET', query: { id: 'a1' } })
    await handler(req, res)
    expect(res._getStatusCode()).toBe(404)
  })

  it('should return 400 when user is not an agent', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'a1', role: 'BUYER' })
    const { req, res } = createMocks({ method: 'GET', query: { id: 'a1' } })
    await handler(req, res)
    expect(res._getStatusCode()).toBe(400)
  })

  it('should return agent properties', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'a1', role: 'AGENT' })
    ;(prisma.property.findMany as jest.Mock).mockResolvedValue([])
    ;(prisma.property.count as jest.Mock).mockResolvedValueOnce(0).mockResolvedValueOnce(0)
    const { req, res } = createMocks({ method: 'GET', query: { id: 'a1' } })
    await handler(req, res)
    expect(res._getStatusCode()).toBe(200)
    const data = JSON.parse(res._getData())
    expect(data.agent).toBeDefined()
    expect(data.properties).toBeDefined()
  })

  it('should filter by status', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'a1', role: 'AGENT' })
    ;(prisma.property.findMany as jest.Mock).mockResolvedValue([])
    ;(prisma.property.count as jest.Mock).mockResolvedValue(0)
    const { req, res } = createMocks({ method: 'GET', query: { id: 'a1', status: 'ACTIVE' } })
    await handler(req, res)
    expect(prisma.property.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ listingStatus: 'ACTIVE' }),
      })
    )
  })

  it('should return 405 for POST method', async () => {
    const { req, res } = createMocks({ method: 'POST' })
    await handler(req, res)
    expect(res._getStatusCode()).toBe(405)
  })
})
