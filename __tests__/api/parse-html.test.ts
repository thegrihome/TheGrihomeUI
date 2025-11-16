import { createMocks } from 'node-mocks-http'
import handler from '@/pages/api/parse-html'

global.fetch = jest.fn()

describe('/api/parse-html', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return 400 when missing required fields', async () => {
    const { req, res } = createMocks({ method: 'POST', body: {} })
    await handler(req, res)
    expect(res._getStatusCode()).toBe(400)
  })

  it('should parse with ChatGPT', async () => {
    ;(fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: '{"name":"Project"}' } }] }),
    })
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        htmlSource: '<html></html>',
        llmType: 'chatgpt',
        apiKey: 'key',
        templateStructure: {},
      },
    })
    await handler(req, res)
    expect(res._getStatusCode()).toBe(200)
  })

  it('should parse with Claude', async () => {
    ;(fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ content: [{ text: '{"name":"Project"}' }] }),
    })
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        htmlSource: '<html></html>',
        llmType: 'claude',
        apiKey: 'key',
        templateStructure: {},
      },
    })
    await handler(req, res)
    expect(res._getStatusCode()).toBe(200)
  })

  it('should parse with Perplexity', async () => {
    ;(fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: '{"name":"Project"}' } }] }),
    })
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        htmlSource: '<html></html>',
        llmType: 'perplexity',
        apiKey: 'key',
        templateStructure: {},
      },
    })
    await handler(req, res)
    expect(res._getStatusCode()).toBe(200)
  })

  it('should return 400 for invalid LLM type', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        htmlSource: '<html></html>',
        llmType: 'invalid',
        apiKey: 'key',
        templateStructure: {},
      },
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
