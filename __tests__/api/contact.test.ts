import { createMocks } from 'node-mocks-http'
import handler from '@/pages/api/contact'
import { Resend } from 'resend'

jest.mock('resend')

describe('/api/contact', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return 400 when missing required fields', async () => {
    const { req, res } = createMocks({ method: 'POST', body: {} })
    await handler(req, res)
    expect(res._getStatusCode()).toBe(400)
  })

  it('should send contact email successfully', async () => {
    const mockSend = jest.fn().mockResolvedValue({ data: { id: 'email-id' } })
    ;(Resend as jest.Mock).mockImplementation(() => ({ emails: { send: mockSend } }))
    const { req, res } = createMocks({
      method: 'POST',
      body: { name: 'John', email: 'john@test.com', phone: '1234567890', message: 'Test message' },
    })
    await handler(req, res)
    expect(res._getStatusCode()).toBe(200)
  })

  it('should handle email sending errors', async () => {
    const mockSend = jest.fn().mockRejectedValue(new Error('Email failed'))
    ;(Resend as jest.Mock).mockImplementation(() => ({ emails: { send: mockSend } }))
    const { req, res } = createMocks({
      method: 'POST',
      body: { name: 'John', email: 'john@test.com', message: 'Test message' },
    })
    await handler(req, res)
    expect(res._getStatusCode()).toBe(500)
  })

  it('should return 405 for GET method', async () => {
    const { req, res } = createMocks({ method: 'GET' })
    await handler(req, res)
    expect(res._getStatusCode()).toBe(405)
  })
})
