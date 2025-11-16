import {
  geocodeAddress,
  parsePlaceResult,
  normalizeLocationString,
  GeocodeResult,
} from '@/lib/utils/geocoding'

global.fetch = jest.fn()

describe('lib/utils/geocoding', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  })

  describe('geocodeAddress', () => {
    it('should return null if API key is not set', async () => {
      delete process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

      const result = await geocodeAddress('123 Main St')

      expect(result).toBeNull()
      expect(fetch).not.toHaveBeenCalled()
    })

    it('should successfully geocode an address', async () => {
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = 'test-api-key'

      const mockResponse = {
        status: 'OK',
        results: [
          {
            formatted_address: '123 Main St, Hyderabad, Telangana, India',
            geometry: {
              location: { lat: 17.385, lng: 78.4867 },
            },
            address_components: [
              { long_name: 'Madhapur', types: ['neighborhood'] },
              { long_name: 'Madhapur', types: ['locality'] },
              { long_name: 'Hyderabad', types: ['administrative_area_level_2'] },
              { long_name: 'Telangana', types: ['administrative_area_level_1'] },
              { long_name: 'India', types: ['country'] },
              { long_name: '500081', types: ['postal_code'] },
            ],
          },
        ],
      }

      ;(fetch as jest.Mock).mockResolvedValue({
        json: () => Promise.resolve(mockResponse),
      })

      const result = await geocodeAddress('123 Main St, Hyderabad')

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('maps.googleapis.com/maps/api/geocode/json')
      )
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('test-api-key'))
      expect(result).toEqual({
        latitude: 17.385,
        longitude: 78.4867,
        formattedAddress: '123 Main St, Hyderabad, Telangana, India',
        neighborhood: 'Madhapur',
        locality: 'Madhapur',
        city: 'Hyderabad',
        state: 'Telangana',
        country: 'India',
        zipcode: '500081',
      })
    })

    it('should handle address with sublocality levels', async () => {
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = 'test-api-key'

      const mockResponse = {
        status: 'OK',
        results: [
          {
            formatted_address: 'Test Address',
            geometry: {
              location: { lat: 17.385, lng: 78.4867 },
            },
            address_components: [
              { long_name: 'Sublocality 1', types: ['sublocality_level_1'] },
              { long_name: 'Sublocality 2', types: ['sublocality_level_2'] },
              { long_name: 'City', types: ['locality'] },
              { long_name: 'State', types: ['administrative_area_level_1'] },
              { long_name: 'Country', types: ['country'] },
            ],
          },
        ],
      }

      ;(fetch as jest.Mock).mockResolvedValue({
        json: () => Promise.resolve(mockResponse),
      })

      const result = await geocodeAddress('Test Address')

      expect(result?.neighborhood).toBe('Sublocality 1')
    })

    it('should return null if geocoding fails', async () => {
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = 'test-api-key'

      const mockResponse = {
        status: 'ZERO_RESULTS',
        results: [],
      }

      ;(fetch as jest.Mock).mockResolvedValue({
        json: () => Promise.resolve(mockResponse),
      })

      const result = await geocodeAddress('Invalid Address')

      expect(result).toBeNull()
    })

    it('should return null if no results are returned', async () => {
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = 'test-api-key'

      const mockResponse = {
        status: 'OK',
        results: [],
      }

      ;(fetch as jest.Mock).mockResolvedValue({
        json: () => Promise.resolve(mockResponse),
      })

      const result = await geocodeAddress('No results address')

      expect(result).toBeNull()
    })

    it('should return null on network error', async () => {
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = 'test-api-key'
      ;(fetch as jest.Mock).mockRejectedValue(new Error('Network error'))

      const result = await geocodeAddress('123 Main St')

      expect(result).toBeNull()
    })

    it('should URL encode the address', async () => {
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = 'test-api-key'

      const mockResponse = {
        status: 'ZERO_RESULTS',
        results: [],
      }

      ;(fetch as jest.Mock).mockResolvedValue({
        json: () => Promise.resolve(mockResponse),
      })

      await geocodeAddress('Address with spaces & special chars!')

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining(encodeURIComponent('Address with spaces & special chars!'))
      )
    })

    it('should handle missing address components gracefully', async () => {
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = 'test-api-key'

      const mockResponse = {
        status: 'OK',
        results: [
          {
            formatted_address: 'Minimal Address',
            geometry: {
              location: { lat: 17.385, lng: 78.4867 },
            },
            address_components: [{ long_name: 'City', types: ['locality'] }],
          },
        ],
      }

      ;(fetch as jest.Mock).mockResolvedValue({
        json: () => Promise.resolve(mockResponse),
      })

      const result = await geocodeAddress('Minimal Address')

      expect(result?.city).toBe('City')
      expect(result?.state).toBe('')
      expect(result?.country).toBe('')
      expect(result?.neighborhood).toBe('')
    })
  })

  describe('parsePlaceResult', () => {
    it('should parse a Google Maps place object with function-based location', () => {
      const place = {
        formatted_address: '123 Main St, Hyderabad',
        geometry: {
          location: {
            lat: () => 17.385,
            lng: () => 78.4867,
          },
        },
        address_components: [
          { long_name: 'Madhapur', types: ['neighborhood'] },
          { long_name: 'Hyderabad', types: ['locality'] },
          { long_name: 'Telangana', types: ['administrative_area_level_1'] },
          { long_name: 'India', types: ['country'] },
          { long_name: '500081', types: ['postal_code'] },
        ],
      }

      const result = parsePlaceResult(place)

      expect(result).toEqual({
        latitude: 17.385,
        longitude: 78.4867,
        formattedAddress: '123 Main St, Hyderabad',
        neighborhood: 'Madhapur',
        locality: 'Hyderabad',
        city: 'Hyderabad',
        state: 'Telangana',
        country: 'India',
        zipcode: '500081',
      })
    })

    it('should parse a place object with property-based location', () => {
      const place = {
        formatted_address: '456 Test St',
        geometry: {
          location: {
            lat: 17.385,
            lng: 78.4867,
          },
        },
        address_components: [
          { long_name: 'City', types: ['locality'] },
          { long_name: 'State', types: ['administrative_area_level_1'] },
        ],
      }

      const result = parsePlaceResult(place)

      expect(result.latitude).toBe(17.385)
      expect(result.longitude).toBe(78.4867)
    })

    it('should return empty object if no geometry', () => {
      const place = {
        formatted_address: 'No geometry',
        address_components: [],
      }

      const result = parsePlaceResult(place)

      expect(result).toEqual({})
    })

    it('should return empty object if no location', () => {
      const place = {
        formatted_address: 'No location',
        geometry: {},
        address_components: [],
      }

      const result = parsePlaceResult(place)

      expect(result).toEqual({})
    })

    it('should handle missing address components', () => {
      const place = {
        formatted_address: 'Test',
        geometry: {
          location: { lat: 17.385, lng: 78.4867 },
        },
      }

      const result = parsePlaceResult(place)

      expect(result.formattedAddress).toBe('Test')
      expect(result.neighborhood).toBe('')
      expect(result.city).toBe('')
    })

    it('should prioritize sublocality_level_1 over level_2', () => {
      const place = {
        geometry: {
          location: { lat: 17.385, lng: 78.4867 },
        },
        address_components: [
          { long_name: 'Level 1', types: ['sublocality_level_1'] },
          { long_name: 'Level 2', types: ['sublocality_level_2'] },
        ],
      }

      const result = parsePlaceResult(place)

      expect(result.neighborhood).toBe('Level 1')
    })

    it('should use administrative_area_level_2 if no locality for city', () => {
      const place = {
        geometry: {
          location: { lat: 17.385, lng: 78.4867 },
        },
        address_components: [{ long_name: 'District', types: ['administrative_area_level_2'] }],
      }

      const result = parsePlaceResult(place)

      expect(result.city).toBe('District')
    })
  })

  describe('normalizeLocationString', () => {
    it('should create location string with all components', () => {
      const components: Partial<GeocodeResult> = {
        neighborhood: 'Madhapur',
        locality: 'Kondapur',
        city: 'Hyderabad',
        state: 'Telangana',
        zipcode: '500081',
        latitude: 0,
        longitude: 0,
        formattedAddress: '',
        country: '',
      }

      const result = normalizeLocationString(components)

      expect(result).toBe('Madhapur, Kondapur, Hyderabad, Telangana, 500081')
    })

    it('should skip duplicate locality if same as neighborhood', () => {
      const components: Partial<GeocodeResult> = {
        neighborhood: 'Madhapur',
        locality: 'Madhapur',
        city: 'Hyderabad',
        state: 'Telangana',
        latitude: 0,
        longitude: 0,
        formattedAddress: '',
        country: '',
      }

      const result = normalizeLocationString(components)

      expect(result).toBe('Madhapur, Hyderabad, Telangana')
    })

    it('should skip duplicate city if same as locality', () => {
      const components: Partial<GeocodeResult> = {
        locality: 'Hyderabad',
        city: 'Hyderabad',
        state: 'Telangana',
        latitude: 0,
        longitude: 0,
        formattedAddress: '',
        country: '',
      }

      const result = normalizeLocationString(components)

      expect(result).toBe('Hyderabad, Telangana')
    })

    it('should handle minimal components', () => {
      const components: Partial<GeocodeResult> = {
        city: 'Hyderabad',
        latitude: 0,
        longitude: 0,
        formattedAddress: '',
        country: '',
      }

      const result = normalizeLocationString(components)

      expect(result).toBe('Hyderabad')
    })

    it('should return empty string for no components', () => {
      const components: Partial<GeocodeResult> = {
        latitude: 0,
        longitude: 0,
        formattedAddress: '',
        country: '',
      }

      const result = normalizeLocationString(components)

      expect(result).toBe('')
    })

    it('should handle only state and zipcode', () => {
      const components: Partial<GeocodeResult> = {
        state: 'Telangana',
        zipcode: '500081',
        latitude: 0,
        longitude: 0,
        formattedAddress: '',
        country: '',
      }

      const result = normalizeLocationString(components)

      expect(result).toBe('Telangana, 500081')
    })

    it('should preserve order: neighborhood, locality, city, state, zipcode', () => {
      const components: Partial<GeocodeResult> = {
        zipcode: '500081',
        state: 'Telangana',
        city: 'Hyderabad',
        locality: 'Kondapur',
        neighborhood: 'Madhapur',
        latitude: 0,
        longitude: 0,
        formattedAddress: '',
        country: '',
      }

      const result = normalizeLocationString(components)

      const parts = result.split(', ')
      expect(parts[0]).toBe('Madhapur')
      expect(parts[1]).toBe('Kondapur')
      expect(parts[2]).toBe('Hyderabad')
      expect(parts[3]).toBe('Telangana')
      expect(parts[4]).toBe('500081')
    })

    it('should handle undefined properties', () => {
      const components: Partial<GeocodeResult> = {
        city: 'Hyderabad',
      }

      const result = normalizeLocationString(components)

      expect(result).toBe('Hyderabad')
    })
  })
})
