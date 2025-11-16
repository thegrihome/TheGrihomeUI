import { createMocks } from 'node-mocks-http'
import handler from '@/pages/api/cron/expire-ads'
import { prisma } from '@/lib/cockroachDB/prisma'

jest.mock('@/lib/cockroachDB/prisma', () => ({
  prisma: {
    ad: { findMany: jest.fn(), updateMany: jest.fn() },
  },
}))

describe('/api/cron/expire-ads', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should expire ads past end date', async () => {
    ;(prisma.ad.findMany as jest.Mock).mockResolvedValue([{ id: 'ad1' }, { id: 'ad2' }])
    ;(prisma.ad.updateMany as jest.Mock).mockResolvedValue({ count: 2 })
    const { req, res } = createMocks({ method: 'GET' })
    await handler(req, res)
    expect(res._getStatusCode()).toBe(200)
    const data = JSON.parse(res._getData())
    expect(data.expiredCount).toBe(2)
  })

  it('should return 0 when no ads to expire', async () => {
    ;(prisma.ad.findMany as jest.Mock).mockResolvedValue([])
    ;(prisma.ad.updateMany as jest.Mock).mockResolvedValue({ count: 0 })
    const { req, res } = createMocks({ method: 'GET' })
    await handler(req, res)
    const data = JSON.parse(res._getData())
    expect(data.expiredCount).toBe(0)
  })

  it('should accept POST method', async () => {
    ;(prisma.ad.findMany as jest.Mock).mockResolvedValue([])
    ;(prisma.ad.updateMany as jest.Mock).mockResolvedValue({ count: 0 })
    const { req, res } = createMocks({ method: 'POST' })
    await handler(req, res)
    expect(res._getStatusCode()).toBe(200)
  })

  it('should return 405 for PUT method', async () => {
    const { req, res } = createMocks({ method: 'PUT' })
    await handler(req, res)
    expect(res._getStatusCode()).toBe(405)
  })

  it('should handle database errors', async () => {
    ;(prisma.ad.findMany as jest.Mock).mockRejectedValue(new Error('DB error'))
    const { req, res } = createMocks({ method: 'GET' })
    await handler(req, res)
    expect(res._getStatusCode()).toBe(500)
  })
})
