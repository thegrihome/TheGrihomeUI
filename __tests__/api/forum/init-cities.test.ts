import { createMocks } from 'node-mocks-http'
import handler from '@/pages/api/forum/init-cities'
import { prisma } from '@/lib/cockroachDB/prisma'

jest.mock('@/lib/cockroachDB/prisma', () => ({
  prisma: {
    forumCategory: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
    },
  },
}))

describe('/api/forum/init-cities', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/forum/init-cities', () => {
    it('should create General Discussions category if not exists', async () => {
      ;(prisma.forumCategory.findUnique as jest.Mock).mockResolvedValue(null)
      ;(prisma.forumCategory.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.forumCategory.create as jest.Mock).mockResolvedValue({
        id: 'gen-disc-id',
        slug: 'general-discussions',
        name: 'General Discussions',
      })

      const { req, res } = createMocks({
        method: 'POST',
      })

      await handler(req, res)

      expect(prisma.forumCategory.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'General Discussions',
            slug: 'general-discussions',
          }),
        })
      )
    })

    it('should use existing General Discussions category', async () => {
      const mockGeneralDiscussions = {
        id: 'existing-id',
        slug: 'general-discussions',
        name: 'General Discussions',
      }

      ;(prisma.forumCategory.findUnique as jest.Mock).mockResolvedValue(mockGeneralDiscussions)
      ;(prisma.forumCategory.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.forumCategory.create as jest.Mock).mockResolvedValue({
        id: 'city-id',
        parentId: 'existing-id',
      })

      const { req, res } = createMocks({
        method: 'POST',
      })

      await handler(req, res)

      const createCalls = (prisma.forumCategory.create as jest.Mock).mock.calls
      const cityCalls = createCalls.filter(call => call[0].data.parentId === 'existing-id')
      expect(cityCalls.length).toBeGreaterThan(0)
    })

    it('should create new cities with property types', async () => {
      ;(prisma.forumCategory.findUnique as jest.Mock).mockResolvedValue({
        id: 'gen-disc-id',
      })
      ;(prisma.forumCategory.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.forumCategory.create as jest.Mock).mockResolvedValue({
        id: 'created-id',
      })

      const { req, res } = createMocks({
        method: 'POST',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const data = JSON.parse(res._getData())
      expect(data.citiesAdded).toBeGreaterThan(0)
      expect(data.cities).toBeDefined()
    })

    it('should skip existing cities', async () => {
      ;(prisma.forumCategory.findUnique as jest.Mock).mockResolvedValue({
        id: 'gen-disc-id',
      })
      ;(prisma.forumCategory.findMany as jest.Mock).mockResolvedValue([
        { city: 'gurgaon' },
        { city: 'noida' },
        { city: 'pune' },
        { city: 'other-cities' },
      ])

      const { req, res } = createMocks({
        method: 'POST',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const data = JSON.parse(res._getData())
      expect(data.message).toBe('All cities already exist')
      expect(data.citiesAdded).toBe(0)
    })

    it('should create property type subcategories for each city', async () => {
      ;(prisma.forumCategory.findUnique as jest.Mock).mockResolvedValue({
        id: 'gen-disc-id',
      })
      ;(prisma.forumCategory.findMany as jest.Mock).mockResolvedValue([])

      const cityId = 'city-id'
      ;(prisma.forumCategory.create as jest.Mock).mockImplementation(args => {
        if (args.data.parentId === 'gen-disc-id') {
          return Promise.resolve({ id: cityId, ...args.data })
        }
        return Promise.resolve({ id: `prop-${Date.now()}`, ...args.data })
      })

      const { req, res } = createMocks({
        method: 'POST',
      })

      await handler(req, res)

      const createCalls = (prisma.forumCategory.create as jest.Mock).mock.calls
      const propertyTypeCalls = createCalls.filter(call => call[0].data.propertyType !== undefined)
      expect(propertyTypeCalls.length).toBeGreaterThan(0)
    })

    it('should create Villas property type', async () => {
      ;(prisma.forumCategory.findUnique as jest.Mock).mockResolvedValue({
        id: 'gen-disc-id',
      })
      ;(prisma.forumCategory.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.forumCategory.create as jest.Mock).mockResolvedValue({
        id: 'created-id',
      })

      const { req, res } = createMocks({
        method: 'POST',
      })

      await handler(req, res)

      const createCalls = (prisma.forumCategory.create as jest.Mock).mock.calls
      const villasCall = createCalls.find(call => call[0].data.propertyType === 'VILLAS')
      expect(villasCall).toBeDefined()
    })

    it('should create Apartments property type', async () => {
      ;(prisma.forumCategory.findUnique as jest.Mock).mockResolvedValue({
        id: 'gen-disc-id',
      })
      ;(prisma.forumCategory.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.forumCategory.create as jest.Mock).mockResolvedValue({
        id: 'created-id',
      })

      const { req, res } = createMocks({
        method: 'POST',
      })

      await handler(req, res)

      const createCalls = (prisma.forumCategory.create as jest.Mock).mock.calls
      const apartmentsCall = createCalls.find(call => call[0].data.propertyType === 'APARTMENTS')
      expect(apartmentsCall).toBeDefined()
    })

    it('should create Residential Lands property type', async () => {
      ;(prisma.forumCategory.findUnique as jest.Mock).mockResolvedValue({
        id: 'gen-disc-id',
      })
      ;(prisma.forumCategory.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.forumCategory.create as jest.Mock).mockResolvedValue({
        id: 'created-id',
      })

      const { req, res } = createMocks({
        method: 'POST',
      })

      await handler(req, res)

      const createCalls = (prisma.forumCategory.create as jest.Mock).mock.calls
      const residentialLandsCall = createCalls.find(
        call => call[0].data.propertyType === 'RESIDENTIAL_LANDS'
      )
      expect(residentialLandsCall).toBeDefined()
    })

    it('should create Agriculture Lands property type', async () => {
      ;(prisma.forumCategory.findUnique as jest.Mock).mockResolvedValue({
        id: 'gen-disc-id',
      })
      ;(prisma.forumCategory.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.forumCategory.create as jest.Mock).mockResolvedValue({
        id: 'created-id',
      })

      const { req, res } = createMocks({
        method: 'POST',
      })

      await handler(req, res)

      const createCalls = (prisma.forumCategory.create as jest.Mock).mock.calls
      const agricultureLandsCall = createCalls.find(
        call => call[0].data.propertyType === 'AGRICULTURE_LANDS'
      )
      expect(agricultureLandsCall).toBeDefined()
    })

    it('should create Commercial Properties property type', async () => {
      ;(prisma.forumCategory.findUnique as jest.Mock).mockResolvedValue({
        id: 'gen-disc-id',
      })
      ;(prisma.forumCategory.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.forumCategory.create as jest.Mock).mockResolvedValue({
        id: 'created-id',
      })

      const { req, res } = createMocks({
        method: 'POST',
      })

      await handler(req, res)

      const createCalls = (prisma.forumCategory.create as jest.Mock).mock.calls
      const commercialCall = createCalls.find(
        call => call[0].data.propertyType === 'COMMERCIAL_PROPERTIES'
      )
      expect(commercialCall).toBeDefined()
    })

    it('should create Gurgaon city category', async () => {
      ;(prisma.forumCategory.findUnique as jest.Mock).mockResolvedValue({
        id: 'gen-disc-id',
      })
      ;(prisma.forumCategory.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.forumCategory.create as jest.Mock).mockResolvedValue({
        id: 'created-id',
      })

      const { req, res } = createMocks({
        method: 'POST',
      })

      await handler(req, res)

      const createCalls = (prisma.forumCategory.create as jest.Mock).mock.calls
      const gurgaonCall = createCalls.find(
        call => call[0].data.city === 'gurgaon' && call[0].data.parentId === 'gen-disc-id'
      )
      expect(gurgaonCall).toBeDefined()
    })

    it('should create Noida city category', async () => {
      ;(prisma.forumCategory.findUnique as jest.Mock).mockResolvedValue({
        id: 'gen-disc-id',
      })
      ;(prisma.forumCategory.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.forumCategory.create as jest.Mock).mockResolvedValue({
        id: 'created-id',
      })

      const { req, res } = createMocks({
        method: 'POST',
      })

      await handler(req, res)

      const createCalls = (prisma.forumCategory.create as jest.Mock).mock.calls
      const noidaCall = createCalls.find(
        call => call[0].data.city === 'noida' && call[0].data.parentId === 'gen-disc-id'
      )
      expect(noidaCall).toBeDefined()
    })

    it('should create Pune city category', async () => {
      ;(prisma.forumCategory.findUnique as jest.Mock).mockResolvedValue({
        id: 'gen-disc-id',
      })
      ;(prisma.forumCategory.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.forumCategory.create as jest.Mock).mockResolvedValue({
        id: 'created-id',
      })

      const { req, res } = createMocks({
        method: 'POST',
      })

      await handler(req, res)

      const createCalls = (prisma.forumCategory.create as jest.Mock).mock.calls
      const puneCall = createCalls.find(
        call => call[0].data.city === 'pune' && call[0].data.parentId === 'gen-disc-id'
      )
      expect(puneCall).toBeDefined()
    })

    it('should create Other Cities category', async () => {
      ;(prisma.forumCategory.findUnique as jest.Mock).mockResolvedValue({
        id: 'gen-disc-id',
      })
      ;(prisma.forumCategory.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.forumCategory.create as jest.Mock).mockResolvedValue({
        id: 'created-id',
      })

      const { req, res } = createMocks({
        method: 'POST',
      })

      await handler(req, res)

      const createCalls = (prisma.forumCategory.create as jest.Mock).mock.calls
      const otherCitiesCall = createCalls.find(
        call => call[0].data.city === 'other-cities' && call[0].data.parentId === 'gen-disc-id'
      )
      expect(otherCitiesCall).toBeDefined()
    })

    it('should return 405 for GET method', async () => {
      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(405)
      expect(JSON.parse(res._getData())).toEqual({
        message: 'Method not allowed',
      })
    })

    it('should return 405 for PUT method', async () => {
      const { req, res } = createMocks({
        method: 'PUT',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(405)
    })

    it('should return 405 for DELETE method', async () => {
      const { req, res } = createMocks({
        method: 'DELETE',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(405)
    })

    it('should handle database errors', async () => {
      ;(prisma.forumCategory.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'))

      const { req, res } = createMocks({
        method: 'POST',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(500)
      expect(JSON.parse(res._getData()).message).toBe('Internal server error')
    })

    it('should set correct display orders for cities', async () => {
      ;(prisma.forumCategory.findUnique as jest.Mock).mockResolvedValue({
        id: 'gen-disc-id',
      })
      ;(prisma.forumCategory.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.forumCategory.create as jest.Mock).mockResolvedValue({
        id: 'created-id',
      })

      const { req, res } = createMocks({
        method: 'POST',
      })

      await handler(req, res)

      const createCalls = (prisma.forumCategory.create as jest.Mock).mock.calls
      const gurgaonCall = createCalls.find(call => call[0].data.city === 'gurgaon')
      expect(gurgaonCall[0].data.displayOrder).toBe(6)
    })

    it('should set correct display orders for property types', async () => {
      ;(prisma.forumCategory.findUnique as jest.Mock).mockResolvedValue({
        id: 'gen-disc-id',
      })
      ;(prisma.forumCategory.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.forumCategory.create as jest.Mock).mockResolvedValue({
        id: 'created-id',
      })

      const { req, res } = createMocks({
        method: 'POST',
      })

      await handler(req, res)

      const createCalls = (prisma.forumCategory.create as jest.Mock).mock.calls
      const villasCall = createCalls.find(call => call[0].data.propertyType === 'VILLAS')
      expect(villasCall[0].data.displayOrder).toBe(0)
    })

    it('should mark all categories as active', async () => {
      ;(prisma.forumCategory.findUnique as jest.Mock).mockResolvedValue({
        id: 'gen-disc-id',
      })
      ;(prisma.forumCategory.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.forumCategory.create as jest.Mock).mockResolvedValue({
        id: 'created-id',
      })

      const { req, res } = createMocks({
        method: 'POST',
      })

      await handler(req, res)

      const createCalls = (prisma.forumCategory.create as jest.Mock).mock.calls
      createCalls.forEach(call => {
        expect(call[0].data.isActive).toBe(true)
      })
    })

    it('should include city name in property type categories', async () => {
      ;(prisma.forumCategory.findUnique as jest.Mock).mockResolvedValue({
        id: 'gen-disc-id',
      })
      ;(prisma.forumCategory.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.forumCategory.create as jest.Mock).mockResolvedValue({
        id: 'created-id',
      })

      const { req, res } = createMocks({
        method: 'POST',
      })

      await handler(req, res)

      const createCalls = (prisma.forumCategory.create as jest.Mock).mock.calls
      const propTypeCall = createCalls.find(call => call[0].data.propertyType && call[0].data.name)
      if (propTypeCall) {
        expect(propTypeCall[0].data.name).toContain('in')
      }
    })

    it('should create slugs for property type categories', async () => {
      ;(prisma.forumCategory.findUnique as jest.Mock).mockResolvedValue({
        id: 'gen-disc-id',
      })
      ;(prisma.forumCategory.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.forumCategory.create as jest.Mock).mockResolvedValue({
        id: 'created-id',
      })

      const { req, res } = createMocks({
        method: 'POST',
      })

      await handler(req, res)

      const createCalls = (prisma.forumCategory.create as jest.Mock).mock.calls
      const propTypeCall = createCalls.find(call => call[0].data.propertyType)
      if (propTypeCall) {
        expect(propTypeCall[0].data.slug).toBeDefined()
        expect(propTypeCall[0].data.slug).toContain('-')
      }
    })

    it('should filter out existing cities before creating', async () => {
      ;(prisma.forumCategory.findUnique as jest.Mock).mockResolvedValue({
        id: 'gen-disc-id',
      })
      ;(prisma.forumCategory.findMany as jest.Mock).mockResolvedValue([{ city: 'gurgaon' }])
      ;(prisma.forumCategory.create as jest.Mock).mockResolvedValue({
        id: 'created-id',
      })

      const { req, res } = createMocks({
        method: 'POST',
      })

      await handler(req, res)

      const createCalls = (prisma.forumCategory.create as jest.Mock).mock.calls
      const gurgaonCalls = createCalls.filter(
        call => call[0].data.city === 'gurgaon' && call[0].data.parentId === 'gen-disc-id'
      )
      expect(gurgaonCalls.length).toBe(0)
    })

    it('should return cities added in response', async () => {
      ;(prisma.forumCategory.findUnique as jest.Mock).mockResolvedValue({
        id: 'gen-disc-id',
      })
      ;(prisma.forumCategory.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.forumCategory.create as jest.Mock).mockResolvedValue({
        id: 'created-id',
        name: 'Gurgaon',
      })

      const { req, res } = createMocks({
        method: 'POST',
      })

      await handler(req, res)

      const data = JSON.parse(res._getData())
      expect(data.cities).toBeDefined()
      expect(Array.isArray(data.cities)).toBe(true)
    })

    it('should handle partial city existence', async () => {
      ;(prisma.forumCategory.findUnique as jest.Mock).mockResolvedValue({
        id: 'gen-disc-id',
      })
      ;(prisma.forumCategory.findMany as jest.Mock).mockResolvedValue([
        { city: 'gurgaon' },
        { city: 'noida' },
      ])
      ;(prisma.forumCategory.create as jest.Mock).mockResolvedValue({
        id: 'created-id',
        name: 'Pune',
      })

      const { req, res } = createMocks({
        method: 'POST',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const data = JSON.parse(res._getData())
      expect(data.citiesAdded).toBeGreaterThan(0)
    })

    it('should create descriptions for cities', async () => {
      ;(prisma.forumCategory.findUnique as jest.Mock).mockResolvedValue({
        id: 'gen-disc-id',
      })
      ;(prisma.forumCategory.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.forumCategory.create as jest.Mock).mockResolvedValue({
        id: 'created-id',
      })

      const { req, res } = createMocks({
        method: 'POST',
      })

      await handler(req, res)

      const createCalls = (prisma.forumCategory.create as jest.Mock).mock.calls
      const cityCall = createCalls.find(
        call => call[0].data.city === 'gurgaon' && call[0].data.parentId === 'gen-disc-id'
      )
      if (cityCall) {
        expect(cityCall[0].data.description).toBeDefined()
      }
    })

    it('should create descriptions for property types', async () => {
      ;(prisma.forumCategory.findUnique as jest.Mock).mockResolvedValue({
        id: 'gen-disc-id',
      })
      ;(prisma.forumCategory.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.forumCategory.create as jest.Mock).mockResolvedValue({
        id: 'created-id',
      })

      const { req, res } = createMocks({
        method: 'POST',
      })

      await handler(req, res)

      const createCalls = (prisma.forumCategory.create as jest.Mock).mock.calls
      const propTypeCall = createCalls.find(call => call[0].data.propertyType)
      if (propTypeCall) {
        expect(propTypeCall[0].data.description).toBeDefined()
      }
    })

    it('should handle creation errors gracefully', async () => {
      ;(prisma.forumCategory.findUnique as jest.Mock).mockResolvedValue({
        id: 'gen-disc-id',
      })
      ;(prisma.forumCategory.findMany as jest.Mock).mockResolvedValue([])
      ;(prisma.forumCategory.create as jest.Mock).mockRejectedValue(new Error('Creation failed'))

      const { req, res } = createMocks({
        method: 'POST',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(500)
    })

    it('should return error details in development', async () => {
      ;(prisma.forumCategory.findUnique as jest.Mock).mockRejectedValue(new Error('Test error'))

      const { req, res } = createMocks({
        method: 'POST',
      })

      await handler(req, res)

      const data = JSON.parse(res._getData())
      expect(data.message).toBe('Internal server error')
      expect(data.error).toBeDefined()
    })
  })
})
