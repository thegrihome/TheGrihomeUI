import { createMocks } from 'node-mocks-http'
import handler from '@/pages/api/ads/purchase'
import { prisma } from '@/lib/cockroachDB/prisma'
import { getServerSession } from 'next-auth/next'

jest.mock('@/lib/cockroachDB/prisma', () => ({
  prisma: {
    user: { findUnique: jest.fn() },
    adSlotConfig: { findUnique: jest.fn() },
    ad: { findFirst: jest.fn(), update: jest.fn(), create: jest.fn() },
    property: { findFirst: jest.fn() },
    project: { findFirst: jest.fn() },
  },
}))

jest.mock('next-auth/next', () => ({ getServerSession: jest.fn() }))

describe('/api/ads/purchase', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return 401 when not authenticated', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue(null)
    const { req, res } = createMocks({
      method: 'POST',
      body: { slotNumber: 1, totalDays: 7, propertyId: 'p1' },
    })
    await handler(req, res)
    expect(res._getStatusCode()).toBe(401)
  })

  it('should return 400 when missing required fields', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue({ user: { email: 'user@test.com' } })
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'u1' })
    const { req, res } = createMocks({ method: 'POST', body: {} })
    await handler(req, res)
    expect(res._getStatusCode()).toBe(400)
  })

  it('should return 404 when slot not found', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue({ user: { email: 'user@test.com' } })
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'u1' })
    ;(prisma.adSlotConfig.findUnique as jest.Mock).mockResolvedValue(null)
    const { req, res } = createMocks({
      method: 'POST',
      body: { slotNumber: 1, totalDays: 7, propertyId: 'p1' },
    })
    await handler(req, res)
    expect(res._getStatusCode()).toBe(404)
  })

  it('should return 400 when slot is occupied', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue({ user: { email: 'user@test.com' } })
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'u1' })
    ;(prisma.adSlotConfig.findUnique as jest.Mock).mockResolvedValue({
      slotNumber: 1,
      basePrice: 1500,
      isActive: true,
    })
    ;(prisma.ad.findFirst as jest.Mock).mockResolvedValue({ id: 'ad1' })
    const { req, res } = createMocks({
      method: 'POST',
      body: { slotNumber: 1, totalDays: 7, propertyId: 'p1' },
    })
    await handler(req, res)
    expect(res._getStatusCode()).toBe(400)
  })

  it('should create ad successfully', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue({ user: { email: 'user@test.com' } })
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'u1' })
    ;(prisma.adSlotConfig.findUnique as jest.Mock).mockResolvedValue({
      slotNumber: 1,
      basePrice: 1500,
      isActive: true,
    })
    ;(prisma.ad.findFirst as jest.Mock).mockResolvedValue(null)
    ;(prisma.property.findFirst as jest.Mock).mockResolvedValue({
      id: 'p1',
      userId: 'u1',
      listingStatus: 'ACTIVE',
    })
    ;(prisma.ad.create as jest.Mock).mockResolvedValue({ id: 'ad1', slotNumber: 1 })
    const { req, res } = createMocks({
      method: 'POST',
      body: { slotNumber: 1, totalDays: 7, propertyId: 'p1', totalAmount: 0 },
    })
    await handler(req, res)
    expect(res._getStatusCode()).toBe(201)
  })

  it('should return 405 for GET method', async () => {
    const { req, res } = createMocks({ method: 'GET' })
    await handler(req, res)
    expect(res._getStatusCode()).toBe(405)
  })
})
