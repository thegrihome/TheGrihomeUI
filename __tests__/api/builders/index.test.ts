import { createMocks } from 'node-mocks-http'
import handler from '@/pages/api/builders/index'
import { prisma } from '@/lib/cockroachDB/prisma'

jest.mock('@/lib/cockroachDB/prisma', () => ({
  prisma: {
    builder: { findMany: jest.fn(), count: jest.fn() },
  },
}))

describe('/api/builders', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return builders list', async () => {
    ;(prisma.builder.findMany as jest.Mock).mockResolvedValue([
      { id: 'b1', name: 'Builder 1', _count: { projects: 5 } },
    ])
    ;(prisma.builder.count as jest.Mock).mockResolvedValue(1)
    const { req, res } = createMocks({ method: 'GET' })
    await handler(req, res)
    expect(res._getStatusCode()).toBe(200)
    const data = JSON.parse(res._getData())
    expect(data.builders).toBeDefined()
    expect(data.pagination).toBeDefined()
  })

  it('should filter by search term', async () => {
    ;(prisma.builder.findMany as jest.Mock).mockResolvedValue([])
    ;(prisma.builder.count as jest.Mock).mockResolvedValue(0)
    const { req, res } = createMocks({ method: 'GET', query: { search: 'DLF' } })
    await handler(req, res)
    expect(prisma.builder.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ name: expect.any(Object) }),
      })
    )
  })

  it('should handle pagination', async () => {
    ;(prisma.builder.findMany as jest.Mock).mockResolvedValue([])
    ;(prisma.builder.count as jest.Mock).mockResolvedValue(50)
    const { req, res } = createMocks({ method: 'GET', query: { page: '2', limit: '10' } })
    await handler(req, res)
    expect(prisma.builder.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 10, take: 10 })
    )
  })

  it('should return 405 for POST method', async () => {
    const { req, res } = createMocks({ method: 'POST' })
    await handler(req, res)
    expect(res._getStatusCode()).toBe(405)
  })
})
