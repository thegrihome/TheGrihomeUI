import { NextApiRequest, NextApiResponse } from 'next'
import handler from '@/pages/api/properties/search'
import { searchProperties, countProperties } from '@/lib/cockroachDB/queries'
import { logAPIMetrics } from '@/lib/cockroachDB/ru-monitor'
import { PropertyType } from '@prisma/client'

jest.mock('@/lib/cockroachDB/queries', () => ({
  searchProperties: jest.fn(),
  countProperties: jest.fn(),
}))

jest.mock('@/lib/cockroachDB/ru-monitor', () => ({
  logAPIMetrics: jest.fn(),
}))

describe('/api/properties/search', () => {
  let req: Partial<NextApiRequest>
  let res: Partial<NextApiResponse>
  let jsonMock: jest.Mock
  let statusMock: jest.Mock

  const mockProperties = [
    {
      id: 'prop-1',
      streetAddress: '123 Main St',
      imageUrls: ['https://example.com/img1.jpg'],
      thumbnailIndex: 0,
      createdAt: new Date('2024-01-15'),
      location: {
        city: 'Hyderabad',
        state: 'Telangana',
        country: 'India',
        zipcode: '500081',
        locality: 'Madhapur',
      },
      project: {
        id: 'project-1',
        type: 'APARTMENT' as any,
        numberOfUnits: 100,
      },
    },
    {
      id: 'prop-2',
      streetAddress: '456 Oak Ave',
      imageUrls: ['https://example.com/img2.jpg'],
      thumbnailIndex: 0,
      createdAt: new Date('2024-01-10'),
      location: {
        city: 'Bangalore',
        state: 'Karnataka',
        country: 'India',
        zipcode: '560001',
        locality: 'Koramangala',
      },
      project: null,
    },
  ]

  beforeEach(() => {
    jsonMock = jest.fn()
    statusMock = jest.fn().mockReturnValue({ json: jsonMock })
    req = {
      method: 'GET',
      query: {},
    }
    res = {
      status: statusMock,
      json: jsonMock,
    }
    jest.clearAllMocks()
    ;(searchProperties as jest.Mock).mockResolvedValue(mockProperties)
    ;(countProperties as jest.Mock).mockResolvedValue(2)
  })

  describe('HTTP Method Validation', () => {
    it('should return 405 for POST requests', async () => {
      req.method = 'POST'

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(405)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Method not allowed' })
    })

    it('should return 405 for PUT requests', async () => {
      req.method = 'PUT'

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(405)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Method not allowed' })
    })

    it('should return 405 for DELETE requests', async () => {
      req.method = 'DELETE'

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(405)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Method not allowed' })
    })

    it('should return 405 for PATCH requests', async () => {
      req.method = 'PATCH'

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(405)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Method not allowed' })
    })

    it('should accept GET requests', async () => {
      req.method = 'GET'

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(200)
    })
  })

  describe('Basic Search Functionality', () => {
    it('should return empty array when no properties found', async () => {
      ;(searchProperties as jest.Mock).mockResolvedValue([])
      ;(countProperties as jest.Mock).mockResolvedValue(0)

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(200)
      expect(jsonMock).toHaveBeenCalledWith({
        properties: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
          hasMore: false,
        },
      })
    })

    it('should return properties with default pagination', async () => {
      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(200)
      expect(jsonMock).toHaveBeenCalledWith({
        properties: mockProperties,
        pagination: {
          page: 1,
          limit: 20,
          total: 2,
          totalPages: 1,
          hasMore: false,
        },
      })
    })

    it('should call searchProperties with default parameters', async () => {
      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(searchProperties).toHaveBeenCalledWith({
        limit: 20,
        offset: 0,
      })
    })

    it('should call countProperties with empty filters', async () => {
      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(countProperties).toHaveBeenCalledWith({})
    })

    it('should call both searchProperties and countProperties in parallel', async () => {
      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(searchProperties).toHaveBeenCalled()
      expect(countProperties).toHaveBeenCalled()
    })
  })

  describe('City Filtering', () => {
    it('should filter by city', async () => {
      req.query = { city: 'Hyderabad' }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(searchProperties).toHaveBeenCalledWith(
        expect.objectContaining({
          city: 'Hyderabad',
        })
      )
    })

    it('should pass city filter to countProperties', async () => {
      req.query = { city: 'Hyderabad' }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(countProperties).toHaveBeenCalledWith(
        expect.objectContaining({
          city: 'Hyderabad',
        })
      )
    })

    it('should handle city with special characters', async () => {
      req.query = { city: 'Bengaluru (Bangalore)' }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(searchProperties).toHaveBeenCalledWith(
        expect.objectContaining({
          city: 'Bengaluru (Bangalore)',
        })
      )
    })

    it('should handle city with spaces', async () => {
      req.query = { city: 'New Delhi' }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(searchProperties).toHaveBeenCalledWith(
        expect.objectContaining({
          city: 'New Delhi',
        })
      )
    })
  })

  describe('State Filtering', () => {
    it('should filter by state', async () => {
      req.query = { state: 'Telangana' }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(searchProperties).toHaveBeenCalledWith(
        expect.objectContaining({
          state: 'Telangana',
        })
      )
    })

    it('should pass state filter to countProperties', async () => {
      req.query = { state: 'Telangana' }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(countProperties).toHaveBeenCalledWith(
        expect.objectContaining({
          state: 'Telangana',
        })
      )
    })

    it('should combine city and state filters', async () => {
      req.query = { city: 'Hyderabad', state: 'Telangana' }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(searchProperties).toHaveBeenCalledWith(
        expect.objectContaining({
          city: 'Hyderabad',
          state: 'Telangana',
        })
      )
    })
  })

  describe('Locality Filtering', () => {
    it('should filter by locality', async () => {
      req.query = { locality: 'Madhapur' }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(searchProperties).toHaveBeenCalledWith(
        expect.objectContaining({
          locality: 'Madhapur',
        })
      )
    })

    it('should pass locality filter to countProperties', async () => {
      req.query = { locality: 'Madhapur' }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(countProperties).toHaveBeenCalledWith(
        expect.objectContaining({
          locality: 'Madhapur',
        })
      )
    })

    it('should combine city, state, and locality filters', async () => {
      req.query = { city: 'Hyderabad', state: 'Telangana', locality: 'Madhapur' }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(searchProperties).toHaveBeenCalledWith(
        expect.objectContaining({
          city: 'Hyderabad',
          state: 'Telangana',
          locality: 'Madhapur',
        })
      )
    })
  })

  describe('General Location Filtering', () => {
    it('should filter by general location', async () => {
      req.query = { location: 'Hyderabad' }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(searchProperties).toHaveBeenCalledWith(
        expect.objectContaining({
          location: 'Hyderabad',
        })
      )
    })

    it('should pass location filter to countProperties', async () => {
      req.query = { location: 'Hyderabad' }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(countProperties).toHaveBeenCalledWith(
        expect.objectContaining({
          location: 'Hyderabad',
        })
      )
    })

    it('should handle location with partial address', async () => {
      req.query = { location: 'Main St' }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(searchProperties).toHaveBeenCalledWith(
        expect.objectContaining({
          location: 'Main St',
        })
      )
    })
  })

  describe('Price Range Filtering', () => {
    it('should filter by minimum price', async () => {
      req.query = { minPrice: '1000000' }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(searchProperties).toHaveBeenCalledWith(
        expect.objectContaining({
          minPrice: 1000000,
        })
      )
    })

    it('should filter by maximum price', async () => {
      req.query = { maxPrice: '5000000' }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(searchProperties).toHaveBeenCalledWith(
        expect.objectContaining({
          maxPrice: 5000000,
        })
      )
    })

    it('should filter by price range', async () => {
      req.query = { minPrice: '1000000', maxPrice: '5000000' }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(searchProperties).toHaveBeenCalledWith(
        expect.objectContaining({
          minPrice: 1000000,
          maxPrice: 5000000,
        })
      )
    })

    it('should parse price strings to floats', async () => {
      req.query = { minPrice: '1500000.50', maxPrice: '7500000.75' }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(searchProperties).toHaveBeenCalledWith(
        expect.objectContaining({
          minPrice: 1500000.5,
          maxPrice: 7500000.75,
        })
      )
    })

    it('should handle invalid minPrice gracefully', async () => {
      req.query = { minPrice: 'invalid' }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(searchProperties).toHaveBeenCalledWith(
        expect.objectContaining({
          minPrice: NaN,
        })
      )
    })

    it('should handle invalid maxPrice gracefully', async () => {
      req.query = { maxPrice: 'invalid' }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(searchProperties).toHaveBeenCalledWith(
        expect.objectContaining({
          maxPrice: NaN,
        })
      )
    })
  })

  describe('Property Type Filtering', () => {
    it('should filter by CONDO property type', async () => {
      req.query = { propertyType: 'CONDO' }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(searchProperties).toHaveBeenCalledWith(
        expect.objectContaining({
          propertyType: 'CONDO' as PropertyType,
        })
      )
    })

    it('should filter by SINGLE_FAMILY property type', async () => {
      req.query = { propertyType: 'SINGLE_FAMILY' }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(searchProperties).toHaveBeenCalledWith(
        expect.objectContaining({
          propertyType: 'SINGLE_FAMILY' as PropertyType,
        })
      )
    })

    it('should filter by TOWNHOUSE property type', async () => {
      req.query = { propertyType: 'TOWNHOUSE' }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(searchProperties).toHaveBeenCalledWith(
        expect.objectContaining({
          propertyType: 'TOWNHOUSE' as PropertyType,
        })
      )
    })

    it('should filter by LAND property type', async () => {
      req.query = { propertyType: 'LAND' }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(searchProperties).toHaveBeenCalledWith(
        expect.objectContaining({
          propertyType: 'LAND' as PropertyType,
        })
      )
    })

    it('should filter by COMMERCIAL property type', async () => {
      req.query = { propertyType: 'COMMERCIAL' }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(searchProperties).toHaveBeenCalledWith(
        expect.objectContaining({
          propertyType: 'COMMERCIAL' as PropertyType,
        })
      )
    })
  })

  describe('Bedrooms Filtering', () => {
    it('should filter by bedrooms count', async () => {
      req.query = { bedrooms: '3' }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(searchProperties).toHaveBeenCalledWith(
        expect.objectContaining({
          bedrooms: 3,
        })
      )
    })

    it('should parse bedrooms as integer', async () => {
      req.query = { bedrooms: '4' }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(searchProperties).toHaveBeenCalledWith(
        expect.objectContaining({
          bedrooms: 4,
        })
      )
    })

    it('should handle string bedrooms value', async () => {
      req.query = { bedrooms: '5' }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(searchProperties).toHaveBeenCalledWith(
        expect.objectContaining({
          bedrooms: 5,
        })
      )
    })

    it('should handle invalid bedrooms gracefully', async () => {
      req.query = { bedrooms: 'invalid' }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(searchProperties).toHaveBeenCalledWith(
        expect.objectContaining({
          bedrooms: NaN,
        })
      )
    })
  })

  describe('Bathrooms Filtering', () => {
    it('should filter by bathrooms count', async () => {
      req.query = { bathrooms: '2' }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(searchProperties).toHaveBeenCalledWith(
        expect.objectContaining({
          bathrooms: 2,
        })
      )
    })

    it('should parse bathrooms as float', async () => {
      req.query = { bathrooms: '2.5' }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(searchProperties).toHaveBeenCalledWith(
        expect.objectContaining({
          bathrooms: 2.5,
        })
      )
    })

    it('should handle integer bathrooms', async () => {
      req.query = { bathrooms: '3' }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(searchProperties).toHaveBeenCalledWith(
        expect.objectContaining({
          bathrooms: 3,
        })
      )
    })

    it('should handle invalid bathrooms gracefully', async () => {
      req.query = { bathrooms: 'invalid' }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(searchProperties).toHaveBeenCalledWith(
        expect.objectContaining({
          bathrooms: NaN,
        })
      )
    })

    it('should combine bedrooms and bathrooms filters', async () => {
      req.query = { bedrooms: '4', bathrooms: '3' }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(searchProperties).toHaveBeenCalledWith(
        expect.objectContaining({
          bedrooms: 4,
          bathrooms: 3,
        })
      )
    })
  })

  describe('Pagination', () => {
    it('should use default page 1', async () => {
      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(searchProperties).toHaveBeenCalledWith(
        expect.objectContaining({
          offset: 0,
        })
      )
    })

    it('should use default limit 20', async () => {
      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(searchProperties).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 20,
        })
      )
    })

    it('should handle custom page parameter', async () => {
      req.query = { page: '2' }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(searchProperties).toHaveBeenCalledWith(
        expect.objectContaining({
          offset: 20,
        })
      )
    })

    it('should handle custom limit parameter', async () => {
      req.query = { limit: '10' }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(searchProperties).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 10,
        })
      )
    })

    it('should calculate correct offset with custom page and limit', async () => {
      req.query = { page: '3', limit: '15' }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(searchProperties).toHaveBeenCalledWith(
        expect.objectContaining({
          offset: 30,
          limit: 15,
        })
      )
    })

    it('should cap limit at 50', async () => {
      req.query = { limit: '100' }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(searchProperties).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 50,
        })
      )
    })

    it('should enforce minimum page of 1', async () => {
      req.query = { page: '0' }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(searchProperties).toHaveBeenCalledWith(
        expect.objectContaining({
          offset: 0,
        })
      )
    })

    it('should enforce minimum page for negative values', async () => {
      req.query = { page: '-5' }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(searchProperties).toHaveBeenCalledWith(
        expect.objectContaining({
          offset: 0,
        })
      )
    })

    it('should enforce minimum limit of 1', async () => {
      req.query = { limit: '0' }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(searchProperties).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 1,
        })
      )
    })

    it('should enforce minimum limit for negative values', async () => {
      req.query = { limit: '-10' }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(searchProperties).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 1,
        })
      )
    })

    it('should handle invalid page parameter', async () => {
      req.query = { page: 'invalid' }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(searchProperties).toHaveBeenCalledWith(
        expect.objectContaining({
          offset: 0,
        })
      )
    })

    it('should handle invalid limit parameter', async () => {
      req.query = { limit: 'invalid' }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(searchProperties).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 20,
        })
      )
    })
  })

  describe('Pagination Metadata', () => {
    it('should calculate correct total pages', async () => {
      ;(countProperties as jest.Mock).mockResolvedValue(45)
      req.query = { limit: '20' }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          pagination: expect.objectContaining({
            totalPages: 3,
          }),
        })
      )
    })

    it('should set hasMore to true when more pages exist', async () => {
      ;(countProperties as jest.Mock).mockResolvedValue(50)
      req.query = { page: '1', limit: '20' }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          pagination: expect.objectContaining({
            hasMore: true,
          }),
        })
      )
    })

    it('should set hasMore to false on last page', async () => {
      ;(countProperties as jest.Mock).mockResolvedValue(20)
      req.query = { page: '1', limit: '20' }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          pagination: expect.objectContaining({
            hasMore: false,
          }),
        })
      )
    })

    it('should include current page in metadata', async () => {
      req.query = { page: '2' }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          pagination: expect.objectContaining({
            page: 2,
          }),
        })
      )
    })

    it('should include total count in metadata', async () => {
      ;(countProperties as jest.Mock).mockResolvedValue(100)

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          pagination: expect.objectContaining({
            total: 100,
          }),
        })
      )
    })
  })

  describe('Combined Filters', () => {
    it('should combine all filter types', async () => {
      req.query = {
        city: 'Hyderabad',
        state: 'Telangana',
        locality: 'Madhapur',
        minPrice: '2000000',
        maxPrice: '8000000',
        propertyType: 'CONDO',
        bedrooms: '3',
        bathrooms: '2',
        page: '2',
        limit: '15',
      }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(searchProperties).toHaveBeenCalledWith({
        city: 'Hyderabad',
        state: 'Telangana',
        locality: 'Madhapur',
        minPrice: 2000000,
        maxPrice: 8000000,
        propertyType: 'CONDO' as PropertyType,
        bedrooms: 3,
        bathrooms: 2,
        limit: 15,
        offset: 15,
      })
    })

    it('should pass all filters to countProperties', async () => {
      req.query = {
        city: 'Hyderabad',
        minPrice: '2000000',
        propertyType: 'CONDO',
      }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(countProperties).toHaveBeenCalledWith({
        city: 'Hyderabad',
        minPrice: 2000000,
        propertyType: 'CONDO' as PropertyType,
      })
    })
  })

  describe('API Metrics Logging', () => {
    it('should log API metrics on success', async () => {
      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(logAPIMetrics).toHaveBeenCalledWith('/api/properties/search', expect.any(Number))
    })

    it('should log API metrics with elapsed time', async () => {
      const startTime = Date.now()

      await handler(req as NextApiRequest, res as NextApiResponse)

      const loggedTime = (logAPIMetrics as jest.Mock).mock.calls[0][1]
      expect(loggedTime).toBeGreaterThanOrEqual(startTime)
    })

    it('should log error metrics on failure', async () => {
      ;(searchProperties as jest.Mock).mockRejectedValue(new Error('Database error'))

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(logAPIMetrics).toHaveBeenCalledWith(
        '/api/properties/search (ERROR)',
        expect.any(Number)
      )
    })
  })

  describe('Error Handling', () => {
    it('should return 500 when searchProperties fails', async () => {
      ;(searchProperties as jest.Mock).mockRejectedValue(new Error('Database error'))

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(500)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Internal server error' })
    })

    it('should return 500 when countProperties fails', async () => {
      ;(countProperties as jest.Mock).mockRejectedValue(new Error('Database error'))

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(500)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Internal server error' })
    })

    it('should handle both queries failing', async () => {
      ;(searchProperties as jest.Mock).mockRejectedValue(new Error('Error 1'))
      ;(countProperties as jest.Mock).mockRejectedValue(new Error('Error 2'))

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(500)
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Internal server error' })
    })

    it('should log errors to console', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
      ;(searchProperties as jest.Mock).mockRejectedValue(new Error('Test error'))

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Property search error:',
        expect.any(Error)
      )
      consoleErrorSpy.mockRestore()
    })

    it('should handle unexpected errors gracefully', async () => {
      ;(searchProperties as jest.Mock).mockRejectedValue('Unexpected error')

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(statusMock).toHaveBeenCalledWith(500)
    })
  })

  describe('Response Format', () => {
    it('should return properties array in response', async () => {
      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          properties: expect.any(Array),
        })
      )
    })

    it('should return pagination object in response', async () => {
      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          pagination: expect.objectContaining({
            page: expect.any(Number),
            limit: expect.any(Number),
            total: expect.any(Number),
            totalPages: expect.any(Number),
            hasMore: expect.any(Boolean),
          }),
        })
      )
    })

    it('should return actual properties data', async () => {
      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          properties: mockProperties,
        })
      )
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty query parameters', async () => {
      req.query = {}

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(searchProperties).toHaveBeenCalledWith({
        limit: 20,
        offset: 0,
      })
    })

    it('should handle undefined query values', async () => {
      req.query = { city: undefined, state: undefined }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(searchProperties).toHaveBeenCalledWith({
        limit: 20,
        offset: 0,
      })
    })

    it('should handle empty string query values', async () => {
      req.query = { city: '', state: '' }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(searchProperties).toHaveBeenCalledWith({
        limit: 20,
        offset: 0,
      })
    })

    it('should handle very large page numbers', async () => {
      req.query = { page: '1000000' }

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(searchProperties).toHaveBeenCalledWith(
        expect.objectContaining({
          offset: 19999980,
        })
      )
    })

    it('should handle zero total count', async () => {
      ;(countProperties as jest.Mock).mockResolvedValue(0)

      await handler(req as NextApiRequest, res as NextApiResponse)

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          pagination: expect.objectContaining({
            totalPages: 0,
            hasMore: false,
          }),
        })
      )
    })
  })
})
