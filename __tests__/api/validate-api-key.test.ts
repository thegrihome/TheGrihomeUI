import { createMocks } from 'node-mocks-http'
import handler from '@/pages/api/validate-api-key'

global.fetch = jest.fn()

describe('/api/validate-api-key', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return 400 when missing required fields', async () => {
    const { req, res } = createMocks({ method: 'POST', body: {} })
    await handler(req, res)
    expect(res._getStatusCode()).toBe(400)
  })

  it('should validate OpenAI key', async () => {
    ;(fetch as jest.Mock).mockResolvedValue({ ok: true })
    const { req, res } = createMocks({
      method: 'POST',
      body: { llmType: 'chatgpt', apiKey: 'valid-key' },
    })
    await handler(req, res)
    expect(res._getStatusCode()).toBe(200)
    const data = JSON.parse(res._getData())
    expect(data.valid).toBe(true)
  })

  it('should reject invalid OpenAI key', async () => {
    ;(fetch as jest.Mock).mockResolvedValue({ ok: false, status: 401 })
    const { req, res } = createMocks({
      method: 'POST',
      body: { llmType: 'chatgpt', apiKey: 'invalid-key' },
    })
    await handler(req, res)
    expect(res._getStatusCode()).toBe(401)
  })

  it('should validate Anthropic key', async () => {
    ;(fetch as jest.Mock).mockResolvedValue({ ok: true, status: 200 })
    const { req, res } = createMocks({
      method: 'POST',
      body: { llmType: 'claude', apiKey: 'valid-key' },
    })
    await handler(req, res)
    expect(res._getStatusCode()).toBe(200)
  })

  it('should validate Perplexity key', async () => {
    ;(fetch as jest.Mock).mockResolvedValue({ ok: true, status: 200 })
    const { req, res } = createMocks({
      method: 'POST',
      body: { llmType: 'perplexity', apiKey: 'valid-key' },
    })
    await handler(req, res)
    expect(res._getStatusCode()).toBe(200)
  })

  it('should return 400 for invalid LLM type', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: { llmType: 'invalid', apiKey: 'key' },
    })
    await handler(req, res)
    expect(res._getStatusCode()).toBe(400)
  })

  it('should return 405 for GET method', async () => {
    const { req, res } = createMocks({ method: 'GET' })
    await handler(req, res)
    expect(res._getStatusCode()).toBe(405)
  })
})
