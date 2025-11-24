import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import AddProperty from '@/pages/properties/add-property'
import toast from 'react-hot-toast'

// Mock Google Maps
const mockAutocompleteAddListener = jest.fn()
const mockAutocompleteGetPlace = jest.fn()
const mockAutocomplete = {
  addListener: mockAutocompleteAddListener,
  getPlace: mockAutocompleteGetPlace,
}

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}))

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}))

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
    loading: jest.fn(),
    dismiss: jest.fn(),
  },
}))

jest.mock('@googlemaps/js-api-loader', () => ({
  Loader: jest.fn().mockImplementation(() => ({
    load: jest.fn().mockResolvedValue({}),
  })),
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

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt }: any) => <img src={src} alt={alt} />,
}))

const mockProjects = [
  {
    id: 'project-1',
    name: 'Test Project',
    builder: { name: 'Test Builder' },
    location: { city: 'Hyderabad', state: 'Telangana' },
  },
  {
    id: 'project-2',
    name: 'Another Project',
    builder: { name: 'Another Builder' },
    location: { city: 'Bangalore', state: 'Karnataka' },
  },
]

describe('Add Property Page - Comprehensive Tests', () => {
  const mockPush = jest.fn()
  const mockBack = jest.fn()
  const mockUseSession = useSession as jest.Mock
  const mockUseRouter = useRouter as jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseRouter.mockReturnValue({
      push: mockPush,
      back: mockBack,
      query: {},
    })
    mockUseSession.mockReturnValue({
      data: {
        user: {
          email: 'agent@example.com',
          name: 'Test Agent',
        },
      },
      status: 'authenticated',
    })

    // Mock Google Maps Autocomplete
    global.google = {
      maps: {
        places: {
          Autocomplete: jest.fn(() => mockAutocomplete),
          PlacesServiceStatus: {
            OK: 'OK',
          },
        },
      },
    } as any

    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = 'test-api-key'

    global.fetch = jest.fn(url => {
      if (url.includes('/api/projects/search')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ projects: mockProjects }),
        })
      }
      if (url.includes('/api/user/info')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            user: {
              emailVerified: new Date(),
              mobileVerified: new Date(),
            },
          }),
        })
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({}),
      })
    }) as jest.Mock

    // Mock FileReader
    global.FileReader = jest.fn().mockImplementation(function (this: any) {
      this.readAsDataURL = jest.fn()
      this.onloadend = null
      this.result = 'data:image/png;base64,mockBase64'
      setTimeout(() => {
        if (this.onloadend) this.onloadend()
      }, 0)
    }) as any
  })

  afterEach(() => {
    delete (global as any).google
    delete process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    jest.restoreAllMocks()
  })

  describe('Rendering and Initial State', () => {
    it('should render page with header and footer', () => {
      render(<AddProperty />)

      expect(screen.getByTestId('header')).toBeInTheDocument()
      expect(screen.getByTestId('footer')).toBeInTheDocument()
    })

    it('should render page title', () => {
      render(<AddProperty />)

      expect(screen.getByText('Add New')).toBeInTheDocument()
      expect(screen.getByText('Property')).toBeInTheDocument()
    })

    it('should render listing type toggle', () => {
      render(<AddProperty />)

      expect(screen.getByText('Sell')).toBeInTheDocument()
      expect(screen.getByText('Rent')).toBeInTheDocument()
    })

    it('should have Sell selected by default', () => {
      render(<AddProperty />)

      const sellButton = screen.getByText('Sell')
      expect(sellButton).toHaveClass('text-white')
    })

    it('should show loading spinner when status is loading', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'loading',
      })

      render(<AddProperty />)

      const spinner = document.querySelector('.animate-spin')
      expect(spinner).toBeInTheDocument()
    })

    it('should render all required form fields', () => {
      render(<AddProperty />)

      expect(screen.getByPlaceholderText(/3 BHK Apartment/)).toBeInTheDocument()
      expect(screen.getByText('Select Type')).toBeInTheDocument()
      expect(screen.getByPlaceholderText(/Search for a project/)).toBeInTheDocument()
      expect(screen.getByPlaceholderText(/Search for location/)).toBeInTheDocument()
      expect(screen.getByPlaceholderText(/e.g., 5000000/)).toBeInTheDocument()
    })

    it('should render property type dropdown button', () => {
      render(<AddProperty />)

      expect(screen.getByText('Select Type')).toBeInTheDocument()
    })

    it('should render facing dropdown button', () => {
      render(<AddProperty />)

      expect(screen.getByText('Select Facing')).toBeInTheDocument()
    })

    it('should render image upload section', () => {
      render(<AddProperty />)

      expect(screen.getByText(/Click here/)).toBeInTheDocument()
      expect(screen.getByText(/to upload images/)).toBeInTheDocument()
    })

    it('should render submit button', () => {
      render(<AddProperty />)

      expect(screen.getByText('Add Property')).toBeInTheDocument()
    })

    it('should render cancel button', () => {
      render(<AddProperty />)

      expect(screen.getByText('Cancel')).toBeInTheDocument()
    })
  })

  describe('Authentication', () => {
    it('should redirect to login if not authenticated', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
      })

      render(<AddProperty />)

      waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login')
      })
    })

    it('should not render form when unauthenticated', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
      })

      render(<AddProperty />)

      expect(screen.queryByText('Add Property')).not.toBeInTheDocument()
    })
  })

  describe('Verification Status', () => {
    it('should check verification status on mount', async () => {
      render(<AddProperty />)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/user/info')
      })
    })

    it('should show verification banner when not verified', async () => {
      global.fetch = jest.fn(url => {
        if (url.includes('/api/user/info')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              user: {
                emailVerified: null,
                mobileVerified: null,
              },
            }),
          })
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({}),
        })
      }) as jest.Mock

      render(<AddProperty />)

      await waitFor(() => {
        expect(screen.getByText('Verification Required')).toBeInTheDocument()
      })
    })

    it('should disable submit button when not verified', async () => {
      global.fetch = jest.fn(url => {
        if (url.includes('/api/user/info')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              user: {
                emailVerified: null,
                mobileVerified: null,
              },
            }),
          })
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({}),
        })
      }) as jest.Mock

      render(<AddProperty />)

      await waitFor(() => {
        const submitButton = screen.getByText('Add Property')
        expect(submitButton).toBeDisabled()
      })
    })

    it('should show Verify Now button in verification banner', async () => {
      global.fetch = jest.fn(url => {
        if (url.includes('/api/user/info')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              user: {
                emailVerified: null,
                mobileVerified: null,
              },
            }),
          })
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({}),
        })
      }) as jest.Mock

      render(<AddProperty />)

      await waitFor(() => {
        expect(screen.getByText('Verify Now')).toBeInTheDocument()
      })
    })

    it('should navigate to userinfo when Verify Now clicked', async () => {
      global.fetch = jest.fn(url => {
        if (url.includes('/api/user/info')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              user: {
                emailVerified: null,
                mobileVerified: null,
              },
            }),
          })
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({}),
        })
      }) as jest.Mock

      render(<AddProperty />)

      await waitFor(() => {
        expect(screen.getByText('Verify Now')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Verify Now'))

      expect(mockPush).toHaveBeenCalledWith('/auth/userinfo')
    })

    it('should allow email verified users to submit', async () => {
      global.fetch = jest.fn(url => {
        if (url.includes('/api/user/info')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              user: {
                emailVerified: new Date(),
                mobileVerified: null,
              },
            }),
          })
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({}),
        })
      }) as jest.Mock

      render(<AddProperty />)

      await waitFor(() => {
        const submitButton = screen.getByText('Add Property')
        expect(submitButton).not.toBeDisabled()
      })
    })

    it('should allow mobile verified users to submit', async () => {
      global.fetch = jest.fn(url => {
        if (url.includes('/api/user/info')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              user: {
                emailVerified: null,
                mobileVerified: new Date(),
              },
            }),
          })
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({}),
        })
      }) as jest.Mock

      render(<AddProperty />)

      await waitFor(() => {
        const submitButton = screen.getByText('Add Property')
        expect(submitButton).not.toBeDisabled()
      })
    })
  })

  describe('Listing Type Toggle', () => {
    it('should switch to Rent when clicked', () => {
      render(<AddProperty />)

      const rentButton = screen.getByText('Rent')
      fireEvent.click(rentButton)

      expect(rentButton).toHaveClass('text-white')
    })

    it('should switch back to Sell when clicked', () => {
      render(<AddProperty />)

      fireEvent.click(screen.getByText('Rent'))
      fireEvent.click(screen.getByText('Sell'))

      const sellButton = screen.getByText('Sell')
      expect(sellButton).toHaveClass('text-white')
    })
  })

  describe('Form Input Handling', () => {
    it('should update title input value', () => {
      render(<AddProperty />)

      const titleInput = screen.getByPlaceholderText(/3 BHK Apartment/) as HTMLInputElement
      fireEvent.change(titleInput, { target: { value: 'Luxury Villa' } })

      expect(titleInput.value).toBe('Luxury Villa')
    })

    it('should update price input value', () => {
      render(<AddProperty />)

      const priceInput = screen.getByPlaceholderText(/e.g., 5000000/) as HTMLInputElement
      fireEvent.change(priceInput, { target: { value: '10000000' } })

      expect(priceInput.value).toBe('10000000')
    })

    it('should update description textarea value', () => {
      render(<AddProperty />)

      const descriptionInput = screen.getByPlaceholderText(
        /Describe your property/
      ) as HTMLTextAreaElement
      fireEvent.change(descriptionInput, { target: { value: 'Beautiful property' } })

      expect(descriptionInput.value).toBe('Beautiful property')
    })

    it('should update property size input', () => {
      render(<AddProperty />)

      const sizeInput = screen.getByPlaceholderText('Size') as HTMLInputElement
      fireEvent.change(sizeInput, { target: { value: '1500' } })

      expect(sizeInput.value).toBe('1500')
    })

    it('should update plot size input', async () => {
      render(<AddProperty />)

      // First select a property type that shows bedrooms (Villa)
      fireEvent.click(screen.getByText('Select Type'))
      await waitFor(() => {
        expect(screen.getByText('🏡 Villas')).toBeInTheDocument()
      })
      fireEvent.click(screen.getByText('🏡 Villas'))

      await waitFor(() => {
        const plotSizeInput = screen.getByPlaceholderText('Plot Size') as HTMLInputElement
        fireEvent.change(plotSizeInput, { target: { value: '2000' } })
        expect(plotSizeInput.value).toBe('2000')
      })
    })
  })

  describe('Property Type Dropdown', () => {
    it('should show property types when dropdown clicked', async () => {
      render(<AddProperty />)

      fireEvent.click(screen.getByText('Select Type'))

      await waitFor(() => {
        expect(screen.getByText('🏡 Villas')).toBeInTheDocument()
        expect(screen.getByText('🏢 Apartments')).toBeInTheDocument()
        expect(screen.getByText('🏞️ Residential Lands')).toBeInTheDocument()
        expect(screen.getByText('🌾 Agriculture Lands')).toBeInTheDocument()
        expect(screen.getByText('🏬 Commercial')).toBeInTheDocument()
      })
    })

    it('should select property type when clicked', async () => {
      render(<AddProperty />)

      fireEvent.click(screen.getByText('Select Type'))

      await waitFor(() => {
        expect(screen.getByText('🏡 Villas')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('🏡 Villas'))

      await waitFor(() => {
        expect(screen.queryByText('🏢 Apartments')).not.toBeInTheDocument()
      })
    })

    it('should close dropdown after selection', async () => {
      render(<AddProperty />)

      fireEvent.click(screen.getByText('Select Type'))
      await waitFor(() => {
        expect(screen.getByText('🏡 Villas')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('🏡 Villas'))

      await waitFor(() => {
        expect(screen.queryByText('🏡 Villas')).not.toBeInTheDocument()
      })
    })

    it('should show bedrooms/bathrooms fields for villas', async () => {
      render(<AddProperty />)

      fireEvent.click(screen.getByText('Select Type'))
      await waitFor(() => {
        expect(screen.getByText('🏡 Villas')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('🏡 Villas'))

      await waitFor(() => {
        expect(screen.getByText(/Bedrooms\s*\*/)).toBeInTheDocument()
        expect(screen.getByText(/Bathrooms\s*\*/)).toBeInTheDocument()
      })
    })

    it('should show bedrooms/bathrooms fields for apartments', async () => {
      render(<AddProperty />)

      fireEvent.click(screen.getByText('Select Type'))
      await waitFor(() => {
        expect(screen.getByText('🏢 Apartments')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('🏢 Apartments'))

      await waitFor(() => {
        expect(screen.getByText(/Bedrooms\s*\*/)).toBeInTheDocument()
        expect(screen.getByText(/Bathrooms\s*\*/)).toBeInTheDocument()
      })
    })

    it('should not show bedrooms/bathrooms fields for land', async () => {
      render(<AddProperty />)

      fireEvent.click(screen.getByText('Select Type'))
      await waitFor(() => {
        expect(screen.getByText('🏞️ Residential Lands')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('🏞️ Residential Lands'))

      await waitFor(() => {
        expect(screen.queryByText('Bedrooms *')).not.toBeInTheDocument()
        expect(screen.queryByText('Bathrooms *')).not.toBeInTheDocument()
      })
    })
  })

  describe('Bedrooms and Bathrooms Fields', () => {
    beforeEach(async () => {
      render(<AddProperty />)
      fireEvent.click(screen.getByText('Select Type'))
      await waitFor(() => {
        expect(screen.getByText('🏡 Villas')).toBeInTheDocument()
      })
      fireEvent.click(screen.getByText('🏡 Villas'))
    })

    it('should render bedrooms input field', async () => {
      await waitFor(() => {
        expect(screen.getByText(/Bedrooms\s*\*/)).toBeInTheDocument()
      })
    })

    it('should render bathrooms input field', async () => {
      await waitFor(() => {
        expect(screen.getByText(/Bathrooms\s*\*/)).toBeInTheDocument()
      })
    })

    it('should update bedrooms value', async () => {
      await waitFor(() => {
        const inputs = screen.getAllByRole('spinbutton')
        const bedroomsInput = inputs.find(
          input => input.getAttribute('name') === 'bedrooms'
        ) as HTMLInputElement
        fireEvent.change(bedroomsInput, { target: { value: '3' } })
        expect(bedroomsInput.value).toBe('3')
      })
    })

    it('should update bathrooms value', async () => {
      await waitFor(() => {
        const inputs = screen.getAllByRole('spinbutton')
        const bathroomsInput = inputs.find(
          input => input.getAttribute('name') === 'bathrooms'
        ) as HTMLInputElement
        fireEvent.change(bathroomsInput, { target: { value: '2' } })
        expect(bathroomsInput.value).toBe('2')
      })
    })

    it('should show plot size field for villas', async () => {
      await waitFor(() => {
        expect(screen.getByText('Plot Size')).toBeInTheDocument()
      })
    })
  })

  describe('Project Search and Selection', () => {
    it('should fetch projects on mount', async () => {
      render(<AddProperty />)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/projects/search?query=')
        )
      })
    })

    it('should show project dropdown when input focused', async () => {
      render(<AddProperty />)

      const projectInput = screen.getByPlaceholderText(/Search for a project/)
      fireEvent.focus(projectInput)

      await waitFor(() => {
        expect(screen.getByText('Independent')).toBeInTheDocument()
      })
    })

    it('should show Independent option in dropdown', async () => {
      render(<AddProperty />)

      const projectInput = screen.getByPlaceholderText(/Search for a project/)
      fireEvent.focus(projectInput)

      await waitFor(() => {
        expect(screen.getByText('Independent')).toBeInTheDocument()
        expect(screen.getByText('Not part of any project')).toBeInTheDocument()
      })
    })

    it('should show fetched projects in dropdown', async () => {
      render(<AddProperty />)

      const projectInput = screen.getByPlaceholderText(/Search for a project/)
      fireEvent.focus(projectInput)

      await waitFor(() => {
        expect(screen.getByText('Test Project')).toBeInTheDocument()
        expect(screen.getByText('Another Project')).toBeInTheDocument()
      })
    })

    it('should select Independent when clicked', async () => {
      render(<AddProperty />)

      const projectInput = screen.getByPlaceholderText(/Search for a project/)
      fireEvent.focus(projectInput)

      await waitFor(() => {
        expect(screen.getByText('Independent')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Independent'))

      await waitFor(() => {
        expect((projectInput as HTMLInputElement).value).toBe('Independent')
      })
    })

    it('should select project when clicked', async () => {
      render(<AddProperty />)

      const projectInput = screen.getByPlaceholderText(/Search for a project/)
      fireEvent.focus(projectInput)

      await waitFor(() => {
        expect(screen.getByText('Test Project')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Test Project'))

      await waitFor(() => {
        expect((projectInput as HTMLInputElement).value).toBe('Test Project')
      })
    })

    it('should search projects when typing', async () => {
      render(<AddProperty />)

      const projectInput = screen.getByPlaceholderText(/Search for a project/)
      fireEvent.change(projectInput, { target: { value: 'Test' } })

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/projects/search?query=Test')
        )
      })
    })

    it('should close dropdown after project selection', async () => {
      render(<AddProperty />)

      const projectInput = screen.getByPlaceholderText(/Search for a project/)
      fireEvent.focus(projectInput)

      await waitFor(() => {
        expect(screen.getByText('Test Project')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Test Project'))

      await waitFor(() => {
        expect(screen.queryByText('Another Project')).not.toBeInTheDocument()
      })
    })
  })

  describe('Facing Dropdown', () => {
    it('should show facing options when clicked', async () => {
      render(<AddProperty />)

      fireEvent.click(screen.getByText('Select Facing'))

      await waitFor(() => {
        expect(screen.getByText('North')).toBeInTheDocument()
        expect(screen.getByText('South')).toBeInTheDocument()
        expect(screen.getByText('East')).toBeInTheDocument()
        expect(screen.getByText('West')).toBeInTheDocument()
      })
    })

    it('should select facing direction when clicked', async () => {
      render(<AddProperty />)

      fireEvent.click(screen.getByText('Select Facing'))

      await waitFor(() => {
        expect(screen.getByText('North')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('North'))

      await waitFor(() => {
        expect(screen.queryByText('South')).not.toBeInTheDocument()
      })
    })

    it('should close dropdown after selection', async () => {
      render(<AddProperty />)

      fireEvent.click(screen.getByText('Select Facing'))
      await waitFor(() => {
        expect(screen.getByText('North')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('North'))

      await waitFor(() => {
        expect(screen.queryByText('East')).not.toBeInTheDocument()
      })
    })
  })

  describe('Google Maps Location', () => {
    it('should initialize Google Maps autocomplete', () => {
      render(<AddProperty />)

      expect(google.maps.places.Autocomplete).toHaveBeenCalled()
    })

    it('should add place_changed listener', () => {
      render(<AddProperty />)

      expect(mockAutocompleteAddListener).toHaveBeenCalledWith(
        'place_changed',
        expect.any(Function)
      )
    })

    it('should show selected location message when address selected', async () => {
      mockAutocompleteGetPlace.mockReturnValue({
        geometry: {
          location: {
            lat: () => 17.385,
            lng: () => 78.4867,
          },
        },
        formatted_address: 'Hyderabad, Telangana, India',
        address_components: [
          { types: ['locality'], long_name: 'Hyderabad' },
          { types: ['administrative_area_level_1'], long_name: 'Telangana' },
          { types: ['country'], long_name: 'India' },
          { types: ['postal_code'], long_name: '500001' },
        ],
      })

      render(<AddProperty />)

      // Trigger place_changed event
      const placeChangedCallback = mockAutocompleteAddListener.mock.calls[0][1]
      placeChangedCallback()

      await waitFor(() => {
        expect(screen.getByText(/✓ Selected:/)).toBeInTheDocument()
      })
    })

    it('should show error message when no location selected', () => {
      render(<AddProperty />)

      expect(screen.getByText(/Please select a location from dropdown/)).toBeInTheDocument()
    })

    it('should handle missing Google Maps API key', () => {
      delete process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

      render(<AddProperty />)

      // Should still render without errors
      expect(screen.getByPlaceholderText(/Search for location/)).toBeInTheDocument()
    })
  })

  describe('Image Upload', () => {
    it('should have hidden file input', () => {
      render(<AddProperty />)

      const fileInput = document.querySelector('#image-upload')
      expect(fileInput).toBeInTheDocument()
      expect(fileInput).toHaveClass('hidden')
    })

    it('should show image count after upload', async () => {
      render(<AddProperty />)

      const fileInput = document.querySelector('#image-upload') as HTMLInputElement
      const file = new File(['image'], 'test.png', { type: 'image/png' })

      Object.defineProperty(fileInput, 'files', {
        value: [file],
      })

      fireEvent.change(fileInput)

      await waitFor(() => {
        expect(screen.getByText(/1 image/)).toBeInTheDocument()
      })
    })

    it('should prevent uploading more than 20 images', async () => {
      render(<AddProperty />)

      const fileInput = document.querySelector('#image-upload') as HTMLInputElement
      const files = Array.from(
        { length: 25 },
        (_, i) => new File(['image'], `test${i}.png`, { type: 'image/png' })
      )

      Object.defineProperty(fileInput, 'files', {
        value: files,
      })

      fireEvent.change(fileInput)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Maximum 20 images allowed')
      })
    })

    it('should show image previews after upload', async () => {
      render(<AddProperty />)

      const fileInput = document.querySelector('#image-upload') as HTMLInputElement
      const file = new File(['image'], 'test.png', { type: 'image/png' })

      Object.defineProperty(fileInput, 'files', {
        value: [file],
      })

      fireEvent.change(fileInput)

      await waitFor(() => {
        const images = screen.getAllByRole('img')
        expect(images.length).toBeGreaterThan(0)
      })
    })

    it('should have remove button for each image preview', async () => {
      render(<AddProperty />)

      const fileInput = document.querySelector('#image-upload') as HTMLInputElement
      const file = new File(['image'], 'test.png', { type: 'image/png' })

      Object.defineProperty(fileInput, 'files', {
        value: [file],
      })

      fireEvent.change(fileInput)

      await waitFor(() => {
        const removeButtons = screen.getAllByText('×')
        expect(removeButtons.length).toBeGreaterThan(0)
      })
    })

    it('should remove image when remove button clicked', async () => {
      render(<AddProperty />)

      const fileInput = document.querySelector('#image-upload') as HTMLInputElement
      const file = new File(['image'], 'test.png', { type: 'image/png' })

      Object.defineProperty(fileInput, 'files', {
        value: [file],
      })

      fireEvent.change(fileInput)

      await waitFor(() => {
        expect(screen.getByText(/1 image/)).toBeInTheDocument()
      })

      const removeButton = screen.getAllByText('×')[0]
      fireEvent.click(removeButton)

      await waitFor(() => {
        expect(screen.queryByText(/1 image/)).not.toBeInTheDocument()
      })
    })
  })

  describe('Walkthrough Video Links', () => {
    it('should render video URL input field', () => {
      render(<AddProperty />)

      const videoInput = screen.getByPlaceholderText(/youtube.com\/watch/i)
      expect(videoInput).toBeInTheDocument()
    })

    it('should allow entering video URL', () => {
      render(<AddProperty />)

      const videoInput = screen.getByPlaceholderText(/youtube.com\/watch/i)
      fireEvent.change(videoInput, { target: { value: 'https://youtube.com/watch?v=123' } })

      expect(videoInput).toHaveValue('https://youtube.com/watch?v=123')
    })

    it('should show add button to add more video links', () => {
      render(<AddProperty />)

      const addButtons = screen.getAllByTitle('Add another video link')
      expect(addButtons.length).toBeGreaterThan(0)
    })

    it('should add new video input when add button clicked', async () => {
      render(<AddProperty />)

      const initialInputs = screen.getAllByPlaceholderText(/youtube.com\/watch/i)
      const initialCount = initialInputs.length

      const addButton = screen.getByTitle('Add another video link')
      fireEvent.click(addButton)

      await waitFor(() => {
        const newInputs = screen.getAllByPlaceholderText(/youtube.com\/watch/i)
        expect(newInputs.length).toBe(initialCount + 1)
      })
    })

    it('should show remove button when multiple video inputs exist', async () => {
      render(<AddProperty />)

      const addButton = screen.getByTitle('Add another video link')
      fireEvent.click(addButton)

      await waitFor(() => {
        const removeButtons = screen.getAllByTitle('Remove video link')
        expect(removeButtons.length).toBeGreaterThan(0)
      })
    })

    it('should remove video input when remove button clicked', async () => {
      render(<AddProperty />)

      // Add a second input
      const addButton = screen.getByTitle('Add another video link')
      fireEvent.click(addButton)

      await waitFor(() => {
        const inputs = screen.getAllByPlaceholderText(/youtube.com\/watch/i)
        expect(inputs.length).toBe(2)
      })

      // Remove the first input
      const removeButtons = screen.getAllByTitle('Remove video link')
      fireEvent.click(removeButtons[0])

      await waitFor(() => {
        const inputs = screen.getAllByPlaceholderText(/youtube.com\/watch/i)
        expect(inputs.length).toBe(1)
      })
    })
  })

  describe('Form Submission', () => {
    it('should show error if location not selected', async () => {
      render(<AddProperty />)

      const submitButton = screen.getByText('Add Property')
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Please select a location from the dropdown')
      })
    })

    it('should show loading overlay during submission', async () => {
      mockAutocompleteGetPlace.mockReturnValue({
        geometry: {
          location: {
            lat: () => 17.385,
            lng: () => 78.4867,
          },
        },
        formatted_address: 'Hyderabad, Telangana, India',
        address_components: [],
      })

      global.fetch = jest.fn(url => {
        if (url.includes('/api/properties/create')) {
          return new Promise(() => {}) // Never resolves to test loading state
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({}),
        })
      }) as jest.Mock

      render(<AddProperty />)

      // Trigger place selection
      const placeChangedCallback = mockAutocompleteAddListener.mock.calls[0][1]
      placeChangedCallback()

      await waitFor(() => {
        expect(screen.getByText(/✓ Selected:/)).toBeInTheDocument()
      })

      // Fill required fields
      const titleInput = screen.getByPlaceholderText(/3 BHK Apartment/)
      fireEvent.change(titleInput, { target: { value: 'Test Property' } })

      const submitButton = screen.getByText('Add Property')
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/Processing.*property/)).toBeInTheDocument()
      })
    })

    it('should show success message on successful submission', async () => {
      mockAutocompleteGetPlace.mockReturnValue({
        geometry: {
          location: {
            lat: () => 17.385,
            lng: () => 78.4867,
          },
        },
        formatted_address: 'Hyderabad, Telangana, India',
        address_components: [],
      })

      global.fetch = jest.fn(url => {
        if (url.includes('/api/properties/create')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ property: { id: 'new-property' } }),
          })
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({}),
        })
      }) as jest.Mock

      render(<AddProperty />)

      // Trigger place selection
      const placeChangedCallback = mockAutocompleteAddListener.mock.calls[0][1]
      placeChangedCallback()

      await waitFor(() => {
        expect(screen.getByText(/✓ Selected:/)).toBeInTheDocument()
      })

      const submitButton = screen.getByText('Add Property')
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Property added successfully!')
      })
    })

    it('should navigate to my-properties after successful submission', async () => {
      mockAutocompleteGetPlace.mockReturnValue({
        geometry: {
          location: {
            lat: () => 17.385,
            lng: () => 78.4867,
          },
        },
        formatted_address: 'Hyderabad, Telangana, India',
        address_components: [],
      })

      global.fetch = jest.fn(url => {
        if (url.includes('/api/properties/create')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ property: { id: 'new-property' } }),
          })
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({}),
        })
      }) as jest.Mock

      render(<AddProperty />)

      // Trigger place selection
      const placeChangedCallback = mockAutocompleteAddListener.mock.calls[0][1]
      placeChangedCallback()

      await waitFor(() => {
        expect(screen.getByText(/✓ Selected:/)).toBeInTheDocument()
      })

      const submitButton = screen.getByText('Add Property')
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/properties/my-properties')
      })
    })

    it('should handle submission error', async () => {
      mockAutocompleteGetPlace.mockReturnValue({
        geometry: {
          location: {
            lat: () => 17.385,
            lng: () => 78.4867,
          },
        },
        formatted_address: 'Hyderabad, Telangana, India',
        address_components: [],
      })

      global.fetch = jest.fn(url => {
        if (url.includes('/api/properties/create')) {
          return Promise.resolve({
            ok: false,
            json: async () => ({ message: 'Failed to create property' }),
          })
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({}),
        })
      }) as jest.Mock

      render(<AddProperty />)

      // Trigger place selection
      const placeChangedCallback = mockAutocompleteAddListener.mock.calls[0][1]
      placeChangedCallback()

      await waitFor(() => {
        expect(screen.getByText(/✓ Selected:/)).toBeInTheDocument()
      })

      const submitButton = screen.getByText('Add Property')
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to create property')
      })
    })
  })

  describe('Cancel Button', () => {
    it('should navigate back when cancel clicked', () => {
      render(<AddProperty />)

      const cancelButton = screen.getByRole('button', { name: 'Cancel' })
      fireEvent.click(cancelButton)

      expect(mockBack).toHaveBeenCalled()
    })
  })

  describe('Dropdown Click Outside Behavior', () => {
    it('should close property type dropdown when clicking outside', async () => {
      render(<AddProperty />)

      fireEvent.click(screen.getByText('Select Type'))

      await waitFor(() => {
        expect(screen.getByText('🏡 Villas')).toBeInTheDocument()
      })

      fireEvent.mouseDown(document.body)

      await waitFor(() => {
        expect(screen.queryByText('🏡 Villas')).not.toBeInTheDocument()
      })
    })

    it('should close facing dropdown when clicking outside', async () => {
      render(<AddProperty />)

      fireEvent.click(screen.getByText('Select Facing'))

      await waitFor(() => {
        expect(screen.getByText('North')).toBeInTheDocument()
      })

      fireEvent.mouseDown(document.body)

      await waitFor(() => {
        expect(screen.queryByText('North')).not.toBeInTheDocument()
      })
    })
  })

  describe('CSS Classes', () => {
    it('should have correct container classes', () => {
      const { container } = render(<AddProperty />)

      expect(container.querySelector('.min-h-screen')).toBeInTheDocument()
      expect(container.querySelector('.bg-gray-50')).toBeInTheDocument()
    })

    it('should have correct form section classes', () => {
      const { container } = render(<AddProperty />)

      expect(container.querySelector('.bg-white')).toBeInTheDocument()
      expect(container.querySelector('.rounded-lg')).toBeInTheDocument()
      expect(container.querySelector('.shadow-md')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have required asterisks on required fields', () => {
      render(<AddProperty />)

      expect(screen.getByText(/Property Title\s*\*/)).toBeInTheDocument()
      expect(screen.getByText('Property Type *')).toBeInTheDocument()
      expect(screen.getByText('Property Size *')).toBeInTheDocument()
      expect(screen.getByText(/Location\s*\*/)).toBeInTheDocument()
      expect(screen.getByText('Price (₹) *')).toBeInTheDocument()
      expect(screen.getByText('Facing *')).toBeInTheDocument()
    })

    it('should have proper placeholder text', () => {
      render(<AddProperty />)

      expect(screen.getByPlaceholderText(/3 BHK Apartment/)).toBeInTheDocument()
      expect(screen.getByPlaceholderText(/e.g., 5000000/)).toBeInTheDocument()
      expect(screen.getByPlaceholderText(/Describe your property/)).toBeInTheDocument()
    })
  })
})
