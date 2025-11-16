import { createMocks } from 'node-mocks-http'
import handler from '@/pages/api/projects/index'
import { prisma } from '@/lib/cockroachDB/prisma'

jest.mock('@/lib/cockroachDB/prisma', () => ({
  prisma: {
    project: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
  },
}))

describe('/api/projects/index', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Method Validation', () => {
    it('should return 405 for POST method', async () => {
      const { req, res } = createMocks({
        method: 'POST',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(405)
      expect(JSON.parse(res._getData())).toEqual({ error: 'Method not allowed' })
    })

    it('should return 405 for PUT method', async () => {
      const { req, res } = createMocks({
        method: 'PUT',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(405)
      expect(JSON.parse(res._getData())).toEqual({ error: 'Method not allowed' })
    })

    it('should return 405 for DELETE method', async () => {
      const { req, res } = createMocks({
        method: 'DELETE',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(405)
      expect(JSON.parse(res._getData())).toEqual({ error: 'Method not allowed' })
    })

    it('should return 405 for PATCH method', async () => {
      const { req, res } = createMocks({
        method: 'PATCH',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(405)
      expect(JSON.parse(res._getData())).toEqual({ error: 'Method not allowed' })
    })

    it('should accept GET method', async () => {
      ;(prisma.project.count as jest.Mock).mockResolvedValue(0)
      ;(prisma.project.findMany as jest.Mock).mockResolvedValue([])

      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
    })
  })

  describe('Pagination - Default Values', () => {
    it('should use default page 1 when no page parameter provided', async () => {
      ;(prisma.project.count as jest.Mock).mockResolvedValue(0)
      ;(prisma.project.findMany as jest.Mock).mockResolvedValue([])

      const { req, res } = createMocks({
        method: 'GET',
        query: {},
      })

      await handler(req, res)

      expect(prisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
        })
      )
    })

    it('should use default limit 12 when no limit parameter provided', async () => {
      ;(prisma.project.count as jest.Mock).mockResolvedValue(0)
      ;(prisma.project.findMany as jest.Mock).mockResolvedValue([])

      const { req, res } = createMocks({
        method: 'GET',
        query: {},
      })

      await handler(req, res)

      expect(prisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 12,
        })
      )
    })

    it('should return correct pagination metadata with defaults', async () => {
      ;(prisma.project.count as jest.Mock).mockResolvedValue(0)
      ;(prisma.project.findMany as jest.Mock).mockResolvedValue([])

      const { req, res } = createMocks({
        method: 'GET',
        query: {},
      })

      await handler(req, res)

      const data = JSON.parse(res._getData())
      expect(data.pagination).toEqual({
        currentPage: 1,
        totalPages: 0,
        totalCount: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      })
    })
  })

  describe('Pagination - Custom Values', () => {
    it('should use custom page parameter', async () => {
      ;(prisma.project.count as jest.Mock).mockResolvedValue(100)
      ;(prisma.project.findMany as jest.Mock).mockResolvedValue([])

      const { req, res } = createMocks({
        method: 'GET',
        query: { page: '3' },
      })

      await handler(req, res)

      expect(prisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 24, // (3-1) * 12
        })
      )
    })

    it('should use custom limit parameter', async () => {
      ;(prisma.project.count as jest.Mock).mockResolvedValue(100)
      ;(prisma.project.findMany as jest.Mock).mockResolvedValue([])

      const { req, res } = createMocks({
        method: 'GET',
        query: { limit: '20' },
      })

      await handler(req, res)

      expect(prisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 20,
        })
      )
    })

    it('should calculate correct skip with custom page and limit', async () => {
      ;(prisma.project.count as jest.Mock).mockResolvedValue(100)
      ;(prisma.project.findMany as jest.Mock).mockResolvedValue([])

      const { req, res } = createMocks({
        method: 'GET',
        query: { page: '5', limit: '10' },
      })

      await handler(req, res)

      expect(prisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 40, // (5-1) * 10
          take: 10,
        })
      )
    })

    it('should handle page as string number', async () => {
      ;(prisma.project.count as jest.Mock).mockResolvedValue(50)
      ;(prisma.project.findMany as jest.Mock).mockResolvedValue([])

      const { req, res } = createMocks({
        method: 'GET',
        query: { page: '2' },
      })

      await handler(req, res)

      const data = JSON.parse(res._getData())
      expect(data.pagination.currentPage).toBe(2)
    })

    it('should handle limit as string number', async () => {
      ;(prisma.project.count as jest.Mock).mockResolvedValue(50)
      ;(prisma.project.findMany as jest.Mock).mockResolvedValue([])

      const { req, res } = createMocks({
        method: 'GET',
        query: { limit: '25' },
      })

      await handler(req, res)

      expect(prisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 25,
        })
      )
    })
  })

  describe('Pagination Metadata', () => {
    it('should calculate totalPages correctly', async () => {
      ;(prisma.project.count as jest.Mock).mockResolvedValue(25)
      ;(prisma.project.findMany as jest.Mock).mockResolvedValue([])

      const { req, res } = createMocks({
        method: 'GET',
        query: { limit: '10' },
      })

      await handler(req, res)

      const data = JSON.parse(res._getData())
      expect(data.pagination.totalPages).toBe(3) // ceil(25/10)
    })

    it('should set hasNextPage true when more pages available', async () => {
      ;(prisma.project.count as jest.Mock).mockResolvedValue(50)
      ;(prisma.project.findMany as jest.Mock).mockResolvedValue([])

      const { req, res } = createMocks({
        method: 'GET',
        query: { page: '1', limit: '10' },
      })

      await handler(req, res)

      const data = JSON.parse(res._getData())
      expect(data.pagination.hasNextPage).toBe(true)
    })

    it('should set hasNextPage false on last page', async () => {
      ;(prisma.project.count as jest.Mock).mockResolvedValue(25)
      ;(prisma.project.findMany as jest.Mock).mockResolvedValue([])

      const { req, res } = createMocks({
        method: 'GET',
        query: { page: '3', limit: '10' },
      })

      await handler(req, res)

      const data = JSON.parse(res._getData())
      expect(data.pagination.hasNextPage).toBe(false)
    })

    it('should set hasPreviousPage true when not on first page', async () => {
      ;(prisma.project.count as jest.Mock).mockResolvedValue(50)
      ;(prisma.project.findMany as jest.Mock).mockResolvedValue([])

      const { req, res } = createMocks({
        method: 'GET',
        query: { page: '2' },
      })

      await handler(req, res)

      const data = JSON.parse(res._getData())
      expect(data.pagination.hasPreviousPage).toBe(true)
    })

    it('should set hasPreviousPage false on first page', async () => {
      ;(prisma.project.count as jest.Mock).mockResolvedValue(50)
      ;(prisma.project.findMany as jest.Mock).mockResolvedValue([])

      const { req, res } = createMocks({
        method: 'GET',
        query: { page: '1' },
      })

      await handler(req, res)

      const data = JSON.parse(res._getData())
      expect(data.pagination.hasPreviousPage).toBe(false)
    })

    it('should return correct totalCount', async () => {
      ;(prisma.project.count as jest.Mock).mockResolvedValue(42)
      ;(prisma.project.findMany as jest.Mock).mockResolvedValue([])

      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      const data = JSON.parse(res._getData())
      expect(data.pagination.totalCount).toBe(42)
    })
  })

  describe('Search Functionality - No Search Query', () => {
    it('should not apply search filter when no search parameter', async () => {
      ;(prisma.project.count as jest.Mock).mockResolvedValue(0)
      ;(prisma.project.findMany as jest.Mock).mockResolvedValue([])

      const { req, res } = createMocks({
        method: 'GET',
        query: {},
      })

      await handler(req, res)

      expect(prisma.project.count).toHaveBeenCalledWith({ where: {} })
      expect(prisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
        })
      )
    })
  })

  describe('Search Functionality - Project Name', () => {
    it('should search by project name case-insensitively', async () => {
      ;(prisma.project.count as jest.Mock).mockResolvedValue(1)
      ;(prisma.project.findMany as jest.Mock).mockResolvedValue([])

      const { req, res } = createMocks({
        method: 'GET',
        query: { search: 'sunset' },
      })

      await handler(req, res)

      expect(prisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              {
                name: {
                  contains: 'sunset',
                  mode: 'insensitive',
                },
              },
            ]),
          }),
        })
      )
    })
  })

  describe('Search Functionality - Builder Name', () => {
    it('should search by builder name', async () => {
      ;(prisma.project.count as jest.Mock).mockResolvedValue(1)
      ;(prisma.project.findMany as jest.Mock).mockResolvedValue([])

      const { req, res } = createMocks({
        method: 'GET',
        query: { search: 'BuilderCo' },
      })

      await handler(req, res)

      expect(prisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              {
                builder: {
                  name: {
                    contains: 'BuilderCo',
                    mode: 'insensitive',
                  },
                },
              },
            ]),
          }),
        })
      )
    })
  })

  describe('Search Functionality - Location Fields', () => {
    it('should search by city', async () => {
      ;(prisma.project.count as jest.Mock).mockResolvedValue(1)
      ;(prisma.project.findMany as jest.Mock).mockResolvedValue([])

      const { req, res } = createMocks({
        method: 'GET',
        query: { search: 'Mumbai' },
      })

      await handler(req, res)

      expect(prisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              {
                location: {
                  city: {
                    contains: 'Mumbai',
                    mode: 'insensitive',
                  },
                },
              },
            ]),
          }),
        })
      )
    })

    it('should search by state', async () => {
      ;(prisma.project.count as jest.Mock).mockResolvedValue(1)
      ;(prisma.project.findMany as jest.Mock).mockResolvedValue([])

      const { req, res } = createMocks({
        method: 'GET',
        query: { search: 'Maharashtra' },
      })

      await handler(req, res)

      expect(prisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              {
                location: {
                  state: {
                    contains: 'Maharashtra',
                    mode: 'insensitive',
                  },
                },
              },
            ]),
          }),
        })
      )
    })

    it('should search by zipcode', async () => {
      ;(prisma.project.count as jest.Mock).mockResolvedValue(1)
      ;(prisma.project.findMany as jest.Mock).mockResolvedValue([])

      const { req, res } = createMocks({
        method: 'GET',
        query: { search: '400001' },
      })

      await handler(req, res)

      expect(prisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              {
                location: {
                  zipcode: {
                    contains: '400001',
                    mode: 'insensitive',
                  },
                },
              },
            ]),
          }),
        })
      )
    })

    it('should search by locality', async () => {
      ;(prisma.project.count as jest.Mock).mockResolvedValue(1)
      ;(prisma.project.findMany as jest.Mock).mockResolvedValue([])

      const { req, res } = createMocks({
        method: 'GET',
        query: { search: 'Andheri' },
      })

      await handler(req, res)

      expect(prisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              {
                location: {
                  locality: {
                    contains: 'Andheri',
                    mode: 'insensitive',
                  },
                },
              },
            ]),
          }),
        })
      )
    })

    it('should search by neighborhood', async () => {
      ;(prisma.project.count as jest.Mock).mockResolvedValue(1)
      ;(prisma.project.findMany as jest.Mock).mockResolvedValue([])

      const { req, res } = createMocks({
        method: 'GET',
        query: { search: 'Versova' },
      })

      await handler(req, res)

      expect(prisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              {
                location: {
                  neighborhood: {
                    contains: 'Versova',
                    mode: 'insensitive',
                  },
                },
              },
            ]),
          }),
        })
      )
    })

    it('should search by formatted address', async () => {
      ;(prisma.project.count as jest.Mock).mockResolvedValue(1)
      ;(prisma.project.findMany as jest.Mock).mockResolvedValue([])

      const { req, res } = createMocks({
        method: 'GET',
        query: { search: 'Link Road' },
      })

      await handler(req, res)

      expect(prisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              {
                location: {
                  formattedAddress: {
                    contains: 'Link Road',
                    mode: 'insensitive',
                  },
                },
              },
            ]),
          }),
        })
      )
    })
  })

  describe('Query Response Structure', () => {
    it('should include builder information in response', async () => {
      const mockProject = {
        id: 'project-1',
        name: 'Test Project',
        builder: {
          id: 'builder-1',
          name: 'Test Builder',
          logoUrl: 'https://example.com/logo.png',
        },
        location: {
          id: 'loc-1',
          city: 'Mumbai',
          state: 'Maharashtra',
          country: 'India',
          zipcode: '400001',
          locality: 'Andheri',
        },
      }

      ;(prisma.project.count as jest.Mock).mockResolvedValue(1)
      ;(prisma.project.findMany as jest.Mock).mockResolvedValue([mockProject])

      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      const data = JSON.parse(res._getData())
      expect(data.projects[0]).toHaveProperty('builder')
      expect(data.projects[0].builder).toEqual({
        id: 'builder-1',
        name: 'Test Builder',
        logoUrl: 'https://example.com/logo.png',
      })
    })

    it('should include location information in response', async () => {
      const mockProject = {
        id: 'project-1',
        name: 'Test Project',
        builder: {
          id: 'builder-1',
          name: 'Test Builder',
          logoUrl: null,
        },
        location: {
          id: 'loc-1',
          city: 'Delhi',
          state: 'Delhi',
          country: 'India',
          zipcode: '110001',
          locality: 'Connaught Place',
        },
      }

      ;(prisma.project.count as jest.Mock).mockResolvedValue(1)
      ;(prisma.project.findMany as jest.Mock).mockResolvedValue([mockProject])

      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      const data = JSON.parse(res._getData())
      expect(data.projects[0]).toHaveProperty('location')
      expect(data.projects[0].location).toHaveProperty('city', 'Delhi')
    })

    it('should return projects array in response', async () => {
      ;(prisma.project.count as jest.Mock).mockResolvedValue(0)
      ;(prisma.project.findMany as jest.Mock).mockResolvedValue([])

      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      const data = JSON.parse(res._getData())
      expect(data).toHaveProperty('projects')
      expect(Array.isArray(data.projects)).toBe(true)
    })

    it('should return pagination object in response', async () => {
      ;(prisma.project.count as jest.Mock).mockResolvedValue(0)
      ;(prisma.project.findMany as jest.Mock).mockResolvedValue([])

      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      const data = JSON.parse(res._getData())
      expect(data).toHaveProperty('pagination')
      expect(data.pagination).toHaveProperty('currentPage')
      expect(data.pagination).toHaveProperty('totalPages')
      expect(data.pagination).toHaveProperty('totalCount')
      expect(data.pagination).toHaveProperty('hasNextPage')
      expect(data.pagination).toHaveProperty('hasPreviousPage')
    })
  })

  describe('Query Ordering', () => {
    it('should order projects by name ascending', async () => {
      ;(prisma.project.count as jest.Mock).mockResolvedValue(0)
      ;(prisma.project.findMany as jest.Mock).mockResolvedValue([])

      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      expect(prisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: {
            name: 'asc',
          },
        })
      )
    })
  })

  describe('Error Handling', () => {
    it('should return 500 on database error during count', async () => {
      ;(prisma.project.count as jest.Mock).mockRejectedValue(new Error('Database error'))

      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(500)
      expect(JSON.parse(res._getData())).toEqual({ error: 'Internal server error' })
    })

    it('should return 500 on database error during findMany', async () => {
      ;(prisma.project.count as jest.Mock).mockResolvedValue(10)
      ;(prisma.project.findMany as jest.Mock).mockRejectedValue(new Error('Database error'))

      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(500)
      expect(JSON.parse(res._getData())).toEqual({ error: 'Internal server error' })
    })

    it('should handle unexpected errors gracefully', async () => {
      ;(prisma.project.count as jest.Mock).mockImplementation(() => {
        throw new Error('Unexpected error')
      })

      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(500)
    })
  })

  describe('Edge Cases', () => {
    it('should handle page 0 gracefully', async () => {
      ;(prisma.project.count as jest.Mock).mockResolvedValue(10)
      ;(prisma.project.findMany as jest.Mock).mockResolvedValue([])

      const { req, res } = createMocks({
        method: 'GET',
        query: { page: '0' },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
    })

    it('should handle negative page numbers', async () => {
      ;(prisma.project.count as jest.Mock).mockResolvedValue(10)
      ;(prisma.project.findMany as jest.Mock).mockResolvedValue([])

      const { req, res } = createMocks({
        method: 'GET',
        query: { page: '-1' },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
    })

    it('should handle very large page numbers', async () => {
      ;(prisma.project.count as jest.Mock).mockResolvedValue(10)
      ;(prisma.project.findMany as jest.Mock).mockResolvedValue([])

      const { req, res } = createMocks({
        method: 'GET',
        query: { page: '999999' },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
    })

    it('should handle very large limit values', async () => {
      ;(prisma.project.count as jest.Mock).mockResolvedValue(10)
      ;(prisma.project.findMany as jest.Mock).mockResolvedValue([])

      const { req, res } = createMocks({
        method: 'GET',
        query: { limit: '1000' },
      })

      await handler(req, res)

      expect(prisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 1000,
        })
      )
    })

    it('should handle empty string search query', async () => {
      ;(prisma.project.count as jest.Mock).mockResolvedValue(0)
      ;(prisma.project.findMany as jest.Mock).mockResolvedValue([])

      const { req, res } = createMocks({
        method: 'GET',
        query: { search: '' },
      })

      await handler(req, res)

      expect(prisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
        })
      )
    })

    it('should handle whitespace-only search query', async () => {
      ;(prisma.project.count as jest.Mock).mockResolvedValue(1)
      ;(prisma.project.findMany as jest.Mock).mockResolvedValue([])

      const { req, res } = createMocks({
        method: 'GET',
        query: { search: '   ' },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
    })

    it('should handle special characters in search', async () => {
      ;(prisma.project.count as jest.Mock).mockResolvedValue(0)
      ;(prisma.project.findMany as jest.Mock).mockResolvedValue([])

      const { req, res } = createMocks({
        method: 'GET',
        query: { search: '@#$%^&*()' },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
    })

    it('should handle unicode characters in search', async () => {
      ;(prisma.project.count as jest.Mock).mockResolvedValue(0)
      ;(prisma.project.findMany as jest.Mock).mockResolvedValue([])

      const { req, res } = createMocks({
        method: 'GET',
        query: { search: '日本語' },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
    })
  })

  describe('Multiple Projects Response', () => {
    it('should return multiple projects correctly', async () => {
      const mockProjects = [
        {
          id: 'project-1',
          name: 'Project A',
          builder: { id: 'b1', name: 'Builder A', logoUrl: null },
          location: {
            id: 'l1',
            city: 'Mumbai',
            state: 'MH',
            country: 'India',
            zipcode: '400001',
            locality: 'Andheri',
          },
        },
        {
          id: 'project-2',
          name: 'Project B',
          builder: { id: 'b2', name: 'Builder B', logoUrl: null },
          location: {
            id: 'l2',
            city: 'Delhi',
            state: 'DL',
            country: 'India',
            zipcode: '110001',
            locality: 'CP',
          },
        },
      ]

      ;(prisma.project.count as jest.Mock).mockResolvedValue(2)
      ;(prisma.project.findMany as jest.Mock).mockResolvedValue(mockProjects)

      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      const data = JSON.parse(res._getData())
      expect(data.projects).toHaveLength(2)
      expect(data.projects[0].id).toBe('project-1')
      expect(data.projects[1].id).toBe('project-2')
    })

    it('should handle empty results', async () => {
      ;(prisma.project.count as jest.Mock).mockResolvedValue(0)
      ;(prisma.project.findMany as jest.Mock).mockResolvedValue([])

      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      const data = JSON.parse(res._getData())
      expect(data.projects).toHaveLength(0)
      expect(data.pagination.totalCount).toBe(0)
    })
  })

  describe('Complex Pagination Scenarios', () => {
    it('should handle exact page boundary correctly', async () => {
      ;(prisma.project.count as jest.Mock).mockResolvedValue(12)
      ;(prisma.project.findMany as jest.Mock).mockResolvedValue([])

      const { req, res } = createMocks({
        method: 'GET',
        query: { page: '1', limit: '12' },
      })

      await handler(req, res)

      const data = JSON.parse(res._getData())
      expect(data.pagination.totalPages).toBe(1)
      expect(data.pagination.hasNextPage).toBe(false)
    })

    it('should handle partial last page', async () => {
      ;(prisma.project.count as jest.Mock).mockResolvedValue(15)
      ;(prisma.project.findMany as jest.Mock).mockResolvedValue([])

      const { req, res } = createMocks({
        method: 'GET',
        query: { page: '2', limit: '10' },
      })

      await handler(req, res)

      const data = JSON.parse(res._getData())
      expect(data.pagination.totalPages).toBe(2)
      expect(data.pagination.hasNextPage).toBe(false)
    })
  })

  describe('Database Query Structure', () => {
    it('should call count with correct parameters', async () => {
      ;(prisma.project.count as jest.Mock).mockResolvedValue(0)
      ;(prisma.project.findMany as jest.Mock).mockResolvedValue([])

      const { req, res } = createMocks({
        method: 'GET',
        query: { search: 'test' },
      })

      await handler(req, res)

      expect(prisma.project.count).toHaveBeenCalledWith({
        where: expect.objectContaining({
          OR: expect.any(Array),
        }),
      })
    })

    it('should include correct relations in findMany', async () => {
      ;(prisma.project.count as jest.Mock).mockResolvedValue(0)
      ;(prisma.project.findMany as jest.Mock).mockResolvedValue([])

      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      expect(prisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: {
            builder: {
              select: {
                id: true,
                name: true,
                logoUrl: true,
              },
            },
            location: {
              select: {
                id: true,
                city: true,
                state: true,
                country: true,
                zipcode: true,
                locality: true,
              },
            },
          },
        })
      )
    })
  })
})
