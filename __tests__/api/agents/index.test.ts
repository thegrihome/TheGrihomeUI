import { createMocks } from 'node-mocks-http'
import handler from '@/pages/api/agents/index'
import { prisma } from '@/lib/cockroachDB/prisma'

jest.mock('@/lib/cockroachDB/prisma', () => ({
  prisma: {
    user: { findMany: jest.fn(), count: jest.fn() },
    property: { count: jest.fn() },
  },
}))

jest.mock('@prisma/client', () => ({
  Prisma: {
    QueryMode: {
      insensitive: 'insensitive',
    },
  },
}))

describe('/api/agents', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return agents list', async () => {
    ;(prisma.user.findMany as jest.Mock).mockResolvedValue([
      { id: 'a1', name: 'Agent 1', role: 'AGENT' },
    ])
    ;(prisma.user.count as jest.Mock).mockResolvedValue(1)
    ;(prisma.property.count as jest.Mock).mockResolvedValue(5)
    const { req, res } = createMocks({ method: 'GET' })
    await handler(req, res)
    expect(res._getStatusCode()).toBe(200)
    const data = JSON.parse(res._getData())
    expect(data.agents).toBeDefined()
    expect(data.pagination).toBeDefined()
  })

  it('should filter by search term', async () => {
    ;(prisma.user.findMany as jest.Mock).mockResolvedValue([])
    ;(prisma.user.count as jest.Mock).mockResolvedValue(0)
    const { req, res } = createMocks({ method: 'GET', query: { search: 'John' } })
    await handler(req, res)
    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.any(Array),
        }),
      })
    )
  })

  it('should filter by company', async () => {
    ;(prisma.user.findMany as jest.Mock).mockResolvedValue([])
    ;(prisma.user.count as jest.Mock).mockResolvedValue(0)
    const { req, res } = createMocks({ method: 'GET', query: { company: 'ABC Realty' } })
    await handler(req, res)
    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          companyName: expect.any(Object),
        }),
      })
    )
  })

  it('should handle pagination', async () => {
    ;(prisma.user.findMany as jest.Mock).mockResolvedValue([])
    ;(prisma.user.count as jest.Mock).mockResolvedValue(50)
    const { req, res } = createMocks({ method: 'GET', query: { page: '2', limit: '10' } })
    await handler(req, res)
    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 10, take: 10 })
    )
  })

  it('should return 405 for POST method', async () => {
    const { req, res } = createMocks({ method: 'POST' })
    await handler(req, res)
    expect(res._getStatusCode()).toBe(405)
  })
})
