import { createMocks } from 'node-mocks-http'
import handler from '@/pages/api/hello'

describe('/api/hello', () => {
  describe('GET Request', () => {
    it('returns 200 status', () => {
      const { req, res } = createMocks({
        method: 'GET',
      })

      handler(req, res)

      expect(res._getStatusCode()).toBe(200)
    })

    it('returns JSON response', () => {
      const { req, res } = createMocks({
        method: 'GET',
      })

      handler(req, res)

      const data = JSON.parse(res._getData())
      expect(data).toEqual({ name: 'Plutonium' })
    })

    it('returns correct name', () => {
      const { req, res } = createMocks({
        method: 'GET',
      })

      handler(req, res)

      const data = JSON.parse(res._getData())
      expect(data.name).toBe('Plutonium')
    })

    it('sets correct content-type header', () => {
      const { req, res } = createMocks({
        method: 'GET',
      })

      handler(req, res)

      expect(res._getHeaders()['content-type']).toContain('application/json')
    })
  })

  describe('POST Request', () => {
    it('returns 200 status for POST', () => {
      const { req, res } = createMocks({
        method: 'POST',
      })

      handler(req, res)

      expect(res._getStatusCode()).toBe(200)
    })

    it('returns same data for POST', () => {
      const { req, res } = createMocks({
        method: 'POST',
      })

      handler(req, res)

      const data = JSON.parse(res._getData())
      expect(data).toEqual({ name: 'Plutonium' })
    })
  })

  describe('Other HTTP Methods', () => {
    it('handles PUT request', () => {
      const { req, res } = createMocks({
        method: 'PUT',
      })

      handler(req, res)

      expect(res._getStatusCode()).toBe(200)
    })

    it('handles DELETE request', () => {
      const { req, res } = createMocks({
        method: 'DELETE',
      })

      handler(req, res)

      expect(res._getStatusCode()).toBe(200)
    })

    it('handles PATCH request', () => {
      const { req, res } = createMocks({
        method: 'PATCH',
      })

      handler(req, res)

      expect(res._getStatusCode()).toBe(200)
    })
  })

  describe('Response Data Structure', () => {
    it('response has name property', () => {
      const { req, res } = createMocks({
        method: 'GET',
      })

      handler(req, res)

      const data = JSON.parse(res._getData())
      expect(data).toHaveProperty('name')
    })

    it('name property is a string', () => {
      const { req, res } = createMocks({
        method: 'GET',
      })

      handler(req, res)

      const data = JSON.parse(res._getData())
      expect(typeof data.name).toBe('string')
    })

    it('response object has exactly one property', () => {
      const { req, res } = createMocks({
        method: 'GET',
      })

      handler(req, res)

      const data = JSON.parse(res._getData())
      expect(Object.keys(data)).toHaveLength(1)
    })
  })

  describe('Edge Cases', () => {
    it('handles undefined method', () => {
      const { req, res } = createMocks({})

      handler(req, res)

      const data = JSON.parse(res._getData())
      expect(data).toEqual({ name: 'Plutonium' })
    })

    it('returns valid JSON', () => {
      const { req, res } = createMocks({
        method: 'GET',
      })

      handler(req, res)

      const responseText = res._getData()
      expect(() => JSON.parse(responseText)).not.toThrow()
    })

    it('does not accept request body', () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: { test: 'data' },
      })

      handler(req, res)

      const data = JSON.parse(res._getData())
      expect(data).toEqual({ name: 'Plutonium' })
    })
  })

  describe('Type Safety', () => {
    it('matches Data type definition', () => {
      const { req, res } = createMocks({
        method: 'GET',
      })

      handler(req, res)

      const data: { name: string } = JSON.parse(res._getData())
      expect(data.name).toBeDefined()
    })
  })
})
