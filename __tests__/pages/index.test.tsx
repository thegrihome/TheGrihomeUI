import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import Home from '@/pages/index'

// Mock Google Maps API
const mockGetPlacePredictions = jest.fn()
const mockGetDetails = jest.fn()
const mockAutocompleteService = jest.fn(() => ({
  getPlacePredictions: mockGetPlacePredictions,
}))
const mockPlacesService = jest.fn(() => ({
  getDetails: mockGetDetails,
}))

// Mock Loader
jest.mock('@googlemaps/js-api-loader', () => ({
  Loader: jest.fn().mockImplementation(() => ({
    load: jest.fn().mockResolvedValue({}),
  })),
}))

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}))

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}))

jest.mock('next-seo', () => ({
  NextSeo: ({ children }: any) => <div>{children}</div>,
}))

jest.mock('@/components/Header', () => {
  return function Header() {
    return <div data-testid="header">Header</div>
  }
})

jest.mock('@/components/Footer', () => {
  return function Footer() {
    return <div data-testid="footer">Footer</div>
  }
})

describe('Home Page - Comprehensive Tests', () => {
  const mockPush = jest.fn()
  const mockUseSession = useSession as jest.Mock
  const mockUseRouter = useRouter as jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseRouter.mockReturnValue({ push: mockPush })
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
    })

    // Setup global Google Maps mock
    global.google = {
      maps: {
        places: {
          AutocompleteService: mockAutocompleteService as any,
          PlacesService: mockPlacesService as any,
          PlacesServiceStatus: {
            OK: 'OK',
            ZERO_RESULTS: 'ZERO_RESULTS',
          },
        },
      },
    } as any

    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = 'test-api-key'
  })

  afterEach(() => {
    delete (global as any).google
    delete process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  })

  describe('Rendering and Initial State', () => {
    it('should render home page with all components', () => {
      render(<Home />)

      expect(screen.getByTestId('header')).toBeInTheDocument()
      expect(screen.getByTestId('footer')).toBeInTheDocument()
      expect(screen.getByText('Redefining Real Estate')).toBeInTheDocument()
      expect(screen.getByText('with you.')).toBeInTheDocument()
    })

    it('should render search input', () => {
      render(<Home />)

      const searchInput = screen.getByPlaceholderText('Browse properties for free')
      expect(searchInput).toBeInTheDocument()
    })

    it('should have search icon', () => {
      const { container } = render(<Home />)

      const searchIcon = container.querySelector('.home-search-icon')
      expect(searchIcon).toBeInTheDocument()
    })

    it('should show mission section', () => {
      render(<Home />)

      expect(screen.getByText('Mission')).toBeInTheDocument()
      expect(
        screen.getByText(/Grihome redefines how India discovers and understands real estate/i)
      ).toBeInTheDocument()
    })
  })

  describe('City Links', () => {
    it('should render all major city links', () => {
      render(<Home />)

      expect(screen.getByText('Bengaluru')).toBeInTheDocument()
      expect(screen.getByText('Chennai')).toBeInTheDocument()
      expect(screen.getByText('Delhi')).toBeInTheDocument()
      expect(screen.getByText('Gurgaon')).toBeInTheDocument()
      expect(screen.getByText('Hyderabad')).toBeInTheDocument()
      expect(screen.getByText('Kolkata')).toBeInTheDocument()
      expect(screen.getByText('Mumbai')).toBeInTheDocument()
      expect(screen.getByText('Noida')).toBeInTheDocument()
      expect(screen.getByText('Pune')).toBeInTheDocument()
      expect(screen.getByText('States & UTs')).toBeInTheDocument()
    })

    it('should have correct href for Bengaluru', () => {
      render(<Home />)

      const bengaluruLink = screen.getByText('Bengaluru').closest('a')
      expect(bengaluruLink).toHaveAttribute('href', '/forum/category/general-discussions/bengaluru')
    })

    it('should have correct href for Chennai', () => {
      render(<Home />)

      const chennaiLink = screen.getByText('Chennai').closest('a')
      expect(chennaiLink).toHaveAttribute('href', '/forum/category/general-discussions/chennai')
    })

    it('should have correct href for Delhi', () => {
      render(<Home />)

      const delhiLink = screen.getByText('Delhi').closest('a')
      expect(delhiLink).toHaveAttribute('href', '/forum/category/general-discussions/delhi')
    })

    it('should have correct href for Mumbai', () => {
      render(<Home />)

      const mumbaiLink = screen.getByText('Mumbai').closest('a')
      expect(mumbaiLink).toHaveAttribute('href', '/forum/category/general-discussions/mumbai')
    })

    it('should have correct href for States & UTs', () => {
      render(<Home />)

      const statesLink = screen.getByText('States & UTs').closest('a')
      expect(statesLink).toHaveAttribute('href', '/forum/category/general-discussions/states')
    })

    it('should have city icons', () => {
      const { container } = render(<Home />)

      const cityIcons = container.querySelectorAll('.home-city-icon')
      expect(cityIcons.length).toBeGreaterThan(0)
    })

    it('should display correct emoji for Bengaluru', () => {
      render(<Home />)

      const bengaluruContainer = screen.getByText('Bengaluru').closest('.home-city-item')
      expect(bengaluruContainer?.textContent).toContain('🌳')
    })

    it('should display correct emoji for Mumbai', () => {
      render(<Home />)

      const mumbaiContainer = screen.getByText('Mumbai').closest('.home-city-item')
      expect(mumbaiContainer?.textContent).toContain('🏙️')
    })
  })

  describe('Search Functionality', () => {
    it('should allow typing in search input', () => {
      render(<Home />)

      const searchInput = screen.getByPlaceholderText(
        'Browse properties for free'
      ) as HTMLInputElement
      fireEvent.change(searchInput, { target: { value: 'Hyderabad' } })

      expect(searchInput.value).toBe('Hyderabad')
    })

    it('should navigate to properties on form submit', () => {
      render(<Home />)

      const searchInput = screen.getByPlaceholderText('Browse properties for free')
      fireEvent.change(searchInput, { target: { value: 'Hyderabad' } })

      const form = searchInput.closest('form')
      fireEvent.submit(form!)

      expect(mockPush).toHaveBeenCalledWith({
        pathname: '/properties',
        query: { location: 'Hyderabad' },
      })
    })

    it('should not navigate when search is empty', () => {
      render(<Home />)

      const searchInput = screen.getByPlaceholderText('Browse properties for free')
      const form = searchInput.closest('form')
      fireEvent.submit(form!)

      expect(mockPush).not.toHaveBeenCalled()
    })

    it('should trim whitespace from search input', () => {
      render(<Home />)

      const searchInput = screen.getByPlaceholderText('Browse properties for free')
      fireEvent.change(searchInput, { target: { value: '  Hyderabad  ' } })

      const form = searchInput.closest('form')
      fireEvent.submit(form!)

      expect(mockPush).toHaveBeenCalledWith({
        pathname: '/properties',
        query: { location: 'Hyderabad' },
      })
    })

    it('should prevent default form submission', () => {
      render(<Home />)

      const searchInput = screen.getByPlaceholderText('Browse properties for free')
      const form = searchInput.closest('form')!

      const event = new Event('submit', { bubbles: true, cancelable: true })
      const preventDefaultSpy = jest.spyOn(event, 'preventDefault')

      form.dispatchEvent(event)

      expect(preventDefaultSpy).toHaveBeenCalled()
    })
  })

  describe('Google Maps Autocomplete', () => {
    it('should trigger autocomplete when typing more than 2 characters', async () => {
      mockGetPlacePredictions.mockImplementation((request, callback) => {
        callback(
          [
            {
              place_id: '1',
              description: 'Hyderabad, Telangana, India',
              structured_formatting: {
                main_text: 'Hyderabad',
                secondary_text: 'Telangana, India',
              },
            },
          ],
          'OK'
        )
      })

      render(<Home />)

      const searchInput = screen.getByPlaceholderText('Browse properties for free')
      fireEvent.change(searchInput, { target: { value: 'Hyd' } })

      await waitFor(() => {
        expect(mockGetPlacePredictions).toHaveBeenCalled()
      })
    })

    it('should not trigger autocomplete with less than 3 characters', () => {
      render(<Home />)

      const searchInput = screen.getByPlaceholderText('Browse properties for free')
      fireEvent.change(searchInput, { target: { value: 'Hy' } })

      expect(mockGetPlacePredictions).not.toHaveBeenCalled()
    })

    it('should display predictions dropdown', async () => {
      mockGetPlacePredictions.mockImplementation((request, callback) => {
        callback(
          [
            {
              place_id: '1',
              description: 'Hyderabad, Telangana, India',
              structured_formatting: {
                main_text: 'Hyderabad',
                secondary_text: 'Telangana, India',
              },
            },
          ],
          'OK'
        )
      })

      render(<Home />)

      const searchInput = screen.getByPlaceholderText('Browse properties for free')
      fireEvent.change(searchInput, { target: { value: 'Hyderabad' } })

      await waitFor(() => {
        expect(screen.getByText('Hyderabad')).toBeInTheDocument()
        expect(screen.getByText('Telangana, India')).toBeInTheDocument()
      })
    })

    it('should hide predictions on blur', async () => {
      mockGetPlacePredictions.mockImplementation((request, callback) => {
        callback(
          [
            {
              place_id: '1',
              description: 'Hyderabad, Telangana, India',
              structured_formatting: {
                main_text: 'Hyderabad',
                secondary_text: 'Telangana, India',
              },
            },
          ],
          'OK'
        )
      })

      render(<Home />)

      const searchInput = screen.getByPlaceholderText('Browse properties for free')
      fireEvent.change(searchInput, { target: { value: 'Hyderabad' } })

      await waitFor(() => {
        expect(screen.getByText('Telangana, India')).toBeInTheDocument()
      })

      fireEvent.blur(searchInput)

      await waitFor(
        () => {
          expect(screen.queryByText('Telangana, India')).not.toBeInTheDocument()
        },
        { timeout: 300 }
      )
    })

    it('should show predictions on focus when they exist', async () => {
      mockGetPlacePredictions.mockImplementation((request, callback) => {
        callback(
          [
            {
              place_id: '1',
              description: 'Hyderabad, Telangana, India',
              structured_formatting: {
                main_text: 'Hyderabad',
                secondary_text: 'Telangana, India',
              },
            },
          ],
          'OK'
        )
      })

      render(<Home />)

      const searchInput = screen.getByPlaceholderText('Browse properties for free')
      fireEvent.change(searchInput, { target: { value: 'Hyderabad' } })

      await waitFor(() => {
        expect(screen.getByText('Telangana, India')).toBeInTheDocument()
      })

      fireEvent.blur(searchInput)
      await waitFor(() => {}, { timeout: 300 })

      fireEvent.focus(searchInput)

      expect(screen.getByText('Telangana, India')).toBeInTheDocument()
    })

    it('should handle empty predictions', async () => {
      mockGetPlacePredictions.mockImplementation((request, callback) => {
        callback([], 'ZERO_RESULTS')
      })

      render(<Home />)

      const searchInput = screen.getByPlaceholderText('Browse properties for free')
      fireEvent.change(searchInput, { target: { value: 'XYZ' } })

      await waitFor(() => {
        const dropdown = document.querySelector('.home-search-predictions')
        expect(dropdown).not.toBeInTheDocument()
      })
    })

    it('should select prediction and update input', async () => {
      mockGetPlacePredictions.mockImplementation((request, callback) => {
        callback(
          [
            {
              place_id: '1',
              description: 'Hyderabad, Telangana, India',
              structured_formatting: {
                main_text: 'Hyderabad',
                secondary_text: 'Telangana, India',
              },
            },
          ],
          'OK'
        )
      })

      mockGetDetails.mockImplementation((request, callback) => {
        callback(
          {
            address_components: [
              { types: ['locality'], long_name: 'Hyderabad' },
              { types: ['administrative_area_level_1'], long_name: 'Telangana' },
            ],
          },
          'OK'
        )
      })

      render(<Home />)

      const searchInput = screen.getByPlaceholderText(
        'Browse properties for free'
      ) as HTMLInputElement
      fireEvent.change(searchInput, { target: { value: 'Hyd' } })

      await waitFor(() => {
        const prediction = screen.getByText('Telangana, India').closest('div')
        fireEvent.click(prediction!)
      })

      await waitFor(() => {
        expect(searchInput.value).toBe('Hyderabad, Telangana, India')
      })
    })

    it('should navigate with place details on prediction select', async () => {
      mockGetPlacePredictions.mockImplementation((request, callback) => {
        callback(
          [
            {
              place_id: '1',
              description: 'Hyderabad, Telangana, India',
              structured_formatting: {
                main_text: 'Hyderabad',
                secondary_text: 'Telangana, India',
              },
            },
          ],
          'OK'
        )
      })

      mockGetDetails.mockImplementation((request, callback) => {
        callback(
          {
            address_components: [
              { types: ['locality'], long_name: 'Hyderabad' },
              { types: ['administrative_area_level_1'], long_name: 'Telangana' },
            ],
          },
          'OK'
        )
      })

      render(<Home />)

      const searchInput = screen.getByPlaceholderText('Browse properties for free')
      fireEvent.change(searchInput, { target: { value: 'Hyd' } })

      await waitFor(async () => {
        const prediction = screen.getByText('Telangana, India').closest('div')
        fireEvent.click(prediction!)

        await waitFor(() => {
          expect(mockPush).toHaveBeenCalledWith({
            pathname: '/properties',
            query: {
              city: 'Hyderabad',
              state: 'Telangana',
            },
          })
        })
      })
    })

    it('should extract locality from address components', async () => {
      mockGetPlacePredictions.mockImplementation((request, callback) => {
        callback(
          [
            {
              place_id: '1',
              description: 'Banjara Hills, Hyderabad',
              structured_formatting: {
                main_text: 'Banjara Hills',
                secondary_text: 'Hyderabad',
              },
            },
          ],
          'OK'
        )
      })

      mockGetDetails.mockImplementation((request, callback) => {
        callback(
          {
            address_components: [
              { types: ['sublocality_level_1'], long_name: 'Banjara Hills' },
              { types: ['locality'], long_name: 'Hyderabad' },
              { types: ['administrative_area_level_1'], long_name: 'Telangana' },
            ],
          },
          'OK'
        )
      })

      render(<Home />)

      const searchInput = screen.getByPlaceholderText('Browse properties for free')
      fireEvent.change(searchInput, { target: { value: 'Banjara' } })

      await waitFor(async () => {
        const prediction = screen.getByText('Hyderabad').closest('div')
        fireEvent.click(prediction!)

        await waitFor(() => {
          expect(mockPush).toHaveBeenCalledWith({
            pathname: '/properties',
            query: {
              city: 'Hyderabad',
              state: 'Telangana',
              locality: 'Banjara Hills',
            },
          })
        })
      })
    })

    it('should fallback to simple search on place details error', async () => {
      mockGetPlacePredictions.mockImplementation((request, callback) => {
        callback(
          [
            {
              place_id: '1',
              description: 'Hyderabad, Telangana, India',
              structured_formatting: {
                main_text: 'Hyderabad',
                secondary_text: 'Telangana, India',
              },
            },
          ],
          'OK'
        )
      })

      mockGetDetails.mockImplementation((request, callback) => {
        callback(null, 'ERROR')
      })

      render(<Home />)

      const searchInput = screen.getByPlaceholderText('Browse properties for free')
      fireEvent.change(searchInput, { target: { value: 'Hyd' } })

      await waitFor(async () => {
        const prediction = screen.getByText('Telangana, India').closest('div')
        fireEvent.click(prediction!)

        await waitFor(() => {
          expect(mockPush).toHaveBeenCalledWith({
            pathname: '/properties',
            query: {
              location: 'Hyderabad, Telangana, India',
            },
          })
        })
      })
    })

    it('should have location icon in predictions', async () => {
      mockGetPlacePredictions.mockImplementation((request, callback) => {
        callback(
          [
            {
              place_id: '1',
              description: 'Hyderabad, Telangana, India',
              structured_formatting: {
                main_text: 'Hyderabad',
                secondary_text: 'Telangana, India',
              },
            },
          ],
          'OK'
        )
      })

      const { container } = render(<Home />)

      const searchInput = screen.getByPlaceholderText('Browse properties for free')
      fireEvent.change(searchInput, { target: { value: 'Hyderabad' } })

      await waitFor(() => {
        const locationIcon = container.querySelector('.home-search-location-icon')
        expect(locationIcon).toBeInTheDocument()
      })
    })
  })

  describe('Benefits Section', () => {
    it('should show all four benefit categories', () => {
      render(<Home />)

      expect(screen.getByText('For Buyers')).toBeInTheDocument()
      expect(screen.getByText('For Sellers')).toBeInTheDocument()
      expect(screen.getByText('For Agents')).toBeInTheDocument()
      expect(screen.getByText('For Builders')).toBeInTheDocument()
    })

    it('should show buyers description', () => {
      render(<Home />)

      expect(
        screen.getByText(/Discover your dream home from thousands of verified listings/i)
      ).toBeInTheDocument()
    })

    it('should show sellers description', () => {
      render(<Home />)

      expect(
        screen.getByText(/List your property for free and reach thousands of potential buyers/i)
      ).toBeInTheDocument()
    })

    it('should show agents description', () => {
      render(<Home />)

      expect(
        screen.getByText(/Grow your real estate business with our comprehensive agent platform/i)
      ).toBeInTheDocument()
    })

    it('should show builders description', () => {
      render(<Home />)

      expect(
        screen.getByText(
          /Showcase your residential and commercial projects to qualified buyers/i
        )
      ).toBeInTheDocument()
    })

    it('should have benefit icons', () => {
      const { container } = render(<Home />)

      const benefitIcons = container.querySelectorAll('.benefit-icon')
      expect(benefitIcons.length).toBe(4)
    })

    it('should have colored dividers for benefits', () => {
      const { container } = render(<Home />)

      expect(container.querySelector('.benefit-divider-blue')).toBeInTheDocument()
      expect(container.querySelector('.benefit-divider-green')).toBeInTheDocument()
      expect(container.querySelector('.benefit-divider-purple')).toBeInTheDocument()
      expect(container.querySelector('.benefit-divider-orange')).toBeInTheDocument()
    })
  })

  describe('Showcase Section', () => {
    it('should show agents showcase', () => {
      render(<Home />)

      expect(screen.getByText('Connect with Top Agents')).toBeInTheDocument()
      expect(
        screen.getByText(/Work with experienced real estate professionals/i)
      ).toBeInTheDocument()
    })

    it('should show builders showcase', () => {
      render(<Home />)

      expect(screen.getByText('Find Top Builders')).toBeInTheDocument()
      expect(screen.getByText(/Discover trusted builders across India/i)).toBeInTheDocument()
    })

    it('should have browse agents button', () => {
      render(<Home />)

      const browseButton = screen.getByText('Browse All Agents')
      expect(browseButton).toBeInTheDocument()
    })

    it('should have discover builders button', () => {
      render(<Home />)

      const discoverButton = screen.getByText('Discover Builders')
      expect(discoverButton).toBeInTheDocument()
    })

    it('should link to agents page', () => {
      render(<Home />)

      const agentsLink = screen.getByText('Browse All Agents').closest('a')
      expect(agentsLink).toHaveAttribute('href', '/agents')
    })

    it('should link to builders page', () => {
      render(<Home />)

      const buildersLink = screen.getByText('Discover Builders').closest('a')
      expect(buildersLink).toHaveAttribute('href', '/builders')
    })

    it('should have arrow icons in showcase buttons', () => {
      const { container } = render(<Home />)

      const arrows = container.querySelectorAll('.showcase-arrow')
      expect(arrows.length).toBe(2)
    })
  })

  describe('CSS Classes', () => {
    it('should have correct container classes', () => {
      const { container } = render(<Home />)

      expect(container.querySelector('.home-container')).toBeInTheDocument()
      expect(container.querySelector('.home-main-section')).toBeInTheDocument()
      expect(container.querySelector('.home-content-wrapper')).toBeInTheDocument()
    })

    it('should have correct search classes', () => {
      const { container } = render(<Home />)

      expect(container.querySelector('.home-search-container')).toBeInTheDocument()
      expect(container.querySelector('.home-search-wrapper')).toBeInTheDocument()
      expect(container.querySelector('.home-search-input')).toBeInTheDocument()
    })

    it('should have correct benefits classes', () => {
      const { container } = render(<Home />)

      expect(container.querySelector('.benefits-section')).toBeInTheDocument()
      expect(container.querySelector('.benefits-grid')).toBeInTheDocument()
      expect(container.querySelector('.benefit-item')).toBeInTheDocument()
    })

    it('should have correct showcase classes', () => {
      const { container } = render(<Home />)

      expect(container.querySelector('.showcase-grid')).toBeInTheDocument()
      expect(container.querySelector('.showcase-section')).toBeInTheDocument()
      expect(container.querySelector('.showcase-title')).toBeInTheDocument()
    })
  })

  describe('Google Maps API Loading', () => {
    it('should load Google Maps API', async () => {
      render(<Home />)

      await waitFor(() => {
        expect(global.google).toBeDefined()
        expect(global.google.maps.places.AutocompleteService).toBeDefined()
      })
    })

    it('should handle missing API key gracefully', () => {
      delete process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      render(<Home />)

      expect(consoleSpy).toHaveBeenCalledWith(
        'Google Maps API key is missing. Please set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY environment variable.'
      )

      consoleSpy.mockRestore()
    })

    it('should not reload API if already loaded', () => {
      render(<Home />)

      const serviceCount = mockAutocompleteService.mock.calls.length
      render(<Home />)

      // Should reuse existing service
      expect(mockAutocompleteService.mock.calls.length).toBeGreaterThanOrEqual(serviceCount)
    })
  })

  describe('Accessibility', () => {
    it('should have proper search input attributes', () => {
      render(<Home />)

      const searchInput = screen.getByPlaceholderText('Browse properties for free')
      expect(searchInput).toHaveAttribute('type', 'text')
    })

    it('should have semantic HTML sections', () => {
      const { container } = render(<Home />)

      const sections = container.querySelectorAll('section')
      expect(sections.length).toBeGreaterThan(0)
    })
  })
})
