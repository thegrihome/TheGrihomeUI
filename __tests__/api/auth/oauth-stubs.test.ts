import { createMocks } from 'node-mocks-http'
import chatgptGoogleHandler from '@/pages/api/auth/chatgpt-google'
import chatgptMicrosoftHandler from '@/pages/api/auth/chatgpt-microsoft'
import claudeGoogleHandler from '@/pages/api/auth/claude-google'
import claudeGithubHandler from '@/pages/api/auth/claude-github'
import perplexityGoogleHandler from '@/pages/api/auth/perplexity-google'

describe('OAuth Stub Endpoints', () => {
  const handlers = [
    {
      name: 'ChatGPT Google',
      handler: chatgptGoogleHandler,
      tokenKey: 'chatgpt_oauth_token',
      prefix: 'chatgpt_google',
    },
    {
      name: 'ChatGPT Microsoft',
      handler: chatgptMicrosoftHandler,
      tokenKey: 'chatgpt_oauth_token',
      prefix: 'chatgpt_microsoft',
    },
    {
      name: 'Claude Google',
      handler: claudeGoogleHandler,
      tokenKey: 'claude_oauth_token',
      prefix: 'claude_google',
    },
    {
      name: 'Claude GitHub',
      handler: claudeGithubHandler,
      tokenKey: 'claude_oauth_token',
      prefix: 'claude_github',
    },
    {
      name: 'Perplexity Google',
      handler: perplexityGoogleHandler,
      tokenKey: 'perplexity_oauth_token',
      prefix: 'perplexity_google',
    },
  ]

  handlers.forEach(({ name, handler, tokenKey, prefix }) => {
    describe(`${name} OAuth`, () => {
      describe('GET Request', () => {
        it('returns 200 status', () => {
          const { req, res } = createMocks({
            method: 'GET',
          })

          handler(req, res)

          expect(res._getStatusCode()).toBe(200)
        })

        it('returns HTML content', () => {
          const { req, res } = createMocks({
            method: 'GET',
          })

          handler(req, res)

          const data = res._getData()
          expect(data).toContain('<!DOCTYPE html>')
          expect(data).toContain('<html>')
        })

        it('sets Content-Type header to text/html', () => {
          const { req, res } = createMocks({
            method: 'GET',
          })

          handler(req, res)

          expect(res._getHeaders()['content-type']).toBe('text/html')
        })

        it('includes success message', () => {
          const { req, res } = createMocks({
            method: 'GET',
          })

          handler(req, res)

          const data = res._getData()
          expect(data).toContain('Successfully connected')
        })

        it('includes loading indicator', () => {
          const { req, res } = createMocks({
            method: 'GET',
          })

          handler(req, res)

          const data = res._getData()
          expect(data).toContain('class="loading"')
        })

        it('includes CSS styling', () => {
          const { req, res } = createMocks({
            method: 'GET',
          })

          handler(req, res)

          const data = res._getData()
          expect(data).toContain('<style>')
          expect(data).toContain('body {')
          expect(data).toContain('background:')
        })

        it('includes JavaScript to close window', () => {
          const { req, res } = createMocks({
            method: 'GET',
          })

          handler(req, res)

          const data = res._getData()
          expect(data).toContain('<script>')
          expect(data).toContain('window.close()')
        })

        it('includes localStorage token storage', () => {
          const { req, res } = createMocks({
            method: 'GET',
          })

          handler(req, res)

          const data = res._getData()
          expect(data).toContain(`localStorage.setItem('${tokenKey}'`)
        })

        it('generates token with correct prefix', () => {
          const { req, res } = createMocks({
            method: 'GET',
          })

          handler(req, res)

          const data = res._getData()
          expect(data).toContain(prefix)
        })

        it('includes setTimeout for auto-close', () => {
          const { req, res } = createMocks({
            method: 'GET',
          })

          handler(req, res)

          const data = res._getData()
          expect(data).toContain('setTimeout')
          expect(data).toContain('2000')
        })

        it('has gradient background styling', () => {
          const { req, res } = createMocks({
            method: 'GET',
          })

          handler(req, res)

          const data = res._getData()
          expect(data).toContain('linear-gradient')
        })

        it('includes animation keyframes', () => {
          const { req, res } = createMocks({
            method: 'GET',
          })

          handler(req, res)

          const data = res._getData()
          expect(data).toContain('@keyframes spin')
          expect(data).toContain('transform: rotate(360deg)')
        })

        it('includes container div', () => {
          const { req, res } = createMocks({
            method: 'GET',
          })

          handler(req, res)

          const data = res._getData()
          expect(data).toContain('class="container"')
        })

        it('includes checkmark element', () => {
          const { req, res } = createMocks({
            method: 'GET',
          })

          handler(req, res)

          const data = res._getData()
          expect(data).toContain('class="checkmark"')
        })

        it('has valid HTML structure', () => {
          const { req, res } = createMocks({
            method: 'GET',
          })

          handler(req, res)

          const data = res._getData()
          expect(data).toContain('<head>')
          expect(data).toContain('</head>')
          expect(data).toContain('<body>')
          expect(data).toContain('</body>')
          expect(data).toContain('</html>')
        })

        it('includes page title', () => {
          const { req, res } = createMocks({
            method: 'GET',
          })

          handler(req, res)

          const data = res._getData()
          expect(data).toContain('<title>')
          expect(data).toContain('</title>')
        })

        it('uses flexbox for centering', () => {
          const { req, res } = createMocks({
            method: 'GET',
          })

          handler(req, res)

          const data = res._getData()
          expect(data).toContain('display: flex')
          expect(data).toContain('justify-content: center')
          expect(data).toContain('align-items: center')
        })

        it('has backdrop filter effect', () => {
          const { req, res } = createMocks({
            method: 'GET',
          })

          handler(req, res)

          const data = res._getData()
          expect(data).toContain('backdrop-filter: blur')
        })

        it('includes font family specification', () => {
          const { req, res } = createMocks({
            method: 'GET',
          })

          handler(req, res)

          const data = res._getData()
          expect(data).toContain('font-family:')
          expect(data).toContain('-apple-system')
        })
      })

      describe('POST Request', () => {
        it('returns 405 Method Not Allowed', () => {
          const { req, res } = createMocks({
            method: 'POST',
          })

          handler(req, res)

          expect(res._getStatusCode()).toBe(405)
        })

        it('returns JSON error message', () => {
          const { req, res } = createMocks({
            method: 'POST',
          })

          handler(req, res)

          const data = JSON.parse(res._getData())
          expect(data).toEqual({ message: 'Method not allowed' })
        })
      })

      describe('PUT Request', () => {
        it('returns 405 Method Not Allowed', () => {
          const { req, res } = createMocks({
            method: 'PUT',
          })

          handler(req, res)

          expect(res._getStatusCode()).toBe(405)
        })

        it('returns JSON error message', () => {
          const { req, res } = createMocks({
            method: 'PUT',
          })

          handler(req, res)

          const data = JSON.parse(res._getData())
          expect(data.message).toBe('Method not allowed')
        })
      })

      describe('DELETE Request', () => {
        it('returns 405 Method Not Allowed', () => {
          const { req, res } = createMocks({
            method: 'DELETE',
          })

          handler(req, res)

          expect(res._getStatusCode()).toBe(405)
        })
      })

      describe('PATCH Request', () => {
        it('returns 405 Method Not Allowed', () => {
          const { req, res } = createMocks({
            method: 'PATCH',
          })

          handler(req, res)

          expect(res._getStatusCode()).toBe(405)
        })
      })

      describe('Token Generation', () => {
        it('generates unique tokens on each request', () => {
          const { req: req1, res: res1 } = createMocks({
            method: 'GET',
          })
          const { req: req2, res: res2 } = createMocks({
            method: 'GET',
          })

          handler(req1, res1)
          handler(req2, res2)

          const data1 = res1._getData()
          const data2 = res2._getData()

          // Extract tokens from HTML
          const tokenMatch1 = data1.match(new RegExp(`${prefix}_\\d+_\\w+`))
          const tokenMatch2 = data2.match(new RegExp(`${prefix}_\\d+_\\w+`))

          expect(tokenMatch1).toBeTruthy()
          expect(tokenMatch2).toBeTruthy()
          // Tokens should be different (very high probability)
          expect(tokenMatch1?.[0]).not.toBe(tokenMatch2?.[0])
        })

        it('token includes timestamp', () => {
          const { req, res } = createMocks({
            method: 'GET',
          })

          const beforeTime = Date.now()
          handler(req, res)
          const afterTime = Date.now()

          const data = res._getData()
          const tokenMatch = data.match(new RegExp(`${prefix}_(\\d+)_\\w+`))
          expect(tokenMatch).toBeTruthy()

          if (tokenMatch) {
            const timestamp = parseInt(tokenMatch[1], 10)
            expect(timestamp).toBeGreaterThanOrEqual(beforeTime - 100)
            expect(timestamp).toBeLessThanOrEqual(afterTime + 100)
          }
        })

        it('token includes random component', () => {
          const { req, res } = createMocks({
            method: 'GET',
          })

          handler(req, res)

          const data = res._getData()
          const tokenMatch = data.match(new RegExp(`${prefix}_\\d+_(\\w+)`))
          expect(tokenMatch).toBeTruthy()

          if (tokenMatch) {
            const randomPart = tokenMatch[1]
            expect(randomPart).toBeTruthy()
            expect(randomPart.length).toBeGreaterThan(0)
          }
        })
      })

      describe('Response Formatting', () => {
        it('has proper HTML indentation', () => {
          const { req, res } = createMocks({
            method: 'GET',
          })

          handler(req, res)

          const data = res._getData()
          expect(data).toContain('  ')
        })

        it('includes DOCTYPE declaration', () => {
          const { req, res } = createMocks({
            method: 'GET',
          })

          handler(req, res)

          const data = res._getData()
          expect(data.trim()).toMatch(/^<!DOCTYPE html>/)
        })

        it('has closing tags for all elements', () => {
          const { req, res } = createMocks({
            method: 'GET',
          })

          handler(req, res)

          const data = res._getData()
          const openTags = (data.match(/<(html|head|body|div|style|script|h2|p)(?:\s|>)/g) || [])
            .length
          const closeTags = (data.match(/<\/(html|head|body|div|style|script|h2|p)>/g) || []).length
          expect(closeTags).toBeGreaterThan(0)
          expect(closeTags).toBe(openTags)
        })
      })

      describe('Edge Cases', () => {
        it('handles undefined method gracefully', () => {
          const { req, res } = createMocks({})

          expect(() => handler(req, res)).not.toThrow()
        })

        it('handles null query parameters', () => {
          const { req, res } = createMocks({
            method: 'GET',
            query: null,
          })

          expect(() => handler(req, res)).not.toThrow()
        })

        it('handles empty headers', () => {
          const { req, res } = createMocks({
            method: 'GET',
            headers: {},
          })

          handler(req, res)

          expect(res._getStatusCode()).toBe(200)
        })
      })
    })
  })

  describe('Endpoint Differences', () => {
    it('ChatGPT Google has different styling than Claude Google', () => {
      const { req: req1, res: res1 } = createMocks({ method: 'GET' })
      const { req: req2, res: res2 } = createMocks({ method: 'GET' })

      chatgptGoogleHandler(req1, res1)
      claudeGoogleHandler(req2, res2)

      const data1 = res1._getData()
      const data2 = res2._getData()

      // Check for different gradient colors
      const gradient1 = data1.match(/linear-gradient\([^)]+\)/)
      const gradient2 = data2.match(/linear-gradient\([^)]+\)/)

      expect(gradient1).toBeTruthy()
      expect(gradient2).toBeTruthy()
      expect(gradient1?.[0]).not.toBe(gradient2?.[0])
    })

    it('each endpoint has unique title', () => {
      const endpoints = [
        { handler: chatgptGoogleHandler, name: 'ChatGPT' },
        { handler: claudeGoogleHandler, name: 'Claude' },
        { handler: perplexityGoogleHandler, name: 'Perplexity' },
      ]

      const titles = endpoints.map(({ handler }) => {
        const { req, res } = createMocks({ method: 'GET' })
        handler(req, res)
        const data = res._getData()
        const titleMatch = data.match(/<title>([^<]+)<\/title>/)
        return titleMatch ? titleMatch[1] : ''
      })

      // All titles should be different
      const uniqueTitles = new Set(titles)
      expect(uniqueTitles.size).toBe(endpoints.length)
    })

    it('each endpoint stores token with correct key', () => {
      const tests = [
        { handler: chatgptGoogleHandler, key: 'chatgpt_oauth_token' },
        { handler: chatgptMicrosoftHandler, key: 'chatgpt_oauth_token' },
        { handler: claudeGoogleHandler, key: 'claude_oauth_token' },
        { handler: claudeGithubHandler, key: 'claude_oauth_token' },
        { handler: perplexityGoogleHandler, key: 'perplexity_oauth_token' },
      ]

      tests.forEach(({ handler, key }) => {
        const { req, res } = createMocks({ method: 'GET' })
        handler(req, res)
        const data = res._getData()
        expect(data).toContain(`localStorage.setItem('${key}'`)
      })
    })
  })
})
