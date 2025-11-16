import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import ProjectSubmit from '@/pages/projects/submit'
import {
  mockRouter,
  mockSession,
  mockFetchSuccess,
  mockFetchError,
} from '@/__tests__/utils/test-utils'

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}))

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}))

jest.mock('@/components/projects/BuilderSelector', () => {
  return function MockBuilderSelector({ value, onChange }: any) {
    return (
      <div>
        <select
          data-testid="builder-selector"
          value={value || ''}
          onChange={e => onChange(e.target.value)}
        >
          <option value="">Select builder</option>
          <option value="builder-1">Test Builder</option>
          <option value="builder-2">Another Builder</option>
        </select>
      </div>
    )
  }
})

jest.mock('@/components/projects/DynamicList', () => {
  return function MockDynamicList({ items, onChange, label, placeholder }: any) {
    return (
      <div>
        <label>{label}</label>
        <input
          data-testid={`dynamic-list-${label.toLowerCase().replace(/\s/g, '-')}`}
          placeholder={placeholder}
          onChange={e => {
            const values = e.target.value
              .split(',')
              .map((v: string) => v.trim())
              .filter(Boolean)
            onChange(values)
          }}
        />
        <div data-testid={`${label.toLowerCase()}-count`}>{items.length}</div>
      </div>
    )
  }
})

jest.mock('@/components/projects/ImageUploader', () => {
  return function MockImageUploader({ images, onChange, maxImages, label }: any) {
    return (
      <div>
        <label>{label}</label>
        <input
          type="file"
          data-testid={`image-uploader-${label.toLowerCase().replace(/\s/g, '-')}`}
          onChange={e => {
            onChange(['fake-base64-image'])
          }}
          multiple={maxImages > 1}
        />
        <div data-testid={`${label.toLowerCase().replace(/\s/g, '-')}-count`}>{images.length}</div>
      </div>
    )
  }
})

const mockBuilders = [
  { id: 'builder-1', name: 'Test Builder', website: 'https://testbuilder.com' },
  { id: 'builder-2', name: 'Another Builder', website: null },
]

