import { createMocks } from 'node-mocks-http'
import handler from '@/pages/api/ads/init-slots'
import { prisma } from '@/lib/cockroachDB/prisma'

jest.mock('@/lib/cockroachDB/prisma', () => ({
  prisma: {
    adSlotConfig: { count: jest.fn(), createMany: jest.fn() },
  },
}))

describe('/api/ads/init-slots', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should create ad slots when none exist', async () => {
    ;(prisma.adSlotConfig.count as jest.Mock).mockResolvedValue(0)
    ;(prisma.adSlotConfig.createMany as jest.Mock).mockResolvedValue({})
    const { req, res } = createMocks({ method: 'POST' })
    await handler(req, res)
    expect(res._getStatusCode()).toBe(201)
    const data = JSON.parse(res._getData())
    expect(data.totalSlots).toBe(21)
  })

  it('should return 200 when slots already initialized', async () => {
    ;(prisma.adSlotConfig.count as jest.Mock).mockResolvedValue(21)
    const { req, res } = createMocks({ method: 'POST' })
    await handler(req, res)
    expect(res._getStatusCode()).toBe(200)
    const data = JSON.parse(res._getData())
    expect(data.message).toBe('Ad slots already initialized')
  })

  it('should return 405 for GET method', async () => {
    const { req, res } = createMocks({ method: 'GET' })
    await handler(req, res)
    expect(res._getStatusCode()).toBe(405)
  })
})
