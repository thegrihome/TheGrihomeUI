import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import AddProjectRequestPage from '@/pages/projects/add-project-request'
import { mockRouter, mockSession, mockFetchSuccess, mockFetchError } from '@/__tests__/utils/test-utils'

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}))

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}))

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line jsx-a11y/alt-text, @next/next/no-img-element
    return <img {...props} />
  },
}))

const mockUserData = {
  user: {
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+919876543210',
    emailVerified: true,
    mobileVerified: true,
  },
}

const mockBuilders = [
  {
    id: 'builder-1',
    name: 'Premier Builders',
    logoUrl: 'https://example.com/logo1.jpg',
  },
  {
    id: 'builder-2',
    name: 'Elite Developers',
    logoUrl: null,
  },
]

describe('Add Project Request Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
    ;(useSession as jest.Mock).mockReturnValue({
      data: mockSession,
      status: 'authenticated',
    })

    // Mock user info fetch
    global.fetch = jest.fn((url: string) => {
      if (url.includes('/api/user/info')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockUserData),
        } as Response)
      }
      if (url.includes('/api/builders')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ builders: mockBuilders }),
        } as Response)
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      } as Response)
    }) as jest.Mock
  })

  describe('Authentication', () => {
    it('redirects unauthenticated users to signin', () => {
      ;(useSession as jest.Mock).mockReturnValue({
        data: null,
        status: 'unauthenticated',
      })

      render(<AddProjectRequestPage />)

      expect(mockRouter.push).toHaveBeenCalledWith('/api/auth/signin')
    })

    it('shows loading spinner during authentication check', () => {
      ;(useSession as jest.Mock).mockReturnValue({
        data: null,
        status: 'loading',
      })

      render(<AddProjectRequestPage />)

      const spinner = document.querySelector('.add-project-request-spinner')
      expect(spinner).toBeInTheDocument()
    })

    it('renders page for authenticated users', async () => {
      render(<AddProjectRequestPage />)

      await waitFor(() => {
        expect(screen.getByText('Add Project Request')).toBeInTheDocument()
      })
    })
  })

  describe('Verification Check', () => {
    it('redirects to userinfo if email not verified', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              user: {
                ...mockUserData.user,
                emailVerified: false,
              },
            }),
        } as Response)
      ) as jest.Mock

      render(<AddProjectRequestPage />)

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/auth/userinfo')
      })
    })

    it('redirects to userinfo if mobile not verified', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              user: {
                ...mockUserData.user,
                mobileVerified: false,
              },
            }),
        } as Response)
      ) as jest.Mock

      render(<AddProjectRequestPage />)

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/auth/userinfo')
      })
    })
  })

  describe('Page Rendering', () => {
    it('renders page title', async () => {
      render(<AddProjectRequestPage />)

      await waitFor(() => {
        expect(screen.getByText('Add Project Request')).toBeInTheDocument()
      })
    })

    it('renders page subtitle', async () => {
      render(<AddProjectRequestPage />)

      await waitFor(() => {
        expect(screen.getByText(/Submit a request to add a new project/i)).toBeInTheDocument()
      })
    })

    it('renders back button', async () => {
      render(<AddProjectRequestPage />)

      await waitFor(() => {
        const backButton = screen.getByText('Back')
        expect(backButton).toBeInTheDocument()
      })
    })

    it('navigates back when back button is clicked', async () => {
      render(<AddProjectRequestPage />)

      await waitFor(() => {
        const backButton = screen.getByText('Back')
        fireEvent.click(backButton)
        expect(mockRouter.back).toHaveBeenCalled()
      })
    })
  })

  describe('Builder Selection', () => {
    it('renders builder search input', async () => {
      render(<AddProjectRequestPage />)

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Search for a builder/i)).toBeInTheDocument()
      })
    })

    it('marks builder selection as required', async () => {
      render(<AddProjectRequestPage />)

      await waitFor(() => {
        const label = screen.getByText(/Select Builder/i)
        const requiredAsterisk = label.querySelector('.request-field__required')
        expect(requiredAsterisk).toBeInTheDocument()
      })
    })

    it('displays builder dropdown when input is focused', async () => {
      render(<AddProjectRequestPage />)

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText(/Search for a builder/i)
        fireEvent.focus(searchInput)
        fireEvent.change(searchInput, { target: { value: '' } })
      })

      await waitFor(() => {
        expect(screen.getByText('Premier Builders')).toBeInTheDocument()
      })
    })

    it('filters builders based on search input', async () => {
      render(<AddProjectRequestPage />)

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText(/Search for a builder/i)
        fireEvent.focus(searchInput)
        fireEvent.change(searchInput, { target: { value: 'Premier' } })
      })

      await waitFor(() => {
        expect(screen.getByText('Premier Builders')).toBeInTheDocument()
      })
    })

    it('displays builder logo when available', async () => {
      render(<AddProjectRequestPage />)

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText(/Search for a builder/i)
        fireEvent.focus(searchInput)
        fireEvent.change(searchInput, { target: { value: '' } })
      })

      await waitFor(() => {
        const images = screen.getAllByRole('img')
        const hasBuilderLogo = images.some(img => img.getAttribute('alt') === 'Premier Builders')
        expect(hasBuilderLogo).toBeTruthy()
      })
    })

    it('displays builder initial when logo not available', async () => {
      render(<AddProjectRequestPage />)

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText(/Search for a builder/i)
        fireEvent.focus(searchInput)
        fireEvent.change(searchInput, { target: { value: '' } })
      })

      await waitFor(() => {
        expect(screen.getByText('E')).toBeInTheDocument()
      })
    })

    it('selects builder when clicked', async () => {
      render(<AddProjectRequestPage />)

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText(/Search for a builder/i)
        fireEvent.focus(searchInput)
        fireEvent.change(searchInput, { target: { value: '' } })
      })

      await waitFor(() => {
        const builderButton = screen.getByText('Premier Builders')
        fireEvent.click(builderButton)

        const searchInput = screen.getByPlaceholderText(/Search for a builder/i) as HTMLInputElement
        expect(searchInput.value).toBe('Premier Builders')
      })
    })

    it('closes dropdown after builder selection', async () => {
      render(<AddProjectRequestPage />)

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText(/Search for a builder/i)
        fireEvent.focus(searchInput)
        fireEvent.change(searchInput, { target: { value: '' } })
      })

      await waitFor(() => {
        const builderButton = screen.getByText('Premier Builders')
        fireEvent.click(builderButton)
      })

      await waitFor(() => {
        const dropdown = screen.queryByText('Elite Developers')
        expect(dropdown).not.toBeInTheDocument()
      })
    })

    it('shows "No builders found" when search yields no results', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ builders: [] }),
        } as Response)
      ) as jest.Mock

      render(<AddProjectRequestPage />)

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText(/Search for a builder/i)
        fireEvent.focus(searchInput)
        fireEvent.change(searchInput, { target: { value: 'NonexistentBuilder' } })
      })

      await waitFor(() => {
        expect(screen.getByText('No builders found')).toBeInTheDocument()
      })
    })
  })

  describe('Project Information Fields', () => {
    it('renders project name input', async () => {
      render(<AddProjectRequestPage />)

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Enter project name/i)).toBeInTheDocument()
      })
    })

    it('renders project type selector with all options', async () => {
      render(<AddProjectRequestPage />)

      await waitFor(() => {
        expect(screen.getByText(/🏠 Residential/i)).toBeInTheDocument()
        expect(screen.getByText(/🏢 Commercial/i)).toBeInTheDocument()
        expect(screen.getByText(/🏛️ Mixed Use/i)).toBeInTheDocument()
        expect(screen.getByText(/🏭 Industrial/i)).toBeInTheDocument()
      })
    })

    it('renders location input', async () => {
      render(<AddProjectRequestPage />)

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Enter complete address/i)).toBeInTheDocument()
      })
    })

    it('renders description textarea', async () => {
      render(<AddProjectRequestPage />)

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Brief description of the project/i)).toBeInTheDocument()
      })
    })

    it('allows typing in project name', async () => {
      render(<AddProjectRequestPage />)

      await waitFor(() => {
        const input = screen.getByPlaceholderText(/Enter project name/i)
        fireEvent.change(input, { target: { value: 'Premium Towers' } })
        expect(input).toHaveValue('Premium Towers')
      })
    })

    it('allows changing project type', async () => {
      render(<AddProjectRequestPage />)

      await waitFor(() => {
        const select = screen.getByRole('combobox')
        fireEvent.change(select, { target: { value: 'COMMERCIAL' } })
        expect(select).toHaveValue('COMMERCIAL')
      })
    })
  })

  describe('Contact Information', () => {
    it('auto-populates first name', async () => {
      render(<AddProjectRequestPage />)

      await waitFor(() => {
        const input = screen.getByDisplayValue('John')
        expect(input).toBeInTheDocument()
      })
    })

    it('auto-populates last name', async () => {
      render(<AddProjectRequestPage />)

      await waitFor(() => {
        const input = screen.getByDisplayValue('Doe')
        expect(input).toBeInTheDocument()
      })
    })

    it('auto-populates email', async () => {
      render(<AddProjectRequestPage />)

      await waitFor(() => {
        const input = screen.getByDisplayValue('john@example.com')
        expect(input).toBeInTheDocument()
      })
    })

    it('auto-populates phone', async () => {
      render(<AddProjectRequestPage />)

      await waitFor(() => {
        const input = screen.getByDisplayValue('+919876543210')
        expect(input).toBeInTheDocument()
      })
    })

    it('makes contact fields read-only', async () => {
      render(<AddProjectRequestPage />)

      await waitFor(() => {
        const emailInput = screen.getByDisplayValue('john@example.com')
        expect(emailInput).toHaveClass('cursor-not-allowed')
      })
    })

    it('shows verified status when email is verified', async () => {
      render(<AddProjectRequestPage />)

      await waitFor(() => {
        const verifiedBadges = screen.getAllByText(/✓ Verified/i)
        expect(verifiedBadges.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Email Verification UI', () => {
    beforeEach(() => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              user: {
                ...mockUserData.user,
                emailVerified: false,
                mobileVerified: true,
              },
            }),
        } as Response)
      ) as jest.Mock
    })

    it('shows verify button for unverified email', async () => {
      render(<AddProjectRequestPage />)

      await waitFor(() => {
        // Check if there's a verification section visible
        const verifyButtons = screen.queryAllByText(/Verify/i)
        expect(verifyButtons.length).toBeGreaterThan(0)
      })
    })

    it('displays OTP input after clicking verify', async () => {
      render(<AddProjectRequestPage />)

      await waitFor(async () => {
        const verifyButton = screen.getAllByText(/Verify/i)[0]
        fireEvent.click(verifyButton)

        await waitFor(() => {
          const otpInputs = screen.getAllByPlaceholderText(/Enter 6-digit OTP/i)
          expect(otpInputs.length).toBeGreaterThan(0)
        })
      })
    })

    it('limits OTP input to 6 digits', async () => {
      render(<AddProjectRequestPage />)

      await waitFor(async () => {
        const verifyButton = screen.getAllByText(/Verify/i)[0]
        fireEvent.click(verifyButton)

        await waitFor(() => {
          const otpInputs = screen.getAllByPlaceholderText(/Enter 6-digit OTP/i)
          expect(otpInputs[0]).toHaveAttribute('maxLength', '6')
        })
      })
    })

    it('shows submit OTP button', async () => {
      render(<AddProjectRequestPage />)

      await waitFor(async () => {
        const verifyButton = screen.getAllByText(/Verify/i)[0]
        fireEvent.click(verifyButton)

        await waitFor(() => {
          expect(screen.getByText(/Submit OTP/i)).toBeInTheDocument()
        })
      })
    })
  })

  describe('Mobile Verification UI', () => {
    beforeEach(() => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              user: {
                ...mockUserData.user,
                emailVerified: true,
                mobileVerified: false,
              },
            }),
        } as Response)
      ) as jest.Mock
    })

    it('shows verify button for unverified mobile', async () => {
      render(<AddProjectRequestPage />)

      await waitFor(() => {
        const verifyButtons = screen.queryAllByText(/Verify/i)
        expect(verifyButtons.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Form Validation', () => {
    it('requires builder selection', async () => {
      render(<AddProjectRequestPage />)

      await waitFor(() => {
        const submitButton = screen.getByText(/Submit Project Request/i)
        fireEvent.click(submitButton)
        // Should show validation error
      })
    })

    it('requires project name', async () => {
      render(<AddProjectRequestPage />)

      await waitFor(() => {
        const projectNameInput = screen.getByPlaceholderText(/Enter project name/i)
        expect(projectNameInput).toBeRequired()
      })
    })

    it('requires project type', async () => {
      render(<AddProjectRequestPage />)

      await waitFor(() => {
        const projectTypeSelect = screen.getByRole('combobox')
        expect(projectTypeSelect).toBeRequired()
      })
    })

    it('requires location', async () => {
      render(<AddProjectRequestPage />)

      await waitFor(() => {
        const locationInput = screen.getByPlaceholderText(/Enter complete address/i)
        expect(locationInput).toBeRequired()
      })
    })

    it('validates email format', async () => {
      render(<AddProjectRequestPage />)

      await waitFor(() => {
        const emailInputs = screen.getAllByRole('textbox')
        const emailInput = emailInputs.find(input => (input as HTMLInputElement).type === 'email')
        expect(emailInput).toBeInTheDocument()
      })
    })

    it('disables submit when email not verified', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              user: {
                ...mockUserData.user,
                emailVerified: false,
              },
            }),
        } as Response)
      ) as jest.Mock

      render(<AddProjectRequestPage />)

      await waitFor(() => {
        const submitButton = screen.getByText(/Submit Project Request/i)
        expect(submitButton).toBeDisabled()
      })
    })

    it('disables submit when mobile not verified', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              user: {
                ...mockUserData.user,
                mobileVerified: false,
              },
            }),
        } as Response)
      ) as jest.Mock

      render(<AddProjectRequestPage />)

      await waitFor(() => {
        const submitButton = screen.getByText(/Submit Project Request/i)
        expect(submitButton).toBeDisabled()
      })
    })
  })

  describe('Form Submission', () => {
    it('shows loading state during submission', async () => {
      global.fetch = jest.fn(() =>
        new Promise(resolve => {
          setTimeout(() => {
            resolve({
              ok: true,
              json: () => Promise.resolve({}),
            } as Response)
          }, 100)
        })
      ) as jest.Mock

      render(<AddProjectRequestPage />)

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText(/Search for a builder/i)
        fireEvent.focus(searchInput)
        fireEvent.change(searchInput, { target: { value: 'Premier' } })
      })

      await waitFor(() => {
        const builderButton = screen.getByText('Premier Builders')
        fireEvent.click(builderButton)
      })

      await waitFor(() => {
        const projectInput = screen.getByPlaceholderText(/Enter project name/i)
        fireEvent.change(projectInput, { target: { value: 'Test Project' } })

        const locationInput = screen.getByPlaceholderText(/Enter complete address/i)
        fireEvent.change(locationInput, { target: { value: 'Test Location' } })

        const submitButton = screen.getByText(/Submit Project Request/i)
        fireEvent.click(submitButton)
      })

      await waitFor(() => {
        expect(screen.getByText(/Submitting Request.../i)).toBeInTheDocument()
      })
    })

    it('redirects to properties page after successful submission', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        } as Response)
      ) as jest.Mock

      render(<AddProjectRequestPage />)

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText(/Search for a builder/i)
        fireEvent.focus(searchInput)
        fireEvent.change(searchInput, { target: { value: 'Premier' } })
      })

      await waitFor(() => {
        const builderButton = screen.getByText('Premier Builders')
        fireEvent.click(builderButton)
      })

      await waitFor(() => {
        const projectInput = screen.getByPlaceholderText(/Enter project name/i)
        fireEvent.change(projectInput, { target: { value: 'Test Project' } })

        const locationInput = screen.getByPlaceholderText(/Enter complete address/i)
        fireEvent.change(locationInput, { target: { value: 'Test Location' } })

        const submitButton = screen.getByText(/Submit Project Request/i)
        fireEvent.click(submitButton)
      })

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/properties')
      })
    })

    it('handles submission errors', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ message: 'Submission failed' }),
        } as Response)
      ) as jest.Mock

      render(<AddProjectRequestPage />)

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText(/Search for a builder/i)
        fireEvent.focus(searchInput)
        fireEvent.change(searchInput, { target: { value: 'Premier' } })
      })

      await waitFor(() => {
        const builderButton = screen.getByText('Premier Builders')
        fireEvent.click(builderButton)
      })

      await waitFor(() => {
        const projectInput = screen.getByPlaceholderText(/Enter project name/i)
        fireEvent.change(projectInput, { target: { value: 'Test Project' } })

        const locationInput = screen.getByPlaceholderText(/Enter complete address/i)
        fireEvent.change(locationInput, { target: { value: 'Test Location' } })

        const submitButton = screen.getByText(/Submit Project Request/i)
        fireEvent.click(submitButton)
      })

      await waitFor(() => {
        expect(mockRouter.push).not.toHaveBeenCalledWith('/properties')
      })
    })
  })

  describe('Additional Information', () => {
    it('renders additional info textarea', async () => {
      render(<AddProjectRequestPage />)

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Any additional information/i)).toBeInTheDocument()
      })
    })

    it('allows typing in additional info field', async () => {
      render(<AddProjectRequestPage />)

      await waitFor(() => {
        const textarea = screen.getByPlaceholderText(/Any additional information/i)
        fireEvent.change(textarea, { target: { value: 'Some notes' } })
        expect(textarea).toHaveValue('Some notes')
      })
    })
  })

  describe('Disclaimer', () => {
    it('displays submission disclaimer', async () => {
      render(<AddProjectRequestPage />)

      await waitFor(() => {
        expect(screen.getByText(/By submitting this request/i)).toBeInTheDocument()
      })
    })
  })

  describe('Verification Error Message', () => {
    it('shows verification error when not verified', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              user: {
                ...mockUserData.user,
                emailVerified: false,
              },
            }),
        } as Response)
      ) as jest.Mock

      render(<AddProjectRequestPage />)

      await waitFor(() => {
        expect(screen.getByText(/Please verify your email and phone number/i)).toBeInTheDocument()
      })
    })
  })
})
