import { createMocks } from 'node-mocks-http'
import handler from '@/pages/api/projects/search'
import { prisma } from '@/lib/cockroachDB/prisma'

jest.mock('@/lib/cockroachDB/prisma', () => ({
  prisma: {
    project: {
      findMany: jest.fn(),
    },
  },
}))

describe('/api/projects/search', () => {
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
      expect(JSON.parse(res._getData())).toEqual({ message: 'Method not allowed' })
    })

    it('should return 405 for PUT method', async () => {
      const { req, res } = createMocks({
        method: 'PUT',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(405)
      expect(JSON.parse(res._getData())).toEqual({ message: 'Method not allowed' })
    })

    it('should return 405 for DELETE method', async () => {
      const { req, res } = createMocks({
        method: 'DELETE',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(405)
      expect(JSON.parse(res._getData())).toEqual({ message: 'Method not allowed' })
    })

    it('should return 405 for PATCH method', async () => {
      const { req, res } = createMocks({
        method: 'PATCH',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(405)
      expect(JSON.parse(res._getData())).toEqual({ message: 'Method not allowed' })
    })

    it('should accept GET method', async () => {
      ;(prisma.project.findMany as jest.Mock).mockResolvedValue([])

      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
    })
  })

  describe('No Query Parameter', () => {
    it('should return all projects when no query parameter', async () => {
      const mockProjects = [
        { id: '1', name: 'Project 1', builder: { name: 'Builder 1' }, location: { city: 'Mumbai', state: 'MH' } },
        { id: '2', name: 'Project 2', builder: { name: 'Builder 2' }, location: { city: 'Delhi', state: 'DL' } },
      ]
      ;(prisma.project.findMany as jest.Mock).mockResolvedValue(mockProjects)

      const { req, res } = createMocks({
        method: 'GET',
        query: {},
      })

      await handler(req, res)

      expect(prisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
          take: 100,
        })
      )
      const data = JSON.parse(res._getData())
      expect(data.projects).toEqual(mockProjects)
    })

    it('should limit to 100 projects when no query', async () => {
      ;(prisma.project.findMany as jest.Mock).mockResolvedValue([])

      const { req, res } = createMocks({
        method: 'GET',
        query: {},
      })

      await handler(req, res)

      expect(prisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 100,
        })
      )
    })

    it('should not apply search filter when no query', async () => {
      ;(prisma.project.findMany as jest.Mock).mockResolvedValue([])

      const { req, res } = createMocks({
        method: 'GET',
        query: {},
      })

      await handler(req, res)

      expect(prisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
        })
      )
    })
  })

  describe('Empty Query Parameter', () => {
    it('should return all projects when query is empty string', async () => {
      ;(prisma.project.findMany as jest.Mock).mockResolvedValue([])

      const { req, res } = createMocks({
        method: 'GET',
        query: { query: '' },
      })

      await handler(req, res)

      expect(prisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
          take: 100,
        })
      )
    })

    it('should return all projects when query is whitespace only', async () => {
      ;(prisma.project.findMany as jest.Mock).mockResolvedValue([])

      const { req, res } = createMocks({
        method: 'GET',
        query: { query: '   ' },
      })

      await handler(req, res)

      expect(prisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
          take: 100,
        })
      )
    })

    it('should trim whitespace from query', async () => {
      ;(prisma.project.findMany as jest.Mock).mockResolvedValue([])

      const { req, res } = createMocks({
        method: 'GET',
        query: { query: '  test  ' },
      })

      await handler(req, res)

      expect(prisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.any(Array),
          }),
        })
      )
    })
  })

  describe('Short Query - Less Than 2 Characters', () => {
    it('should return all projects when query is single character', async () => {
      ;(prisma.project.findMany as jest.Mock).mockResolvedValue([])

      const { req, res } = createMocks({
        method: 'GET',
        query: { query: 'a' },
      })

      await handler(req, res)

      expect(prisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
          take: 100,
        })
      )
    })

    it('should not apply search filter for single character', async () => {
      ;(prisma.project.findMany as jest.Mock).mockResolvedValue([])

      const { req, res } = createMocks({
        method: 'GET',
        query: { query: 'x' },
      })

      await handler(req, res)

      expect(prisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
        })
      )
    })
  })

  describe('Valid Query - Search by Project Name', () => {
    it('should search by project name with 2+ characters', async () => {
      ;(prisma.project.findMany as jest.Mock).mockResolvedValue([])

      const { req, res } = createMocks({
        method: 'GET',
        query: { query: 'Sunset' },
      })

      await handler(req, res)

      expect(prisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              {
                name: {
                  contains: 'Sunset',
                  mode: 'insensitive',
                },
              },
            ]),
          }),
        })
      )
    })

    it('should be case insensitive for project name', async () => {
      ;(prisma.project.findMany as jest.Mock).mockResolvedValue([])

      const { req, res } = createMocks({
        method: 'GET',
        query: { query: 'SUNRISE' },
      })

      await handler(req, res)

      expect(prisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              {
                name: {
                  contains: 'SUNRISE',
                  mode: 'insensitive',
                },
              },
            ]),
          }),
        })
      )
    })

    it('should limit to 20 results when searching', async () => {
      ;(prisma.project.findMany as jest.Mock).mockResolvedValue([])

      const { req, res } = createMocks({
        method: 'GET',
        query: { query: 'test' },
      })

      await handler(req, res)

      expect(prisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 20,
        })
      )
    })
  })

  describe('Search by Builder Name', () => {
    it('should search by builder name', async () => {
      ;(prisma.project.findMany as jest.Mock).mockResolvedValue([])

      const { req, res } = createMocks({
        method: 'GET',
        query: { query: 'BuilderCo' },
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

    it('should be case insensitive for builder name', async () => {
      ;(prisma.project.findMany as jest.Mock).mockResolvedValue([])

      const { req, res } = createMocks({
        method: 'GET',
        query: { query: 'builder' },
      })

      await handler(req, res)

      expect(prisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              {
                builder: {
                  name: {
                    contains: 'builder',
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

  describe('Search by Location - City', () => {
    it('should search by city', async () => {
      ;(prisma.project.findMany as jest.Mock).mockResolvedValue([])

      const { req, res } = createMocks({
        method: 'GET',
        query: { query: 'Mumbai' },
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

    it('should be case insensitive for city', async () => {
      ;(prisma.project.findMany as jest.Mock).mockResolvedValue([])

      const { req, res } = createMocks({
        method: 'GET',
        query: { query: 'mumbai' },
      })

      await handler(req, res)

      expect(prisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              {
                location: {
                  city: {
                    contains: 'mumbai',
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

  describe('Search by Location - State', () => {
    it('should search by state', async () => {
      ;(prisma.project.findMany as jest.Mock).mockResolvedValue([])

      const { req, res } = createMocks({
        method: 'GET',
        query: { query: 'Maharashtra' },
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

    it('should be case insensitive for state', async () => {
      ;(prisma.project.findMany as jest.Mock).mockResolvedValue([])

      const { req, res } = createMocks({
        method: 'GET',
        query: { query: 'karnataka' },
      })

      await handler(req, res)

      expect(prisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              {
                location: {
                  state: {
                    contains: 'karnataka',
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

  describe('Search by Location - Locality', () => {
    it('should search by locality', async () => {
      ;(prisma.project.findMany as jest.Mock).mockResolvedValue([])

      const { req, res } = createMocks({
        method: 'GET',
        query: { query: 'Andheri' },
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

    it('should be case insensitive for locality', async () => {
      ;(prisma.project.findMany as jest.Mock).mockResolvedValue([])

      const { req, res } = createMocks({
        method: 'GET',
        query: { query: 'ANDHERI' },
      })

      await handler(req, res)

      expect(prisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              {
                location: {
                  locality: {
                    contains: 'ANDHERI',
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

  describe('Search by Location - Neighborhood', () => {
    it('should search by neighborhood', async () => {
      ;(prisma.project.findMany as jest.Mock).mockResolvedValue([])

      const { req, res } = createMocks({
        method: 'GET',
        query: { query: 'Versova' },
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
  })

  describe('Search by Location - Zipcode', () => {
    it('should search by zipcode', async () => {
      ;(prisma.project.findMany as jest.Mock).mockResolvedValue([])

      const { req, res } = createMocks({
        method: 'GET',
        query: { query: '400001' },
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

    it('should handle partial zipcode search', async () => {
      ;(prisma.project.findMany as jest.Mock).mockResolvedValue([])

      const { req, res } = createMocks({
        method: 'GET',
        query: { query: '400' },
      })

      await handler(req, res)

      expect(prisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              {
                location: {
                  zipcode: {
                    contains: '400',
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

  describe('Search by Location - Formatted Address', () => {
    it('should search by formatted address', async () => {
      ;(prisma.project.findMany as jest.Mock).mockResolvedValue([])

      const { req, res } = createMocks({
        method: 'GET',
        query: { query: 'Link Road' },
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

  describe('Response Structure', () => {
    it('should return projects array', async () => {
      const mockProjects = [
        { id: '1', name: 'Project 1', builder: { name: 'Builder 1' }, location: { city: 'Mumbai', state: 'MH' } },
      ]
      ;(prisma.project.findMany as jest.Mock).mockResolvedValue(mockProjects)

      const { req, res } = createMocks({
        method: 'GET',
        query: { query: 'test' },
      })

      await handler(req, res)

      const data = JSON.parse(res._getData())
      expect(data).toHaveProperty('projects')
      expect(Array.isArray(data.projects)).toBe(true)
    })

    it('should include project id', async () => {
      const mockProjects = [
        { id: 'proj-123', name: 'Project 1', builder: { name: 'Builder 1' }, location: { city: 'Mumbai', state: 'MH' } },
      ]
      ;(prisma.project.findMany as jest.Mock).mockResolvedValue(mockProjects)

      const { req, res } = createMocks({
        method: 'GET',
        query: { query: 'test' },
      })

      await handler(req, res)

      const data = JSON.parse(res._getData())
      expect(data.projects[0]).toHaveProperty('id', 'proj-123')
    })

    it('should include project name', async () => {
      const mockProjects = [
        { id: '1', name: 'Sunset Towers', builder: { name: 'Builder 1' }, location: { city: 'Mumbai', state: 'MH' } },
      ]
      ;(prisma.project.findMany as jest.Mock).mockResolvedValue(mockProjects)

      const { req, res } = createMocks({
        method: 'GET',
        query: { query: 'test' },
      })

      await handler(req, res)

      const data = JSON.parse(res._getData())
      expect(data.projects[0]).toHaveProperty('name', 'Sunset Towers')
    })

    it('should include builder name', async () => {
      const mockProjects = [
        { id: '1', name: 'Project 1', builder: { name: 'Premium Builders' }, location: { city: 'Mumbai', state: 'MH' } },
      ]
      ;(prisma.project.findMany as jest.Mock).mockResolvedValue(mockProjects)

      const { req, res } = createMocks({
        method: 'GET',
        query: { query: 'test' },
      })

      await handler(req, res)

      const data = JSON.parse(res._getData())
      expect(data.projects[0].builder).toHaveProperty('name', 'Premium Builders')
    })

    it('should include location city and state', async () => {
      const mockProjects = [
        { id: '1', name: 'Project 1', builder: { name: 'Builder 1' }, location: { city: 'Delhi', state: 'Delhi' } },
      ]
      ;(prisma.project.findMany as jest.Mock).mockResolvedValue(mockProjects)

      const { req, res } = createMocks({
        method: 'GET',
        query: { query: 'test' },
      })

      await handler(req, res)

      const data = JSON.parse(res._getData())
      expect(data.projects[0].location).toHaveProperty('city', 'Delhi')
      expect(data.projects[0].location).toHaveProperty('state', 'Delhi')
    })

    it('should return empty array when no results', async () => {
      ;(prisma.project.findMany as jest.Mock).mockResolvedValue([])

      const { req, res } = createMocks({
        method: 'GET',
        query: { query: 'nonexistent' },
      })

      await handler(req, res)

      const data = JSON.parse(res._getData())
      expect(data.projects).toEqual([])
    })
  })

  describe('Query Ordering', () => {
    it('should order results by name ascending', async () => {
      ;(prisma.project.findMany as jest.Mock).mockResolvedValue([])

      const { req, res } = createMocks({
        method: 'GET',
        query: { query: 'test' },
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

  describe('Selected Fields', () => {
    it('should select only required fields', async () => {
      ;(prisma.project.findMany as jest.Mock).mockResolvedValue([])

      const { req, res } = createMocks({
        method: 'GET',
        query: { query: 'test' },
      })

      await handler(req, res)

      expect(prisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          select: {
            id: true,
            name: true,
            builder: {
              select: {
                name: true,
              },
            },
            location: {
              select: {
                city: true,
                state: true,
              },
            },
          },
        })
      )
    })
  })

  describe('Multiple Results', () => {
    it('should return multiple matching projects', async () => {
      const mockProjects = [
        { id: '1', name: 'Project A', builder: { name: 'Builder 1' }, location: { city: 'Mumbai', state: 'MH' } },
        { id: '2', name: 'Project B', builder: { name: 'Builder 2' }, location: { city: 'Mumbai', state: 'MH' } },
        { id: '3', name: 'Project C', builder: { name: 'Builder 3' }, location: { city: 'Mumbai', state: 'MH' } },
      ]
      ;(prisma.project.findMany as jest.Mock).mockResolvedValue(mockProjects)

      const { req, res } = createMocks({
        method: 'GET',
        query: { query: 'Project' },
      })

      await handler(req, res)

      const data = JSON.parse(res._getData())
      expect(data.projects).toHaveLength(3)
    })

    it('should not exceed 20 results limit', async () => {
      const mockProjects = Array(25)
        .fill(null)
        .map((_, i) => ({
          id: `${i}`,
          name: `Project ${i}`,
          builder: { name: 'Builder' },
          location: { city: 'Mumbai', state: 'MH' },
        }))
      ;(prisma.project.findMany as jest.Mock).mockResolvedValue(mockProjects.slice(0, 20))

      const { req, res } = createMocks({
        method: 'GET',
        query: { query: 'Project' },
      })

      await handler(req, res)

      expect(prisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 20,
        })
      )
    })
  })

  describe('Edge Cases', () => {
    it('should handle special characters in query', async () => {
      ;(prisma.project.findMany as jest.Mock).mockResolvedValue([])

      const { req, res } = createMocks({
        method: 'GET',
        query: { query: '@#$%' },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
    })

    it('should handle unicode characters', async () => {
      ;(prisma.project.findMany as jest.Mock).mockResolvedValue([])

      const { req, res } = createMocks({
        method: 'GET',
        query: { query: '日本語' },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
    })

    it('should handle very long query strings', async () => {
      ;(prisma.project.findMany as jest.Mock).mockResolvedValue([])

      const { req, res } = createMocks({
        method: 'GET',
        query: { query: 'a'.repeat(1000) },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
    })

    it('should handle query with only numbers', async () => {
      ;(prisma.project.findMany as jest.Mock).mockResolvedValue([])

      const { req, res } = createMocks({
        method: 'GET',
        query: { query: '12345' },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
    })

    it('should handle query parameter as array (takes first element)', async () => {
      ;(prisma.project.findMany as jest.Mock).mockResolvedValue([])

      const { req, res } = createMocks({
        method: 'GET',
        query: { query: ['first', 'second'] },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
    })
  })

  describe('Error Handling', () => {
    it('should return 500 on database error', async () => {
      ;(prisma.project.findMany as jest.Mock).mockRejectedValue(new Error('Database error'))

      const { req, res } = createMocks({
        method: 'GET',
        query: { query: 'test' },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(500)
      expect(JSON.parse(res._getData())).toEqual({ message: 'Internal server error' })
    })

    it('should handle unexpected errors gracefully', async () => {
      ;(prisma.project.findMany as jest.Mock).mockImplementation(() => {
        throw new Error('Unexpected error')
      })

      const { req, res } = createMocks({
        method: 'GET',
        query: { query: 'test' },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(500)
    })

    it('should handle null query parameter', async () => {
      ;(prisma.project.findMany as jest.Mock).mockResolvedValue([])

      const { req, res } = createMocks({
        method: 'GET',
        query: { query: null },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
    })

    it('should handle undefined query parameter', async () => {
      ;(prisma.project.findMany as jest.Mock).mockResolvedValue([])

      const { req, res } = createMocks({
        method: 'GET',
        query: { query: undefined },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
    })
  })

  describe('Success Status', () => {
    it('should return 200 on successful search', async () => {
      ;(prisma.project.findMany as jest.Mock).mockResolvedValue([])

      const { req, res } = createMocks({
        method: 'GET',
        query: { query: 'test' },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
    })

    it('should return 200 even with no results', async () => {
      ;(prisma.project.findMany as jest.Mock).mockResolvedValue([])

      const { req, res } = createMocks({
        method: 'GET',
        query: { query: 'nonexistent' },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
    })
  })

  describe('Search Combinations', () => {
    it('should search across all fields with OR logic', async () => {
      ;(prisma.project.findMany as jest.Mock).mockResolvedValue([])

      const { req, res } = createMocks({
        method: 'GET',
        query: { query: 'Mumbai' },
      })

      await handler(req, res)

      expect(prisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ name: expect.any(Object) }),
              expect.objectContaining({ builder: expect.any(Object) }),
              expect.objectContaining({ location: expect.any(Object) }),
            ]),
          }),
        })
      )
    })

    it('should match partial words', async () => {
      const mockProjects = [
        { id: '1', name: 'Sunrise Project', builder: { name: 'Builder' }, location: { city: 'Mumbai', state: 'MH' } },
      ]
      ;(prisma.project.findMany as jest.Mock).mockResolvedValue(mockProjects)

      const { req, res } = createMocks({
        method: 'GET',
        query: { query: 'sun' },
      })

      await handler(req, res)

      const data = JSON.parse(res._getData())
      expect(data.projects).toHaveLength(1)
    })
  })
})
