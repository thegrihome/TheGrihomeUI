import { createMocks } from 'node-mocks-http'
import handler from '@/pages/api/upload-images'
import { getServerSession } from 'next-auth'
import { put } from '@vercel/blob'

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }))
jest.mock('@vercel/blob', () => ({ put: jest.fn() }))

describe('/api/upload-images', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return 401 when not authenticated', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue(null)
    const { req, res } = createMocks({ method: 'POST', body: { images: [] } })
    await handler(req, res)
    expect(res._getStatusCode()).toBe(401)
  })

  it('should return 400 when images array missing', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: 'u1' } })
    const { req, res } = createMocks({ method: 'POST', body: {} })
    await handler(req, res)
    expect(res._getStatusCode()).toBe(400)
  })

  it('should upload images successfully', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue({ user: { id: 'u1' } })
    ;(put as jest.Mock).mockResolvedValue({ url: 'https://example.com/image.jpg' })
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        images: [{ data: 'data:image/png;base64,abc123', name: 'test.png', type: 'image/png' }],
      },
    })
    await handler(req, res)
    expect(res._getStatusCode()).toBe(200)
    const data = JSON.parse(res._getData())
    expect(data.imageUrls).toHaveLength(1)
  })

  it('should return 405 for GET method', async () => {
    const { req, res } = createMocks({ method: 'GET' })
    await handler(req, res)
    expect(res._getStatusCode()).toBe(405)
  })
})
