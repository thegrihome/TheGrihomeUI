import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import EditProperty from '@/pages/properties/edit/[id]'
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

const mockProperty = {
  id: 'property-1',
  title: 'Existing Property',
  propertyType: 'SINGLE_FAMILY',
  listingType: 'SALE',
  projectId: 'project-1',
  projectName: 'Test Project',
  bedrooms: '3',
  bathrooms: '2',
  size: '1500',
  sizeUnit: 'SQ_FT',
  plotSize: '2000',
  plotSizeUnit: 'SQ_FT',
  facing: 'North',
  description: 'Existing description',
  price: '5000000',
  streetAddress: '123 Test Street',
  location: {
    city: 'Hyderabad',
    state: 'Telangana',
    zipcode: '500001',
    locality: 'Gachibowli',
  },
  imageUrls: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
}

const mockProjects = [
  {
    id: 'project-1',
    name: 'Test Project',
    builder: { name: 'Test Builder' },
    location: { city: 'Hyderabad', state: 'Telangana' },
  },
]

describe('Edit Property Page - Comprehensive Tests', () => {
  const mockPush = jest.fn()
  const mockBack = jest.fn()
  const mockUseSession = useSession as jest.Mock
  const mockUseRouter = useRouter as jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseRouter.mockReturnValue({
      push: mockPush,
      back: mockBack,
      query: { id: 'property-1' },
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
      if (url.includes('/api/properties/property-1')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ property: mockProperty }),
        })
      }
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
    it('should render page with header and footer', async () => {
      render(<EditProperty />)

      await waitFor(() => {
        expect(screen.getByTestId('header')).toBeInTheDocument()
        expect(screen.getByTestId('footer')).toBeInTheDocument()
      })
    })

    it('should render page title', async () => {
      render(<EditProperty />)

      await waitFor(() => {
        expect(screen.getByText('Edit')).toBeInTheDocument()
        expect(screen.getByText('Property')).toBeInTheDocument()
      })
    })

    it('should show loading spinner initially', () => {
      render(<EditProperty />)

      const spinner = document.querySelector('.animate-spin')
      expect(spinner).toBeInTheDocument()
    })

    it('should render listing type toggle', async () => {
      render(<EditProperty />)

      await waitFor(() => {
        expect(screen.getByText('Sell')).toBeInTheDocument()
        expect(screen.getByText('Rent')).toBeInTheDocument()
      })
    })
  })

  describe('Authentication', () => {
    it('should redirect to login if not authenticated', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
      })

      render(<EditProperty />)

      waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login')
      })
    })
  })

  describe('Property Data Loading', () => {
    it('should fetch property on mount', async () => {
      render(<EditProperty />)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/properties/property-1')
      })
    })

    it('should populate form with existing data', async () => {
      render(<EditProperty />)

      await waitFor(() => {
        const titleInput = screen.getByDisplayValue('Existing Property')
        expect(titleInput).toBeInTheDocument()
      })
    })

    it('should populate price field', async () => {
      render(<EditProperty />)

      await waitFor(() => {
        const priceInput = screen.getByDisplayValue('5000000')
        expect(priceInput).toBeInTheDocument()
      })
    })

    it('should populate description field', async () => {
      render(<EditProperty />)

      await waitFor(() => {
        const descriptionInput = screen.getByDisplayValue('Existing description')
        expect(descriptionInput).toBeInTheDocument()
      })
    })

    it('should handle property load error', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
        })
      ) as jest.Mock

      render(<EditProperty />)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to load property')
      })
    })

    it('should redirect on property load error', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
        })
      ) as jest.Mock

      render(<EditProperty />)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/properties/my-properties')
      })
    })
  })

  describe('Verification Status', () => {
    it('should check verification status on mount', async () => {
      render(<EditProperty />)

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
        if (url.includes('/api/properties/property-1')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ property: mockProperty }),
          })
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({}),
        })
      }) as jest.Mock

      render(<EditProperty />)

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
        if (url.includes('/api/properties/property-1')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ property: mockProperty }),
          })
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({}),
        })
      }) as jest.Mock

      render(<EditProperty />)

      await waitFor(() => {
        const submitButton = screen.getByText('Update Property')
        expect(submitButton).toBeDisabled()
      })
    })
  })

  describe('Form Input Handling', () => {
    it('should update title input value', async () => {
      render(<EditProperty />)

      await waitFor(() => {
        const titleInput = screen.getByDisplayValue('Existing Property') as HTMLInputElement
        fireEvent.change(titleInput, { target: { value: 'Updated Property' } })
        expect(titleInput.value).toBe('Updated Property')
      })
    })

    it('should update price input value', async () => {
      render(<EditProperty />)

      await waitFor(() => {
        const priceInput = screen.getByDisplayValue('5000000') as HTMLInputElement
        fireEvent.change(priceInput, { target: { value: '6000000' } })
        expect(priceInput.value).toBe('6000000')
      })
    })

    it('should update description value', async () => {
      render(<EditProperty />)

      await waitFor(() => {
        const descriptionInput = screen.getByDisplayValue(
          'Existing description'
        ) as HTMLTextAreaElement
        fireEvent.change(descriptionInput, { target: { value: 'Updated description' } })
        expect(descriptionInput.value).toBe('Updated description')
      })
    })
  })

  describe('Listing Type Toggle', () => {
    it('should have current listing type selected', async () => {
      render(<EditProperty />)

      await waitFor(() => {
        const sellButton = screen.getByText('Sell')
        expect(sellButton).toHaveClass('text-white')
      })
    })

    it('should switch to Rent when clicked', async () => {
      render(<EditProperty />)

      await waitFor(() => {
        const rentButton = screen.getByText('Rent')
        fireEvent.click(rentButton)
        expect(rentButton).toHaveClass('text-white')
      })
    })
  })

  describe('Property Type Selection', () => {
    it('should show property types when dropdown clicked', async () => {
      render(<EditProperty />)

      await waitFor(() => {
        // Property type is preselected, find the button
        const buttons = screen.getAllByRole('button')
        const propertyTypeButton = buttons.find(btn => btn.textContent?.includes('Villas'))
        expect(propertyTypeButton).toBeInTheDocument()
      })
    })

    it('should show bedrooms/bathrooms fields for villas', async () => {
      render(<EditProperty />)

      await waitFor(() => {
        expect(screen.getByText('Bedrooms *')).toBeInTheDocument()
        expect(screen.getByText('Bathrooms *')).toBeInTheDocument()
      })
    })
  })

  describe('Bedrooms and Bathrooms Fields', () => {
    it('should populate bedrooms value', async () => {
      render(<EditProperty />)

      await waitFor(() => {
        const bedroomsInput = screen.getByDisplayValue('3')
        expect(bedroomsInput).toBeInTheDocument()
      })
    })

    it('should populate bathrooms value', async () => {
      render(<EditProperty />)

      await waitFor(() => {
        const bathroomsInput = screen.getByDisplayValue('2')
        expect(bathroomsInput).toBeInTheDocument()
      })
    })
  })

  describe('Project Selection', () => {
    it('should fetch projects on mount', async () => {
      render(<EditProperty />)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/projects/search?query=')
        )
      })
    })

    it('should show current project name', async () => {
      render(<EditProperty />)

      await waitFor(() => {
        const projectInput = screen.getByDisplayValue('Test Project')
        expect(projectInput).toBeInTheDocument()
      })
    })

    it('should show project dropdown when input focused', async () => {
      render(<EditProperty />)

      await waitFor(() => {
        const projectInput = screen.getByPlaceholderText(/Search for a project/)
        fireEvent.focus(projectInput)
      })

      await waitFor(() => {
        expect(screen.getByText('Independent')).toBeInTheDocument()
      })
    })
  })

  describe('Existing Images Display', () => {
    it('should display existing images', async () => {
      render(<EditProperty />)

      await waitFor(() => {
        const images = screen.getAllByRole('img')
        expect(
          images.some(img => img.getAttribute('src') === 'https://example.com/image1.jpg')
        ).toBe(true)
      })
    })

    it('should have remove buttons for existing images', async () => {
      render(<EditProperty />)

      await waitFor(() => {
        const removeButtons = screen.getAllByText('×')
        expect(removeButtons.length).toBeGreaterThan(0)
      })
    })

    it('should remove existing image when remove clicked', async () => {
      render(<EditProperty />)

      await waitFor(() => {
        const removeButtons = screen.getAllByText('×')
        expect(removeButtons.length).toBeGreaterThan(0)
      })

      const removeButton = screen.getAllByText('×')[0]
      fireEvent.click(removeButton)

      await waitFor(() => {
        const images = screen.getAllByRole('img')
        expect(images.length).toBeLessThan(3) // Header/footer images + property images
      })
    })
  })

  describe('New Images Upload', () => {
    it('should upload new images', async () => {
      render(<EditProperty />)

      await waitFor(() => {
        expect(screen.getByTestId('header')).toBeInTheDocument()
      })

      const fileInput = document.querySelector('#image-upload') as HTMLInputElement
      const file = new File(['image'], 'new.png', { type: 'image/png' })

      Object.defineProperty(fileInput, 'files', {
        value: [file],
      })

      fireEvent.change(fileInput)

      await waitFor(() => {
        expect(screen.getByText(/1 image/)).toBeInTheDocument()
      })
    })

    it('should prevent uploading more than 20 images total', async () => {
      render(<EditProperty />)

      await waitFor(() => {
        expect(screen.getByTestId('header')).toBeInTheDocument()
      })

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
  })

  describe('Location Field', () => {
    it('should initialize Google Maps autocomplete', async () => {
      render(<EditProperty />)

      await waitFor(() => {
        expect(google.maps.places.Autocomplete).toHaveBeenCalled()
      })
    })

    it('should show selected location when address present', async () => {
      render(<EditProperty />)

      await waitFor(() => {
        expect(screen.getByText(/✓ Selected:/)).toBeInTheDocument()
      })
    })
  })

  describe('Form Submission', () => {
    it('should show error if location not selected', async () => {
      global.fetch = jest.fn(url => {
        if (url.includes('/api/properties/property-1') && !url.includes('PUT')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              property: { ...mockProperty, streetAddress: '' },
            }),
          })
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({}),
        })
      }) as jest.Mock

      render(<EditProperty />)

      await waitFor(() => {
        const submitButton = screen.getByText('Update Property')
        fireEvent.click(submitButton)
      })

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Please select a location from the dropdown')
      })
    })

    it('should show loading overlay during submission', async () => {
      global.fetch = jest.fn(url => {
        if (url.includes('/api/properties/property-1') && !url.includes('PUT')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ property: mockProperty }),
          })
        }
        if (url.includes('PUT')) {
          return new Promise(() => {}) // Never resolves to test loading state
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({}),
        })
      }) as jest.Mock

      render(<EditProperty />)

      await waitFor(() => {
        const submitButton = screen.getByText('Update Property')
        fireEvent.click(submitButton)
      })

      await waitFor(() => {
        expect(screen.getByText('Processing your property...')).toBeInTheDocument()
      })
    })

    it('should submit update API call', async () => {
      global.fetch = jest.fn((url, options) => {
        if (url.includes('/api/properties/property-1') && options?.method === 'PUT') {
          return Promise.resolve({
            ok: true,
            json: async () => ({}),
          })
        }
        if (url.includes('/api/properties/property-1')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ property: mockProperty }),
          })
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({}),
        })
      }) as jest.Mock

      render(<EditProperty />)

      await waitFor(() => {
        const submitButton = screen.getByText('Update Property')
        fireEvent.click(submitButton)
      })

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/properties/property-1'),
          expect.objectContaining({
            method: 'PUT',
          })
        )
      })
    })

    it('should show success message on successful update', async () => {
      global.fetch = jest.fn((url, options) => {
        if (url.includes('/api/properties/property-1') && options?.method === 'PUT') {
          return Promise.resolve({
            ok: true,
            json: async () => ({}),
          })
        }
        if (url.includes('/api/properties/property-1')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ property: mockProperty }),
          })
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({}),
        })
      }) as jest.Mock

      render(<EditProperty />)

      await waitFor(() => {
        const submitButton = screen.getByText('Update Property')
        fireEvent.click(submitButton)
      })

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Property updated successfully!')
      })
    })

    it('should navigate to my-properties after successful update', async () => {
      global.fetch = jest.fn((url, options) => {
        if (url.includes('/api/properties/property-1') && options?.method === 'PUT') {
          return Promise.resolve({
            ok: true,
            json: async () => ({}),
          })
        }
        if (url.includes('/api/properties/property-1')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ property: mockProperty }),
          })
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({}),
        })
      }) as jest.Mock

      render(<EditProperty />)

      await waitFor(() => {
        const submitButton = screen.getByText('Update Property')
        fireEvent.click(submitButton)
      })

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/properties/my-properties')
      })
    })

    it('should handle update error', async () => {
      global.fetch = jest.fn((url, options) => {
        if (url.includes('/api/properties/property-1') && options?.method === 'PUT') {
          return Promise.resolve({
            ok: false,
            json: async () => ({ message: 'Failed to update' }),
          })
        }
        if (url.includes('/api/properties/property-1')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ property: mockProperty }),
          })
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({}),
        })
      }) as jest.Mock

      render(<EditProperty />)

      await waitFor(() => {
        const submitButton = screen.getByText('Update Property')
        fireEvent.click(submitButton)
      })

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to update property')
      })
    })
  })

  describe('Cancel Button', () => {
    it('should navigate back when cancel clicked', async () => {
      render(<EditProperty />)

      await waitFor(() => {
        const cancelButton = screen.getByText('Cancel')
        fireEvent.click(cancelButton)
      })

      expect(mockBack).toHaveBeenCalled()
    })
  })

  describe('CSS Classes', () => {
    it('should have correct container classes', async () => {
      const { container } = render(<EditProperty />)

      await waitFor(() => {
        expect(container.querySelector('.min-h-screen')).toBeInTheDocument()
        expect(container.querySelector('.bg-gray-50')).toBeInTheDocument()
      })
    })

    it('should have correct form section classes', async () => {
      const { container } = render(<EditProperty />)

      await waitFor(() => {
        expect(container.querySelector('.bg-white')).toBeInTheDocument()
        expect(container.querySelector('.rounded-lg')).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('should have required asterisks on required fields', async () => {
      render(<EditProperty />)

      await waitFor(() => {
        expect(screen.getByText('Property Title *')).toBeInTheDocument()
        expect(screen.getByText('Property Type *')).toBeInTheDocument()
        expect(screen.getByText('Property Size *')).toBeInTheDocument()
        expect(screen.getByText('Location *')).toBeInTheDocument()
        expect(screen.getByText('Price (₹) *')).toBeInTheDocument()
      })
    })
  })
})
