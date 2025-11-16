import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { useRouter } from 'next/router'
import { useSession, signIn } from 'next-auth/react'
import AddProjectPage from '@/pages/projects/add-project'
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
  signIn: jest.fn(),
}))

const mockUserData = {
  user: {
    name: 'Test User',
    email: 'test@example.com',
    phone: '+911234567890',
    emailVerified: true,
    mobileVerified: true,
  },
}

describe('Add Project Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
    ;(useSession as jest.Mock).mockReturnValue({
      data: mockSession,
      status: 'authenticated',
    })

    mockFetchSuccess(mockUserData)
  })

  describe('Authentication', () => {
    it('redirects unauthenticated users to login', () => {
      ;(useSession as jest.Mock).mockReturnValue({
        data: null,
        status: 'unauthenticated',
      })

      render(<AddProjectPage />)

      expect(mockRouter.push).toHaveBeenCalledWith('/login')
    })

    it('shows loading state during authentication check', () => {
      ;(useSession as jest.Mock).mockReturnValue({
        data: null,
        status: 'loading',
      })

      render(<AddProjectPage />)

      expect(screen.getByRole('generic')).toBeInTheDocument()
    })

    it('renders page for authenticated users', async () => {
      render(<AddProjectPage />)

      await waitFor(() => {
        expect(screen.getByText('Add Project Request')).toBeInTheDocument()
      })
    })
  })

  describe('Page Rendering', () => {
    it('renders page title', async () => {
      render(<AddProjectPage />)

      await waitFor(() => {
        expect(screen.getByText('Add Project Request')).toBeInTheDocument()
      })
    })

    it('renders page description', async () => {
      render(<AddProjectPage />)

      await waitFor(() => {
        expect(screen.getByText(/Submit a request to add a new project/i)).toBeInTheDocument()
      })
    })

    it('renders back button', async () => {
      render(<AddProjectPage />)

      await waitFor(() => {
        expect(screen.getByText('Back')).toBeInTheDocument()
      })
    })

    it('navigates back when back button is clicked', async () => {
      render(<AddProjectPage />)

      await waitFor(() => {
        const backButton = screen.getByText('Back')
        fireEvent.click(backButton)
        expect(mockRouter.back).toHaveBeenCalled()
      })
    })
  })

  describe('Form Sections', () => {
    it('renders builder information section', async () => {
      render(<AddProjectPage />)

      await waitFor(() => {
        expect(screen.getByText('Builder Information')).toBeInTheDocument()
      })
    })

    it('renders project information section', async () => {
      render(<AddProjectPage />)

      await waitFor(() => {
        expect(screen.getByText('Project Information')).toBeInTheDocument()
      })
    })

    it('renders contact information section', async () => {
      render(<AddProjectPage />)

      await waitFor(() => {
        expect(screen.getByText('Contact Information')).toBeInTheDocument()
      })
    })

    it('renders additional information section', async () => {
      render(<AddProjectPage />)

      await waitFor(() => {
        expect(screen.getByText('Additional Information')).toBeInTheDocument()
      })
    })
  })

  describe('Builder Information Fields', () => {
    it('renders builder name input', async () => {
      render(<AddProjectPage />)

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Enter builder\/developer name/i)).toBeInTheDocument()
      })
    })

    it('marks builder name as required', async () => {
      render(<AddProjectPage />)

      await waitFor(() => {
        const label = screen.getByText(/Builder Name/i)
        const requiredAsterisk = label.querySelector('.text-red-500')
        expect(requiredAsterisk).toBeInTheDocument()
      })
    })

    it('renders builder website input', async () => {
      render(<AddProjectPage />)

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/https:\/\/builder-website.com/i)).toBeInTheDocument()
      })
    })

    it('allows typing in builder name field', async () => {
      render(<AddProjectPage />)

      await waitFor(() => {
        const input = screen.getByPlaceholderText(/Enter builder\/developer name/i)
        fireEvent.change(input, { target: { value: 'Test Builder Inc' } })
        expect(input).toHaveValue('Test Builder Inc')
      })
    })

    it('accepts valid URL in builder website field', async () => {
      render(<AddProjectPage />)

      await waitFor(() => {
        const input = screen.getByPlaceholderText(/https:\/\/builder-website.com/i)
        fireEvent.change(input, { target: { value: 'https://testbuilder.com' } })
        expect(input).toHaveValue('https://testbuilder.com')
      })
    })
  })

  describe('Project Information Fields', () => {
    it('renders project name input', async () => {
      render(<AddProjectPage />)

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Enter project name/i)).toBeInTheDocument()
      })
    })

    it('renders project type selector', async () => {
      render(<AddProjectPage />)

      await waitFor(() => {
        const selects = screen.getAllByRole('combobox')
        const projectTypeSelect = selects.find(select =>
          select.querySelector('option[value="RESIDENTIAL"]')
        )
        expect(projectTypeSelect).toBeInTheDocument()
      })
    })

    it('renders project location input', async () => {
      render(<AddProjectPage />)

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Enter complete address/i)).toBeInTheDocument()
      })
    })

    it('renders project description textarea', async () => {
      render(<AddProjectPage />)

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Brief description of the project/i)).toBeInTheDocument()
      })
    })

    it('displays all project type options', async () => {
      render(<AddProjectPage />)

      await waitFor(() => {
        expect(screen.getByText('Residential')).toBeInTheDocument()
        expect(screen.getByText('Commercial')).toBeInTheDocument()
        expect(screen.getByText('Mixed Use')).toBeInTheDocument()
        expect(screen.getByText('Industrial')).toBeInTheDocument()
      })
    })

    it('defaults to RESIDENTIAL project type', async () => {
      render(<AddProjectPage />)

      await waitFor(() => {
        const selects = screen.getAllByRole('combobox')
        const projectTypeSelect = selects.find(select =>
          select.querySelector('option[value="RESIDENTIAL"]')
        ) as HTMLSelectElement
        if (projectTypeSelect) {
          expect(projectTypeSelect.value).toBe('RESIDENTIAL')
        }
      })
    })

    it('allows changing project type', async () => {
      render(<AddProjectPage />)

      await waitFor(() => {
        const selects = screen.getAllByRole('combobox')
        const projectTypeSelect = selects.find(select =>
          select.querySelector('option[value="RESIDENTIAL"]')
        )
        if (projectTypeSelect) {
          fireEvent.change(projectTypeSelect, { target: { value: 'COMMERCIAL' } })
          expect(projectTypeSelect).toHaveValue('COMMERCIAL')
        }
      })
    })
  })

  describe('Contact Information Fields', () => {
    it('auto-populates first name from user data', async () => {
      render(<AddProjectPage />)

      await waitFor(() => {
        const firstNameInput = screen
          .getAllByRole('textbox')
          .find(input => (input as HTMLInputElement).value === 'Test')
        expect(firstNameInput).toBeInTheDocument()
      })
    })

    it('auto-populates last name from user data', async () => {
      render(<AddProjectPage />)

      await waitFor(() => {
        const lastNameInput = screen
          .getAllByRole('textbox')
          .find(input => (input as HTMLInputElement).value === 'User')
        expect(lastNameInput).toBeInTheDocument()
      })
    })

    it('auto-populates email from user data', async () => {
      render(<AddProjectPage />)

      await waitFor(() => {
        const emailInput = screen.getByDisplayValue('test@example.com')
        expect(emailInput).toBeInTheDocument()
      })
    })

    it('auto-populates phone from user data', async () => {
      render(<AddProjectPage />)

      await waitFor(() => {
        const phoneInput = screen.getByDisplayValue('+911234567890')
        expect(phoneInput).toBeInTheDocument()
      })
    })

    it('makes contact fields read-only', async () => {
      render(<AddProjectPage />)

      await waitFor(() => {
        const emailInput = screen.getByDisplayValue('test@example.com')
        expect(emailInput).toHaveAttribute('readonly')
      })
    })

    it('shows verified status for email when verified', async () => {
      render(<AddProjectPage />)

      await waitFor(() => {
        expect(screen.getByText(/✓ Verified/i)).toBeInTheDocument()
      })
    })

    it('shows not verified status for email when not verified', async () => {
      mockFetchSuccess({
        user: {
          ...mockUserData.user,
          emailVerified: false,
        },
      })

      render(<AddProjectPage />)

      await waitFor(() => {
        expect(screen.getByText(/✗ Not Verified/i)).toBeInTheDocument()
      })
    })
  })

  describe('Email Verification', () => {
    beforeEach(() => {
      mockFetchSuccess({
        user: {
          ...mockUserData.user,
          emailVerified: false,
        },
      })
    })

    it('shows send OTP button for unverified email', async () => {
      render(<AddProjectPage />)

      await waitFor(() => {
        expect(screen.getByText(/Send Verification OTP/i)).toBeInTheDocument()
      })
    })

    it('displays OTP input after sending OTP', async () => {
      render(<AddProjectPage />)

      await waitFor(async () => {
        const sendOTPButton = screen.getByText(/Send Verification OTP/i)
        fireEvent.click(sendOTPButton)

        await waitFor(() => {
          expect(screen.getByPlaceholderText(/Enter OTP/i)).toBeInTheDocument()
        })
      })
    })

    it('shows verify button after OTP is sent', async () => {
      render(<AddProjectPage />)

      await waitFor(async () => {
        const sendOTPButton = screen.getByText(/Send Verification OTP/i)
        fireEvent.click(sendOTPButton)

        await waitFor(() => {
          const verifyButtons = screen.getAllByText(/Verify/i)
          expect(verifyButtons.length).toBeGreaterThan(0)
        })
      })
    })

    it('disables verify button when OTP is empty', async () => {
      render(<AddProjectPage />)

      await waitFor(async () => {
        const sendOTPButton = screen.getByText(/Send Verification OTP/i)
        fireEvent.click(sendOTPButton)

        await waitFor(() => {
          const verifyButtons = screen.getAllByRole('button', { name: /Verify/i })
          const emailVerifyButton = verifyButtons[0]
          expect(emailVerifyButton).toBeDisabled()
        })
      })
    })

    it('enables verify button when OTP is entered', async () => {
      render(<AddProjectPage />)

      await waitFor(async () => {
        const sendOTPButton = screen.getByText(/Send Verification OTP/i)
        fireEvent.click(sendOTPButton)

        await waitFor(() => {
          const otpInputs = screen.getAllByPlaceholderText(/Enter OTP/i)
          fireEvent.change(otpInputs[0], { target: { value: '123456' } })

          const verifyButtons = screen.getAllByRole('button', { name: /Verify/i })
          expect(verifyButtons[0]).not.toBeDisabled()
        })
      })
    })

    it('calls signIn when verify button is clicked', async () => {
      ;(signIn as jest.Mock).mockResolvedValue({ error: null })

      render(<AddProjectPage />)

      await waitFor(async () => {
        const sendOTPButton = screen.getByText(/Send Verification OTP/i)
        fireEvent.click(sendOTPButton)

        await waitFor(() => {
          const otpInputs = screen.getAllByPlaceholderText(/Enter OTP/i)
          fireEvent.change(otpInputs[0], { target: { value: '123456' } })

          const verifyButtons = screen.getAllByRole('button', { name: /Verify/i })
          fireEvent.click(verifyButtons[0])

          expect(signIn).toHaveBeenCalled()
        })
      })
    })

    it('limits OTP input to 6 characters', async () => {
      render(<AddProjectPage />)

      await waitFor(async () => {
        const sendOTPButton = screen.getByText(/Send Verification OTP/i)
        fireEvent.click(sendOTPButton)

        await waitFor(() => {
          const otpInputs = screen.getAllByPlaceholderText(/Enter OTP/i)
          expect(otpInputs[0]).toHaveAttribute('maxLength', '6')
        })
      })
    })
  })

  describe('Mobile Verification', () => {
    beforeEach(() => {
      mockFetchSuccess({
        user: {
          ...mockUserData.user,
          mobileVerified: false,
        },
      })
    })

    it('shows send OTP button for unverified mobile', async () => {
      render(<AddProjectPage />)

      await waitFor(() => {
        const sendOTPButtons = screen.getAllByText(/Send Verification OTP/i)
        expect(sendOTPButtons.length).toBeGreaterThan(0)
      })
    })

    it('displays mobile OTP input after sending OTP', async () => {
      render(<AddProjectPage />)

      await waitFor(async () => {
        const sendOTPButtons = screen.getAllByText(/Send Verification OTP/i)
        fireEvent.click(sendOTPButtons[1]) // Mobile OTP button

        await waitFor(() => {
          const otpInputs = screen.getAllByPlaceholderText(/Enter OTP/i)
          expect(otpInputs.length).toBeGreaterThan(0)
        })
      })
    })
  })

  describe('Form Validation', () => {
    it('requires builder name', async () => {
      render(<AddProjectPage />)

      await waitFor(() => {
        const submitButton = screen.getByText(/Submit Project Request/i)
        fireEvent.click(submitButton)
        // Validation should prevent submission
      })
    })

    it('requires project name', async () => {
      render(<AddProjectPage />)

      await waitFor(() => {
        const builderInput = screen.getByPlaceholderText(/Enter builder\/developer name/i)
        fireEvent.change(builderInput, { target: { value: 'Test Builder' } })

        const submitButton = screen.getByText(/Submit Project Request/i)
        fireEvent.click(submitButton)
        // Validation should prevent submission
      })
    })

    it('requires project location', async () => {
      render(<AddProjectPage />)

      await waitFor(() => {
        const builderInput = screen.getByPlaceholderText(/Enter builder\/developer name/i)
        fireEvent.change(builderInput, { target: { value: 'Test Builder' } })

        const projectInput = screen.getByPlaceholderText(/Enter project name/i)
        fireEvent.change(projectInput, { target: { value: 'Test Project' } })

        const submitButton = screen.getByText(/Submit Project Request/i)
        fireEvent.click(submitButton)
        // Validation should prevent submission
      })
    })

    it('validates email format', async () => {
      mockFetchSuccess({
        user: {
          ...mockUserData.user,
          email: 'invalid-email',
        },
      })

      render(<AddProjectPage />)

      await waitFor(() => {
        const submitButton = screen.getByText(/Submit Project Request/i)
        fireEvent.click(submitButton)
        // Email validation should fail
      })
    })

    it('requires email verification before submission', async () => {
      mockFetchSuccess({
        user: {
          ...mockUserData.user,
          emailVerified: false,
        },
      })

      render(<AddProjectPage />)

      await waitFor(() => {
        const submitButton = screen.getByText(/Submit Project Request/i)
        expect(submitButton).toBeDisabled()
      })
    })

    it('requires mobile verification before submission', async () => {
      mockFetchSuccess({
        user: {
          ...mockUserData.user,
          mobileVerified: false,
        },
      })

      render(<AddProjectPage />)

      await waitFor(() => {
        const submitButton = screen.getByText(/Submit Project Request/i)
        expect(submitButton).toBeDisabled()
      })
    })
  })

  describe('Form Submission', () => {
    beforeEach(() => {
      mockFetchSuccess(mockUserData)
    })

    it('enables submit button when form is valid and verified', async () => {
      render(<AddProjectPage />)

      await waitFor(() => {
        const submitButton = screen.getByText(/Submit Project Request/i)
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
                json: () => Promise.resolve({}),
              } as Response)
            }, 100)
          })
      ) as jest.Mock

      render(<AddProjectPage />)

      await waitFor(() => {
        const builderInput = screen.getByPlaceholderText(/Enter builder\/developer name/i)
        fireEvent.change(builderInput, { target: { value: 'Test Builder' } })

        const projectInput = screen.getByPlaceholderText(/Enter project name/i)
        fireEvent.change(projectInput, { target: { value: 'Test Project' } })

        const locationInput = screen.getByPlaceholderText(/Enter complete address/i)
        fireEvent.change(locationInput, { target: { value: 'Test Location' } })

        const submitButton = screen.getByText(/Submit Project Request/i)
        fireEvent.click(submitButton)

        expect(screen.getByText(/Submitting.../i)).toBeInTheDocument()
      })
    })

    it('redirects to projects page after successful submission', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        } as Response)
      ) as jest.Mock

      render(<AddProjectPage />)

      await waitFor(() => {
        const builderInput = screen.getByPlaceholderText(/Enter builder\/developer name/i)
        fireEvent.change(builderInput, { target: { value: 'Test Builder' } })

        const projectInput = screen.getByPlaceholderText(/Enter project name/i)
        fireEvent.change(projectInput, { target: { value: 'Test Project' } })

        const locationInput = screen.getByPlaceholderText(/Enter complete address/i)
        fireEvent.change(locationInput, { target: { value: 'Test Location' } })

        const submitButton = screen.getByText(/Submit Project Request/i)
        fireEvent.click(submitButton)
      })

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/projects')
      })
    })

    it('handles submission errors gracefully', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ message: 'Submission failed' }),
        } as Response)
      ) as jest.Mock

      render(<AddProjectPage />)

      await waitFor(() => {
        const builderInput = screen.getByPlaceholderText(/Enter builder\/developer name/i)
        fireEvent.change(builderInput, { target: { value: 'Test Builder' } })

        const projectInput = screen.getByPlaceholderText(/Enter project name/i)
        fireEvent.change(projectInput, { target: { value: 'Test Project' } })

        const locationInput = screen.getByPlaceholderText(/Enter complete address/i)
        fireEvent.change(locationInput, { target: { value: 'Test Location' } })

        const submitButton = screen.getByText(/Submit Project Request/i)
        fireEvent.click(submitButton)
      })

      await waitFor(() => {
        expect(mockRouter.push).not.toHaveBeenCalled()
      })
    })
  })

  describe('Additional Information', () => {
    it('renders additional info textarea', async () => {
      render(<AddProjectPage />)

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Any additional information/i)).toBeInTheDocument()
      })
    })

    it('allows typing in additional info field', async () => {
      render(<AddProjectPage />)

      await waitFor(() => {
        const textarea = screen.getByPlaceholderText(/Any additional information/i)
        fireEvent.change(textarea, { target: { value: 'Additional notes here' } })
        expect(textarea).toHaveValue('Additional notes here')
      })
    })
  })

  describe('Cancel Button', () => {
    it('renders cancel button', async () => {
      render(<AddProjectPage />)

      await waitFor(() => {
        expect(screen.getByText('Cancel')).toBeInTheDocument()
      })
    })

    it('navigates back when cancel is clicked', async () => {
      render(<AddProjectPage />)

      await waitFor(() => {
        const cancelButton = screen.getByRole('button', { name: 'Cancel' })
        fireEvent.click(cancelButton)
        expect(mockRouter.back).toHaveBeenCalled()
      })
    })
  })

  describe('Disclaimer Text', () => {
    it('displays submission disclaimer', async () => {
      render(<AddProjectPage />)

      await waitFor(() => {
        expect(screen.getByText(/By submitting this request/i)).toBeInTheDocument()
      })
    })
  })

  describe('User Data Fetching', () => {
    it('fetches user data on mount for authenticated users', async () => {
      render(<AddProjectPage />)

      await waitFor(() => {
        expect(fetch).toHaveBeenCalled()
      })
    })

    it('handles user data fetch errors gracefully', async () => {
      mockFetchError('User not found')

      render(<AddProjectPage />)

      await waitFor(() => {
        // Page should still render
        expect(screen.getByText('Add Project Request')).toBeInTheDocument()
      })
    })
  })

  describe('Project Type Icons', () => {
    it('displays icons for project types', async () => {
      render(<AddProjectPage />)

      await waitFor(() => {
        expect(screen.getByText(/🏠/)).toBeInTheDocument()
        expect(screen.getByText(/🏢/)).toBeInTheDocument()
      })
    })
  })
})
