import { geocodeAddress, normalizeLocationString } from '@/lib/utils/geocoding'

global.fetch = jest.fn()

describe('Geocoding Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('geocodeAddress', () => {
    it('returns null when API key is missing', async () => {
      const originalEnv = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
      delete process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

      const result = await geocodeAddress('Hyderabad')

      expect(result).toBeNull()

      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = originalEnv
    })

    it('returns null when geocoding fails', async () => {
      const mockResponse = {
        status: 'ZERO_RESULTS',
        results: [],
      }

      ;(global.fetch as jest.Mock).mockResolvedValue({
        json: () => Promise.resolve(mockResponse),
      })

      const result = await geocodeAddress('Invalid Address XYZ 123')

      expect(result).toBeNull()
    })

    it('handles network errors gracefully', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'))

      const result = await geocodeAddress('Hyderabad')

      expect(result).toBeNull()
    })

    it('extracts neighborhood from address components', async () => {
      const mockResponse = {
        status: 'OK',
        results: [
          {
            formatted_address: 'Aditya Nagar, Kukatpally, Hyderabad, Telangana, India',
            geometry: {
              location: {
                lat: 17.4948,
                lng: 78.3991,
              },
            },
            address_components: [
              { long_name: 'Aditya Nagar', types: ['neighborhood', 'political'] },
              {
                long_name: 'Kukatpally',
                types: ['sublocality_level_1', 'sublocality', 'political'],
              },
              { long_name: 'Hyderabad', types: ['locality', 'political'] },
              { long_name: 'Telangana', types: ['administrative_area_level_1', 'political'] },
              { long_name: 'India', types: ['country', 'political'] },
            ],
          },
        ],
      }

      ;(global.fetch as jest.Mock).mockResolvedValue({
        json: () => Promise.resolve(mockResponse),
      })

      const result = await geocodeAddress('Aditya Nagar, Kukatpally')

      expect(result?.neighborhood).toBe('Aditya Nagar')
      expect(result?.locality).toBe('Kukatpally')
    })

    it('calls Google Maps API with correct parameters', async () => {
      const mockResponse = {
        status: 'OK',
        results: [
          {
            formatted_address: 'Test Address',
            geometry: { location: { lat: 0, lng: 0 } },
            address_components: [],
          },
        ],
      }

      ;(global.fetch as jest.Mock).mockResolvedValue({
        json: () => Promise.resolve(mockResponse),
      })

      await geocodeAddress('Test Address')

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('https://maps.googleapis.com/maps/api/geocode/json')
      )
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('address=Test%20Address'))
    })
  })

  describe('normalizeLocationString', () => {
    it('creates normalized location string from components', () => {
      const location = {
        neighborhood: 'Aditya Nagar',
        locality: 'Kukatpally',
        city: 'Hyderabad',
        state: 'Telangana',
        zipcode: '500072',
      }

      const normalized = normalizeLocationString(location)

      expect(normalized).toContain('Aditya Nagar')
      expect(normalized).toContain('Kukatpally')
      expect(normalized).toContain('Hyderabad')
      expect(normalized).toContain('Telangana')
      expect(normalized).toContain('500072')
    })

    it('handles missing components gracefully', () => {
      const location = {
        city: 'Hyderabad',
        state: 'Telangana',
      }

      const normalized = normalizeLocationString(location)

      expect(normalized).toContain('Hyderabad')
      expect(normalized).toContain('Telangana')
      expect(normalized).not.toContain('undefined')
      expect(normalized).not.toContain('null')
    })

    it('creates searchable format', () => {
      const location = {
        locality: 'Kukatpally',
        city: 'Hyderabad',
        zipcode: '500072',
      }

      const normalized = normalizeLocationString(location)

      // Should be searchable by any part
      expect(normalized.toLowerCase()).toContain('kukatpally')
      expect(normalized.toLowerCase()).toContain('hyderabad')
      expect(normalized).toContain('500072')
    })
  })
})
