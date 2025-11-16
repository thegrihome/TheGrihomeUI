import { createMocks } from 'node-mocks-http'
import handler from '@/pages/api/update-builder-description'
import { prisma } from '@/lib/cockroachDB/prisma'

jest.mock('@/lib/cockroachDB/prisma', () => ({
  prisma: {
    builder: { update: jest.fn() },
  },
}))

describe('/api/update-builder-description', () => {
  beforeEach(() => { jest.clearAllMocks() })

  it('should update builder description', async () => {
    ;(prisma.builder.update as jest.Mock).mockResolvedValue({ id: 'b1', description: 'Updated' })
    const { req, res } = createMocks({ method: 'POST' })
    await handler(req, res)
    expect(res._getStatusCode()).toBe(200)
  })

  it('should handle database errors', async () => {
    ;(prisma.builder.update as jest.Mock).mockRejectedValue(new Error('DB error'))
    const { req, res } = createMocks({ method: 'POST' })
    await handler(req, res)
    expect(res._getStatusCode()).toBe(500)
  })

  it('should return 405 for GET method', async () => {
    const { req, res } = createMocks({ method: 'GET' })
    await handler(req, res)
    expect(res._getStatusCode()).toBe(405)
  })
})
