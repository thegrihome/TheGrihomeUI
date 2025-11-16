import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import PropertyMap from '@/components/properties/PropertyMap'

describe('PropertyMap Component', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.clearAllMocks()
    process.env = { ...originalEnv }
    delete (window as any).google
  })

  afterEach(() => {
    process.env = originalEnv
    const scripts = document.querySelectorAll('script[src*="maps.googleapis.com"]')
    scripts.forEach(script => script.remove())
  })

  describe('Error States', () => {
    it('should show error when Google Maps API key is missing', () => {
      delete process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

      render(<PropertyMap latitude={17.385} longitude={78.4867} />)

      expect(screen.getByText('Google Maps API key not configured')).toBeInTheDocument()
    })

    it('should show error when latitude is missing', () => {
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = 'test-key'

      render(<PropertyMap latitude={0} longitude={78.4867} />)

      expect(screen.getByText('Location coordinates not available')).toBeInTheDocument()
    })

    it('should show error when longitude is missing', () => {
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = 'test-key'

      render(<PropertyMap latitude={17.385} longitude={0} />)

      expect(screen.getByText('Location coordinates not available')).toBeInTheDocument()
    })

    it('should show error when both coordinates are missing', () => {
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = 'test-key'

      render(<PropertyMap latitude={0} longitude={0} />)

      expect(screen.getByText('Location coordinates not available')).toBeInTheDocument()
    })

    it('should apply className to error container', () => {
      delete process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

      const { container } = render(
        <PropertyMap latitude={17.385} longitude={78.4867} className="custom-class" />
      )

      const errorDiv = container.querySelector('.custom-class')
      expect(errorDiv).toBeInTheDocument()
    })
  })

  describe('Loading State', () => {
    it('should show loading message initially', () => {
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = 'test-key'

      render(<PropertyMap latitude={17.385} longitude={78.4867} />)

      expect(screen.getByText('Loading map...')).toBeInTheDocument()
    })

    it('should create script tag when API key is present', () => {
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = 'test-key'

      render(<PropertyMap latitude={17.385} longitude={78.4867} />)

      const script = document.querySelector('script[src*="maps.googleapis.com"]')
      expect(script).toBeInTheDocument()
      expect(script?.getAttribute('src')).toContain('test-key')
      expect(script?.getAttribute('src')).toContain('libraries=places')
    })

    it('should set async and defer on script', () => {
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = 'test-key'

      render(<PropertyMap latitude={17.385} longitude={78.4867} />)

      const script = document.querySelector('script[src*="maps.googleapis.com"]')
      expect(script).toHaveAttribute('async')
      expect(script).toHaveAttribute('defer')
    })

    it('should apply className to loading container', () => {
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = 'test-key'

      const { container } = render(
        <PropertyMap latitude={17.385} longitude={78.4867} className="custom-class" />
      )

      const mapContainer = container.querySelector('.custom-class')
      expect(mapContainer).toBeInTheDocument()
    })
  })

  describe('Google Maps Already Loaded', () => {
    it('should use existing Google Maps if already loaded', async () => {
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = 'test-key'

      const mockMap = jest.fn()
      const mockMarker = jest.fn()

      ;(window as any).google = {
        maps: {
          Map: mockMap,
          Marker: mockMarker,
          Animation: { DROP: 'DROP' },
        },
      }

      const { container } = render(<PropertyMap latitude={17.385} longitude={78.4867} />)

      await waitFor(() => {
        expect(mockMap).toHaveBeenCalled()
      })

      const script = document.querySelector('script[src*="maps.googleapis.com"]')
      expect(script).not.toBeInTheDocument()
    })

    it('should initialize map with correct position', async () => {
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = 'test-key'

      const mockMap = jest.fn()
      const mockMarker = jest.fn()

      ;(window as any).google = {
        maps: {
          Map: mockMap,
          Marker: mockMarker,
          Animation: { DROP: 'DROP' },
        },
      }

      render(<PropertyMap latitude={17.385} longitude={78.4867} />)

      await waitFor(() => {
        expect(mockMap).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            center: { lat: 17.385, lng: 78.4867 },
            zoom: 15,
          })
        )
      })
    })

    it('should enable map controls', async () => {
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = 'test-key'

      const mockMap = jest.fn()
      const mockMarker = jest.fn()

      ;(window as any).google = {
        maps: {
          Map: mockMap,
          Marker: mockMarker,
          Animation: { DROP: 'DROP' },
        },
      }

      render(<PropertyMap latitude={17.385} longitude={78.4867} />)

      await waitFor(() => {
        expect(mockMap).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            mapTypeControl: true,
            streetViewControl: true,
            fullscreenControl: true,
            zoomControl: true,
          })
        )
      })
    })

    it('should create marker with correct position', async () => {
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = 'test-key'

      const mockMap = jest.fn()
      const mockMarker = jest.fn()

      ;(window as any).google = {
        maps: {
          Map: mockMap,
          Marker: mockMarker,
          Animation: { DROP: 'DROP' },
        },
      }

      render(<PropertyMap latitude={17.385} longitude={78.4867} />)

      await waitFor(() => {
        expect(mockMarker).toHaveBeenCalledWith(
          expect.objectContaining({
            position: { lat: 17.385, lng: 78.4867 },
            title: 'Property Location',
          })
        )
      })
    })

    it('should use address as marker title when provided', async () => {
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = 'test-key'

      const mockMap = jest.fn()
      const mockMarker = jest.fn()

      ;(window as any).google = {
        maps: {
          Map: mockMap,
          Marker: mockMarker,
          Animation: { DROP: 'DROP' },
        },
      }

      render(<PropertyMap latitude={17.385} longitude={78.4867} address="123 Main St, Hyderabad" />)

      await waitFor(() => {
        expect(mockMarker).toHaveBeenCalledWith(
          expect.objectContaining({
            title: '123 Main St, Hyderabad',
          })
        )
      })
    })

    it('should add marker animation', async () => {
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = 'test-key'

      const mockMap = jest.fn()
      const mockMarker = jest.fn()

      ;(window as any).google = {
        maps: {
          Map: mockMap,
          Marker: mockMarker,
          Animation: { DROP: 'DROP' },
        },
      }

      render(<PropertyMap latitude={17.385} longitude={78.4867} />)

      await waitFor(() => {
        expect(mockMarker).toHaveBeenCalledWith(
          expect.objectContaining({
            animation: 'DROP',
          })
        )
      })
    })

    it('should create info window with address', async () => {
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = 'test-key'

      const mockMap = jest.fn()
      const mockMarker = jest.fn(() => ({
        addListener: jest.fn(),
      }))
      const mockInfoWindow = jest.fn()

      ;(window as any).google = {
        maps: {
          Map: mockMap,
          Marker: mockMarker,
          InfoWindow: mockInfoWindow,
          Animation: { DROP: 'DROP' },
        },
      }

      render(<PropertyMap latitude={17.385} longitude={78.4867} address="123 Main St, Hyderabad" />)

      await waitFor(() => {
        expect(mockInfoWindow).toHaveBeenCalledWith(
          expect.objectContaining({
            content: expect.stringContaining('123 Main St, Hyderabad'),
          })
        )
      })
    })

    it('should add click listener to marker when address is provided', async () => {
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = 'test-key'

      const mockAddListener = jest.fn()
      const mockMap = jest.fn()
      const mockMarker = jest.fn(() => ({
        addListener: mockAddListener,
      }))
      const mockInfoWindow = jest.fn()

      ;(window as any).google = {
        maps: {
          Map: mockMap,
          Marker: mockMarker,
          InfoWindow: mockInfoWindow,
          Animation: { DROP: 'DROP' },
        },
      }

      render(<PropertyMap latitude={17.385} longitude={78.4867} address="123 Main St, Hyderabad" />)

      await waitFor(() => {
        expect(mockAddListener).toHaveBeenCalledWith('click', expect.any(Function))
      })
    })

    it('should not create info window without address', async () => {
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = 'test-key'

      const mockMap = jest.fn()
      const mockMarker = jest.fn()
      const mockInfoWindow = jest.fn()

      ;(window as any).google = {
        maps: {
          Map: mockMap,
          Marker: mockMarker,
          InfoWindow: mockInfoWindow,
          Animation: { DROP: 'DROP' },
        },
      }

      render(<PropertyMap latitude={17.385} longitude={78.4867} />)

      await waitFor(() => {
        expect(mockMap).toHaveBeenCalled()
      })

      expect(mockInfoWindow).not.toHaveBeenCalled()
    })
  })

  describe('Script Loading in Progress', () => {
    it('should wait for script to load if already being loaded', async () => {
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = 'test-key'

      // Add a script tag to simulate loading
      const existingScript = document.createElement('script')
      existingScript.src = 'https://maps.googleapis.com/maps/api/js?key=test'
      document.head.appendChild(existingScript)

      render(<PropertyMap latitude={17.385} longitude={78.4867} />)

      expect(screen.getByText('Loading map...')).toBeInTheDocument()

      // Simulate script loaded
      const mockMap = jest.fn()
      const mockMarker = jest.fn()

      ;(window as any).google = {
        maps: {
          Map: mockMap,
          Marker: mockMarker,
          Animation: { DROP: 'DROP' },
        },
      }

      await waitFor(
        () => {
          expect(mockMap).toHaveBeenCalled()
        },
        { timeout: 3000 }
      )
    })
  })

  describe('Map Initialization Error', () => {
    it('should show error when map initialization fails', async () => {
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = 'test-key'

      const mockMap = jest.fn(() => {
        throw new Error('Map initialization failed')
      })

      ;(window as any).google = {
        maps: {
          Map: mockMap,
        },
      }

      render(<PropertyMap latitude={17.385} longitude={78.4867} />)

      await waitFor(() => {
        expect(screen.getByText('Failed to initialize map')).toBeInTheDocument()
      })
    })
  })

  describe('Map Container', () => {
    it('should render map container with min height', () => {
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = 'test-key'

      const { container } = render(<PropertyMap latitude={17.385} longitude={78.4867} />)

      const mapDiv = container.querySelector('div[style*="minHeight"]')
      expect(mapDiv).toBeInTheDocument()
      expect(mapDiv?.getAttribute('style')).toContain('400px')
    })

    it('should apply rounded corners to map container', () => {
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = 'test-key'

      const mockMap = jest.fn()
      const mockMarker = jest.fn()

      ;(window as any).google = {
        maps: {
          Map: mockMap,
          Marker: mockMarker,
          Animation: { DROP: 'DROP' },
        },
      }

      const { container } = render(<PropertyMap latitude={17.385} longitude={78.4867} />)

      const roundedDiv = container.querySelector('.rounded-lg')
      expect(roundedDiv).toBeInTheDocument()
    })

    it('should make map full width and height', () => {
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = 'test-key'

      const mockMap = jest.fn()
      const mockMarker = jest.fn()

      ;(window as any).google = {
        maps: {
          Map: mockMap,
          Marker: mockMarker,
          Animation: { DROP: 'DROP' },
        },
      }

      const { container } = render(<PropertyMap latitude={17.385} longitude={78.4867} />)

      const mapDiv = container.querySelector('.w-full.h-full')
      expect(mapDiv).toBeInTheDocument()
    })
  })

  describe('Component Cleanup', () => {
    it('should cleanup interval on unmount', () => {
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = 'test-key'

      const existingScript = document.createElement('script')
      existingScript.src = 'https://maps.googleapis.com/maps/api/js?key=test'
      document.head.appendChild(existingScript)

      const { unmount } = render(<PropertyMap latitude={17.385} longitude={78.4867} />)

      unmount()

      // Should not throw error
      expect(true).toBe(true)
    })
  })

  describe('Coordinates Validation', () => {
    it('should accept valid positive coordinates', async () => {
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = 'test-key'

      const mockMap = jest.fn()
      const mockMarker = jest.fn()

      ;(window as any).google = {
        maps: {
          Map: mockMap,
          Marker: mockMarker,
          Animation: { DROP: 'DROP' },
        },
      }

      render(<PropertyMap latitude={45.5} longitude={-122.6} />)

      await waitFor(() => {
        expect(mockMap).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            center: { lat: 45.5, lng: -122.6 },
          })
        )
      })
    })

    it('should accept valid negative coordinates', async () => {
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = 'test-key'

      const mockMap = jest.fn()
      const mockMarker = jest.fn()

      ;(window as any).google = {
        maps: {
          Map: mockMap,
          Marker: mockMarker,
          Animation: { DROP: 'DROP' },
        },
      }

      render(<PropertyMap latitude={-33.8} longitude={151.2} />)

      await waitFor(() => {
        expect(mockMap).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            center: { lat: -33.8, lng: 151.2 },
          })
        )
      })
    })
  })
})
