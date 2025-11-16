import { createMocks } from 'node-mocks-http'

const mockSend = jest.fn()

jest.mock('resend', () => {
  const mockSend = jest.fn()
  return {
    Resend: jest.fn().mockImplementation(() => ({
      emails: { send: mockSend },
    })),
    mockSend, // Export for test access
  }
})

// Import handler after mock is set up
import handler from '@/pages/api/contact'
import { mockSend as importedMockSend } from 'resend'

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
    ;(importedMockSend as jest.Mock).mockResolvedValue({ data: { id: 'email-id' } })
    const { req, res } = createMocks({
      method: 'POST',
      body: { name: 'John', email: 'john@test.com', phone: '1234567890', message: 'Test message' },
    })
    await handler(req, res)
    expect(res._getStatusCode()).toBe(200)
  })

  it('should handle email sending errors', async () => {
    ;(importedMockSend as jest.Mock).mockRejectedValue(new Error('Email failed'))
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