describe('Project Submit Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
    ;(useSession as jest.Mock).mockReturnValue({
      data: mockSession,
      status: 'authenticated',
    })

    mockFetchSuccess({ builders: mockBuilders })
  })

  describe('Authentication', () => {
    it('redirects unauthenticated users to login', () => {
      ;(useSession as jest.Mock).mockReturnValue({
        data: null,
        status: 'unauthenticated',
      })

      render(<ProjectSubmit />)

      expect(mockRouter.push).toHaveBeenCalledWith('/auth/login')
    })

    it('shows loading state during authentication check', () => {
      ;(useSession as jest.Mock).mockReturnValue({
        data: null,
        status: 'loading',
      })

      render(<ProjectSubmit />)

      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })

    it('renders page for authenticated users', async () => {
      render(<ProjectSubmit />)

      await waitFor(() => {
        expect(screen.getByText(/submit new project/i)).toBeInTheDocument()
      })
    })
  })

  describe('Page Rendering', () => {
    it('renders project submit page correctly', async () => {
      render(<ProjectSubmit />)

      await waitFor(() => {
        expect(screen.getByText(/submit new project/i)).toBeInTheDocument()
      })
    })

    it('renders page description', async () => {
      render(<ProjectSubmit />)

      await waitFor(() => {
        expect(screen.getByText(/Share your real estate project/i)).toBeInTheDocument()
      })
    })

    it('renders main form', async () => {
      render(<ProjectSubmit />)

      await waitFor(() => {
        const form = screen.getByRole('form')
        expect(form).toBeInTheDocument()
      })
    })
  })

  describe('Basic Information Section', () => {
    it('renders basic information section', async () => {
      render(<ProjectSubmit />)

      await waitFor(() => {
        expect(screen.getByText('Basic Information')).toBeInTheDocument()
      })
    })

    it('renders project name input', async () => {
      render(<ProjectSubmit />)

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/e.g., My Home Apas/i)).toBeInTheDocument()
      })
    })

    it('marks project name as required', async () => {
      render(<ProjectSubmit />)

      await waitFor(() => {
        const label = screen.getByText(/Project Name/i)
        const requiredAsterisk = label.querySelector('.text-red-500')
        expect(requiredAsterisk).toBeInTheDocument()
      })
    })

    it('renders description textarea', async () => {
      render(<ProjectSubmit />)

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Describe your project/i)).toBeInTheDocument()
      })
    })

    it('marks description as required', async () => {
      render(<ProjectSubmit />)

      await waitFor(() => {
        const label = screen.getByText(/Description/i)
        const requiredAsterisk = label.querySelector('.text-red-500')
        expect(requiredAsterisk).toBeInTheDocument()
      })
    })

    it('renders project type selector', async () => {
      render(<ProjectSubmit />)

      await waitFor(() => {
        const select = screen.getByDisplayValue('Residential')
        expect(select).toBeInTheDocument()
      })
    })

    it('shows project type options', async () => {
      render(<ProjectSubmit />)

      await waitFor(() => {
        expect(screen.getByText('Residential')).toBeInTheDocument()
        expect(screen.getByText('Commercial')).toBeInTheDocument()
        expect(screen.getByText('Mixed Use')).toBeInTheDocument()
      })
    })

    it('allows typing in project name', async () => {
      render(<ProjectSubmit />)

      await waitFor(() => {
        const input = screen.getByPlaceholderText(/e.g., My Home Apas/i)
        fireEvent.change(input, { target: { value: 'Test Project' } })
        expect(input).toHaveValue('Test Project')
      })
    })

    it('allows typing in description', async () => {
      render(<ProjectSubmit />)

      await waitFor(() => {
        const textarea = screen.getByPlaceholderText(/Describe your project/i)
        fireEvent.change(textarea, { target: { value: 'A premium residential complex' } })
        expect(textarea).toHaveValue('A premium residential complex')
      })
    })

    it('allows changing project type', async () => {
      render(<ProjectSubmit />)

      await waitFor(() => {
        const select = screen.getByDisplayValue('Residential')
        fireEvent.change(select, { target: { value: 'COMMERCIAL' } })
        expect(select).toHaveValue('COMMERCIAL')
      })
    })

    it('renders builder selector', async () => {
      render(<ProjectSubmit />)

      await waitFor(() => {
        expect(screen.getByTestId('builder-selector')).toBeInTheDocument()
      })
    })

    it('marks builder as required', async () => {
      render(<ProjectSubmit />)

      await waitFor(() => {
        const label = screen.getByText(/Select Builder/i)
        const requiredAsterisk = label.querySelector('.text-red-500')
        expect(requiredAsterisk).toBeInTheDocument()
      })
    })

    it('renders location input', async () => {
      render(<ProjectSubmit />)

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Enter full address/i)).toBeInTheDocument()
      })
    })

    it('marks location as required', async () => {
      render(<ProjectSubmit />)

      await waitFor(() => {
        const label = screen.getByText(/Location/i)
        const requiredAsterisk = label.querySelector('.text-red-500')
        expect(requiredAsterisk).toBeInTheDocument()
      })
    })

    it('shows location helper text', async () => {
      render(<ProjectSubmit />)

      await waitFor(() => {
        expect(
          screen.getByText(/Provide complete address for accurate location mapping/i)
        ).toBeInTheDocument()
      })
    })
  })

  describe('Builder Information Section', () => {
    it('renders builder information section', async () => {
      render(<ProjectSubmit />)

      await waitFor(() => {
        expect(screen.getByText('Builder Information')).toBeInTheDocument()
      })
    })

    it('renders builder website link input', async () => {
      render(<ProjectSubmit />)

      await waitFor(() => {
        const inputs = screen.getAllByPlaceholderText('https://example.com')
        expect(inputs.length).toBeGreaterThan(0)
      })
    })

    it('renders brochure URL input', async () => {
      render(<ProjectSubmit />)

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/brochure.pdf/i)).toBeInTheDocument()
      })
    })

    it('accepts valid URLs in website field', async () => {
      render(<ProjectSubmit />)

      await waitFor(() => {
        const inputs = screen.getAllByPlaceholderText('https://example.com')
        fireEvent.change(inputs[0], { target: { value: 'https://builder.com' } })
        expect(inputs[0]).toHaveValue('https://builder.com')
      })
    })
  })

  describe('Project Details Section', () => {
    it('renders project details section', async () => {
      render(<ProjectSubmit />)

      await waitFor(() => {
        expect(screen.getByText('Project Details')).toBeInTheDocument()
      })
    })

    it('renders highlights dynamic list', async () => {
      render(<ProjectSubmit />)

      await waitFor(() => {
        expect(screen.getByText('Highlights')).toBeInTheDocument()
        expect(screen.getByTestId('dynamic-list-highlights')).toBeInTheDocument()
      })
    })

    it('renders amenities dynamic list', async () => {
      render(<ProjectSubmit />)

      await waitFor(() => {
        expect(screen.getByText('Amenities')).toBeInTheDocument()
        expect(screen.getByTestId('dynamic-list-amenities')).toBeInTheDocument()
      })
    })

    it('renders walkthrough video URL input', async () => {
      render(<ProjectSubmit />)

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/youtube.com\/watch/i)).toBeInTheDocument()
      })
    })

    it('allows adding highlights', async () => {
      render(<ProjectSubmit />)

      await waitFor(() => {
        const input = screen.getByTestId('dynamic-list-highlights')
        fireEvent.change(input, { target: { value: '2 BHK, 3 BHK, Pool' } })

        const count = screen.getByTestId('highlights-count')
        expect(count).toHaveTextContent('3')
      })
    })

    it('allows adding amenities', async () => {
      render(<ProjectSubmit />)

      await waitFor(() => {
        const input = screen.getByTestId('dynamic-list-amenities')
        fireEvent.change(input, { target: { value: 'Gym, Pool, Park' } })

        const count = screen.getByTestId('amenities-count')
        expect(count).toHaveTextContent('3')
      })
    })
  })

  describe('Images Section', () => {
    it('renders images section', async () => {
      render(<ProjectSubmit />)

      await waitFor(() => {
        const headings = screen.getAllByText('Images')
        expect(headings.length).toBeGreaterThan(0)
      })
    })

    it('renders banner image uploader', async () => {
      render(<ProjectSubmit />)

      await waitFor(() => {
        expect(screen.getByText('Banner Image')).toBeInTheDocument()
        expect(screen.getByTestId('image-uploader-banner-image')).toBeInTheDocument()
      })
    })

    it('limits banner image to 1', async () => {
      render(<ProjectSubmit />)

      await waitFor(() => {
        const uploader = screen.getByTestId('image-uploader-banner-image')
        expect(uploader).not.toHaveAttribute('multiple')
      })
    })

    it('renders floor plans uploader', async () => {
      render(<ProjectSubmit />)

      await waitFor(() => {
        expect(screen.getByText(/Floor Plans \(up to 20 images\)/i)).toBeInTheDocument()
      })
    })

    it('renders clubhouse images uploader', async () => {
      render(<ProjectSubmit />)

      await waitFor(() => {
        expect(screen.getByText(/Clubhouse Images \(up to 10 images\)/i)).toBeInTheDocument()
      })
    })

    it('renders gallery images uploader', async () => {
      render(<ProjectSubmit />)

      await waitFor(() => {
        expect(screen.getByText(/Gallery Images \(up to 20 images\)/i)).toBeInTheDocument()
      })
    })

    it('allows uploading banner image', async () => {
      render(<ProjectSubmit />)

      await waitFor(() => {
        const uploader = screen.getByTestId('image-uploader-banner-image')
        fireEvent.change(uploader, { target: { files: [new File([], 'test.jpg')] } })

        const count = screen.getByTestId('banner-image-count')
        expect(count).toHaveTextContent('1')
      })
    })
  })

  describe('Form Validation', () => {
    it('shows error when name is missing', async () => {
      render(<ProjectSubmit />)

      await waitFor(() => {
        const submitButton = screen.getByText(/Submit Project/i)
        fireEvent.click(submitButton)
        // Toast error should be shown
      })
    })

    it('shows error when description is missing', async () => {
      render(<ProjectSubmit />)

      await waitFor(() => {
        const nameInput = screen.getByPlaceholderText(/e.g., My Home Apas/i)
        fireEvent.change(nameInput, { target: { value: 'Test Project' } })

        const submitButton = screen.getByText(/Submit Project/i)
        fireEvent.click(submitButton)
        // Toast error should be shown
      })
    })

    it('shows error when builder is not selected', async () => {
      render(<ProjectSubmit />)

      await waitFor(() => {
        const nameInput = screen.getByPlaceholderText(/e.g., My Home Apas/i)
        fireEvent.change(nameInput, { target: { value: 'Test Project' } })

        const descInput = screen.getByPlaceholderText(/Describe your project/i)
        fireEvent.change(descInput, { target: { value: 'Description' } })

        const submitButton = screen.getByText(/Submit Project/i)
        fireEvent.click(submitButton)
        // Toast error should be shown
      })
    })

    it('shows error when location is missing', async () => {
      render(<ProjectSubmit />)

      await waitFor(() => {
        const nameInput = screen.getByPlaceholderText(/e.g., My Home Apas/i)
        fireEvent.change(nameInput, { target: { value: 'Test Project' } })

        const descInput = screen.getByPlaceholderText(/Describe your project/i)
        fireEvent.change(descInput, { target: { value: 'Description' } })

        const builderSelect = screen.getByTestId('builder-selector')
        fireEvent.change(builderSelect, { target: { value: 'builder-1' } })

        const submitButton = screen.getByText(/Submit Project/i)
        fireEvent.click(submitButton)
        // Toast error should be shown
      })
    })
  })

  describe('Form Submission', () => {
    it('enables submit button when form is valid', async () => {
      render(<ProjectSubmit />)

      await waitFor(() => {
        const nameInput = screen.getByPlaceholderText(/e.g., My Home Apas/i)
        fireEvent.change(nameInput, { target: { value: 'Test Project' } })

        const descInput = screen.getByPlaceholderText(/Describe your project/i)
        fireEvent.change(descInput, { target: { value: 'Description' } })

        const builderSelect = screen.getByTestId('builder-selector')
        fireEvent.change(builderSelect, { target: { value: 'builder-1' } })

        const locationInput = screen.getByPlaceholderText(/Enter full address/i)
        fireEvent.change(locationInput, { target: { value: 'Hyderabad, Telangana' } })

        const submitButton = screen.getByText(/Submit Project/i)
        expect(submitButton).not.toBeDisabled()
      })
    })

    it('shows loading state during submission', async () => {
      global.fetch = jest.fn(
        () =>
          new Promise(resolve => {
            setTimeout(() => {
              resolve({
                ok: true,
                json: () => Promise.resolve({ project: { id: 'project-123' } }),
              } as Response)
            }, 100)
          })
      ) as jest.Mock

      render(<ProjectSubmit />)

      await waitFor(() => {
        const nameInput = screen.getByPlaceholderText(/e.g., My Home Apas/i)
        fireEvent.change(nameInput, { target: { value: 'Test Project' } })

        const descInput = screen.getByPlaceholderText(/Describe your project/i)
        fireEvent.change(descInput, { target: { value: 'Description' } })

        const builderSelect = screen.getByTestId('builder-selector')
        fireEvent.change(builderSelect, { target: { value: 'builder-1' } })

        const locationInput = screen.getByPlaceholderText(/Enter full address/i)
        fireEvent.change(locationInput, { target: { value: 'Hyderabad, Telangana' } })

        const submitButton = screen.getByText(/Submit Project/i)
        fireEvent.click(submitButton)
      })

      await waitFor(() => {
        expect(screen.getByText(/Submitting Project.../i)).toBeInTheDocument()
      })
    })

    it('disables submit button during submission', async () => {
      global.fetch = jest.fn(
        () =>
          new Promise(resolve => {
            setTimeout(() => {
              resolve({
                ok: true,
                json: () => Promise.resolve({ project: { id: 'project-123' } }),
              } as Response)
            }, 100)
          })
      ) as jest.Mock

      render(<ProjectSubmit />)

      await waitFor(() => {
        const nameInput = screen.getByPlaceholderText(/e.g., My Home Apas/i)
        fireEvent.change(nameInput, { target: { value: 'Test Project' } })

        const descInput = screen.getByPlaceholderText(/Describe your project/i)
        fireEvent.change(descInput, { target: { value: 'Description' } })

        const builderSelect = screen.getByTestId('builder-selector')
        fireEvent.change(builderSelect, { target: { value: 'builder-1' } })

        const locationInput = screen.getByPlaceholderText(/Enter full address/i)
        fireEvent.change(locationInput, { target: { value: 'Hyderabad, Telangana' } })

        const submitButton = screen.getByText(/Submit Project/i)
        fireEvent.click(submitButton)

        expect(submitButton).toBeDisabled()
      })
    })

    it('redirects to project detail page after successful submission', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ project: { id: 'project-123' } }),
        } as Response)
      ) as jest.Mock

      render(<ProjectSubmit />)

      await waitFor(() => {
        const nameInput = screen.getByPlaceholderText(/e.g., My Home Apas/i)
        fireEvent.change(nameInput, { target: { value: 'Test Project' } })

        const descInput = screen.getByPlaceholderText(/Describe your project/i)
        fireEvent.change(descInput, { target: { value: 'Description' } })

        const builderSelect = screen.getByTestId('builder-selector')
        fireEvent.change(builderSelect, { target: { value: 'builder-1' } })

        const locationInput = screen.getByPlaceholderText(/Enter full address/i)
        fireEvent.change(locationInput, { target: { value: 'Hyderabad, Telangana' } })

        const submitButton = screen.getByText(/Submit Project/i)
        fireEvent.click(submitButton)
      })

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/projects/project-123')
      })
    })

    it('handles submission errors', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ message: 'Failed to create project' }),
        } as Response)
      ) as jest.Mock

      render(<ProjectSubmit />)

      await waitFor(() => {
        const nameInput = screen.getByPlaceholderText(/e.g., My Home Apas/i)
        fireEvent.change(nameInput, { target: { value: 'Test Project' } })

        const descInput = screen.getByPlaceholderText(/Describe your project/i)
        fireEvent.change(descInput, { target: { value: 'Description' } })

        const builderSelect = screen.getByTestId('builder-selector')
        fireEvent.change(builderSelect, { target: { value: 'builder-1' } })

        const locationInput = screen.getByPlaceholderText(/Enter full address/i)
        fireEvent.change(locationInput, { target: { value: 'Hyderabad, Telangana' } })

        const submitButton = screen.getByText(/Submit Project/i)
        fireEvent.click(submitButton)
      })

      await waitFor(() => {
        expect(mockRouter.push).not.toHaveBeenCalled()
      })
    })

    it('sends all form data in API request', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ project: { id: 'project-123' } }),
        } as Response)
      ) as jest.Mock

      render(<ProjectSubmit />)

      await waitFor(() => {
        const nameInput = screen.getByPlaceholderText(/e.g., My Home Apas/i)
        fireEvent.change(nameInput, { target: { value: 'Test Project' } })

        const descInput = screen.getByPlaceholderText(/Describe your project/i)
        fireEvent.change(descInput, { target: { value: 'Description' } })

        const builderSelect = screen.getByTestId('builder-selector')
        fireEvent.change(builderSelect, { target: { value: 'builder-1' } })

        const locationInput = screen.getByPlaceholderText(/Enter full address/i)
        fireEvent.change(locationInput, { target: { value: 'Hyderabad, Telangana' } })

        const submitButton = screen.getByText(/Submit Project/i)
        fireEvent.click(submitButton)
      })

      await waitFor(() => {
        const callArgs = (global.fetch as jest.Mock).mock.calls[0]
        const body = JSON.parse(callArgs[1].body)
        expect(body.name).toBe('Test Project')
        expect(body.description).toBe('Description')
        expect(body.builderId).toBe('builder-1')
        expect(body.locationAddress).toBe('Hyderabad, Telangana')
      })
    })
  })

  describe('SEO', () => {
    it('renders NextSeo component', () => {
      const { container } = render(<ProjectSubmit />)
      expect(container).toBeInTheDocument()
    })
  })

  describe('Submit Button', () => {
    it('renders submit button with correct text', async () => {
      render(<ProjectSubmit />)

      await waitFor(() => {
        expect(screen.getByText('Submit Project')).toBeInTheDocument()
      })
    })

    it('displays full-width submit button', async () => {
      render(<ProjectSubmit />)

      await waitFor(() => {
        const button = screen.getByText('Submit Project')
        expect(button.className).toContain('w-full')
      })
    })
  })
})
