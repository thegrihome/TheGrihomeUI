import { createMocks } from 'node-mocks-http'
import handler from '@/pages/api/ads/slots'
import { prisma } from '@/lib/cockroachDB/prisma'
import { getSession } from 'next-auth/react'

jest.mock('@/lib/cockroachDB/prisma', () => ({
  prisma: {
    ad: { updateMany: jest.fn() },
    adSlotConfig: { findMany: jest.fn() },
    user: { findUnique: jest.fn() },
  },
}))

jest.mock('next-auth/react', () => ({ getSession: jest.fn() }))

describe('/api/ads/slots', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return ad slots', async () => {
    ;(getSession as jest.Mock).mockResolvedValue(null)
    ;(prisma.ad.updateMany as jest.Mock).mockResolvedValue({})
    ;(prisma.adSlotConfig.findMany as jest.Mock).mockResolvedValue([
      { slotNumber: 1, basePrice: 1500, isActive: true, ads: [] },
    ])
    const { req, res } = createMocks({ method: 'GET' })
    await handler(req, res)
    expect(res._getStatusCode()).toBe(200)
    const data = JSON.parse(res._getData())
    expect(data.adSlots).toBeDefined()
  })

  it('should clean up expired ads', async () => {
    ;(getSession as jest.Mock).mockResolvedValue(null)
    ;(prisma.ad.updateMany as jest.Mock).mockResolvedValue({})
    ;(prisma.adSlotConfig.findMany as jest.Mock).mockResolvedValue([])
    const { req, res } = createMocks({ method: 'GET' })
    await handler(req, res)
    expect(prisma.ad.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: 'ACTIVE', endDate: { lt: expect.any(Date) } },
        data: { status: 'EXPIRED' },
      })
    )
  })

  it('should mark ads expiring soon', async () => {
    ;(getSession as jest.Mock).mockResolvedValue({ user: { email: 'user@test.com' } })
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'u1' })
    ;(prisma.ad.updateMany as jest.Mock).mockResolvedValue({})
    const futureDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
    ;(prisma.adSlotConfig.findMany as jest.Mock).mockResolvedValue([
      {
        slotNumber: 1,
        basePrice: 1500,
        isActive: true,
        ads: [{ id: 'ad1', endDate: futureDate, userId: 'u1' }],
      },
    ])
    const { req, res } = createMocks({ method: 'GET' })
    await handler(req, res)
    const data = JSON.parse(res._getData())
    expect(data.adSlots[0].isExpiringSoon).toBe(true)
  })

  it('should return 405 for POST method', async () => {
    const { req, res } = createMocks({ method: 'POST' })
    await handler(req, res)
    expect(res._getStatusCode()).toBe(405)
  })
})
