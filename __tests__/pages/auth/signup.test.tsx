import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter } from 'next/router'
import { useSession, signIn } from 'next-auth/react'
import Signup from '@/pages/auth/signup'
import toast from 'react-hot-toast'

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}))

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
  signIn: jest.fn(),
}))

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />
  },
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

jest.mock('@/components/auth/CountryCodeDropdown', () => {
  return function CountryCodeDropdown({ value, onChange }: any) {
    return (
      <select
        data-testid="country-code-dropdown"
        value={value}
        onChange={e => onChange(e.target.value)}
      >
        <option value="+1">+1</option>
        <option value="+91">+91</option>
      </select>
    )
  }
})

describe('Signup Page - Comprehensive Tests', () => {
  const mockPush = jest.fn()
  const mockSignIn = signIn as jest.Mock
  const mockUseSession = useSession as jest.Mock
  const mockUseRouter = useRouter as jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseRouter.mockReturnValue({ push: mockPush })
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
    })
    global.fetch = jest.fn()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Rendering and Initial State', () => {
    it('should render signup page with all components', () => {
      render(<Signup />)

      expect(screen.getByTestId('header')).toBeInTheDocument()
      expect(screen.getByTestId('footer')).toBeInTheDocument()
      expect(screen.getByText('Create Account')).toBeInTheDocument()
      expect(screen.getByText('Join Grihome to start your property journey')).toBeInTheDocument()
    })

    it('should render all form fields', () => {
      render(<Signup />)

      expect(screen.getByPlaceholderText(/choose a unique username/i)).toBeInTheDocument()
      expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('1234567890')).toBeInTheDocument()
    })

    it('should render agent checkbox', () => {
      render(<Signup />)

      expect(screen.getByText('I am a real estate agent')).toBeInTheDocument()
    })

    it('should render login link', () => {
      render(<Signup />)

      expect(screen.getByText('Already have an account?')).toBeInTheDocument()
      expect(screen.getByText('Sign in')).toBeInTheDocument()
    })

    it('should show loading state when status is loading', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'loading',
      })

      render(<Signup />)

      expect(screen.getByText('Loading...')).toBeInTheDocument()
      expect(screen.queryByText('Create Account')).not.toBeInTheDocument()
    })

    it('should show loading state when authenticated', () => {
      mockUseSession.mockReturnValue({
        data: { user: { email: 'test@example.com' } },
        status: 'authenticated',
      })

      render(<Signup />)

      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })
  })

  describe('Authentication Redirect', () => {
    it('should redirect to home when authenticated', () => {
      mockUseSession.mockReturnValue({
        data: { user: { email: 'test@example.com' } },
        status: 'authenticated',
      })

      render(<Signup />)

      expect(mockPush).toHaveBeenCalledWith('/')
    })

    it('should not redirect when unauthenticated', () => {
      render(<Signup />)

      expect(mockPush).not.toHaveBeenCalled()
    })
  })

  describe('Form Input Handling', () => {
    it('should update first name input', () => {
      render(<Signup />)

      const inputs = screen.getAllByRole('textbox')
      const firstNameInput = inputs.find(
        input => input.getAttribute('name') === 'firstName'
      ) as HTMLInputElement

      fireEvent.change(firstNameInput, { target: { value: 'John' } })
      expect(firstNameInput).toHaveValue('John')
    })

    it('should update last name input', () => {
      render(<Signup />)

      const inputs = screen.getAllByRole('textbox')
      const lastNameInput = inputs.find(
        input => input.getAttribute('name') === 'lastName'
      ) as HTMLInputElement

      fireEvent.change(lastNameInput, { target: { value: 'Doe' } })
      expect(lastNameInput).toHaveValue('Doe')
    })

    it('should update username input', () => {
      render(<Signup />)

      const usernameInput = screen.getByPlaceholderText(/choose a unique username/i)
      fireEvent.change(usernameInput, { target: { value: 'johndoe' } })

      expect(usernameInput).toHaveValue('johndoe')
    })

    it('should update email input', () => {
      render(<Signup />)

      const emailInput = screen.getByPlaceholderText('you@example.com')
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } })

      expect(emailInput).toHaveValue('john@example.com')
    })

    it('should update mobile number input', () => {
      render(<Signup />)

      const mobileInput = screen.getByPlaceholderText('1234567890')
      fireEvent.change(mobileInput, { target: { value: '9876543210' } })

      expect(mobileInput).toHaveValue('9876543210')
    })

    it('should update password input', () => {
      render(<Signup />)

      const passwordInputs = screen.getAllByLabelText(/password/i)
      const passwordInput = passwordInputs[0]

      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      expect(passwordInput).toHaveValue('password123')
    })

    it('should update confirm password input', () => {
      render(<Signup />)

      const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
      fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } })

      expect(confirmPasswordInput).toHaveValue('password123')
    })

    it('should toggle agent checkbox', () => {
      render(<Signup />)

      const agentCheckbox = screen.getByRole('checkbox')
      expect(agentCheckbox).not.toBeChecked()

      fireEvent.click(agentCheckbox)
      expect(agentCheckbox).toBeChecked()

      fireEvent.click(agentCheckbox)
      expect(agentCheckbox).not.toBeChecked()
    })

    it('should show company name field when agent is checked', () => {
      render(<Signup />)

      const agentCheckbox = screen.getByRole('checkbox')
      fireEvent.click(agentCheckbox)

      expect(screen.getByPlaceholderText('Your company name')).toBeInTheDocument()
    })

    it('should hide company name field when agent is unchecked', () => {
      render(<Signup />)

      const agentCheckbox = screen.getByRole('checkbox')
      fireEvent.click(agentCheckbox)
      fireEvent.click(agentCheckbox)

      expect(screen.queryByPlaceholderText('Your company name')).not.toBeInTheDocument()
    })

    it('should change country code', () => {
      render(<Signup />)

      const countryCodeDropdown = screen.getByTestId('country-code-dropdown')
      fireEvent.change(countryCodeDropdown, { target: { value: '+91' } })

      expect(countryCodeDropdown).toHaveValue('+91')
    })
  })

  describe('Username Uniqueness Check', () => {
    it('should check username uniqueness', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ isUnique: true }),
      })

      render(<Signup />)

      const usernameInput = screen.getByPlaceholderText(/choose a unique username/i)
      fireEvent.change(usernameInput, { target: { value: 'newuser' } })

      await waitFor(
        () => {
          expect(global.fetch).toHaveBeenCalledWith('/api/auth/check-unique', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ field: 'username', value: 'newuser' }),
          })
        },
        { timeout: 1000 }
      )
    })

    it('should show error when username is taken', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ isUnique: false }),
      })

      render(<Signup />)

      const usernameInput = screen.getByPlaceholderText(/choose a unique username/i)
      fireEvent.change(usernameInput, { target: { value: 'existinguser' } })

      await waitFor(
        () => {
          expect(screen.getByText('Username is already taken')).toBeInTheDocument()
        },
        { timeout: 1000 }
      )
    })

    it('should show checking indicator while validating username', async () => {
      ;(global.fetch as jest.Mock).mockImplementationOnce(
        () =>
          new Promise(resolve =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => ({ isUnique: true }),
                }),
              100
            )
          )
      )

      render(<Signup />)

      const usernameInput = screen.getByPlaceholderText(/choose a unique username/i)
      fireEvent.change(usernameInput, { target: { value: 'newuser' } })

      await waitFor(() => {
        expect(screen.getByText('(checking...)')).toBeInTheDocument()
      })
    })

    it('should clear validation error when username is unique', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ isUnique: false }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ isUnique: true }),
        })

      render(<Signup />)

      const usernameInput = screen.getByPlaceholderText(/choose a unique username/i)

      fireEvent.change(usernameInput, { target: { value: 'existinguser' } })
      await waitFor(() => expect(screen.getByText('Username is already taken')).toBeInTheDocument())

      fireEvent.change(usernameInput, { target: { value: 'newuser' } })
      await waitFor(() =>
        expect(screen.queryByText('Username is already taken')).not.toBeInTheDocument()
      )
    })
  })

  describe('Email Uniqueness Check', () => {
    it('should check email uniqueness', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ isUnique: true }),
      })

      render(<Signup />)

      const emailInput = screen.getByPlaceholderText('you@example.com')
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })

      await waitFor(
        () => {
          expect(global.fetch).toHaveBeenCalledWith('/api/auth/check-unique', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ field: 'email', value: 'test@example.com' }),
          })
        },
        { timeout: 1000 }
      )
    })

    it('should show error when email is already registered', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ isUnique: false }),
      })

      render(<Signup />)

      const emailInput = screen.getByPlaceholderText('you@example.com')
      fireEvent.change(emailInput, { target: { value: 'existing@example.com' } })

      await waitFor(
        () => {
          expect(screen.getByText('Email is already registered')).toBeInTheDocument()
        },
        { timeout: 1000 }
      )
    })

    it('should show error on invalid email response', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Invalid email' }),
      })

      render(<Signup />)

      const emailInput = screen.getByPlaceholderText('you@example.com')
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } })

      await waitFor(
        () => {
          expect(screen.getByText('Invalid email')).toBeInTheDocument()
        },
        { timeout: 1000 }
      )
    })
  })

  describe('Mobile Uniqueness Check', () => {
    it('should check mobile uniqueness', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ isUnique: true }),
      })

      render(<Signup />)

      const mobileInput = screen.getByPlaceholderText('1234567890')
      fireEvent.change(mobileInput, { target: { value: '9876543210' } })

      await waitFor(
        () => {
          expect(global.fetch).toHaveBeenCalledWith('/api/auth/check-unique', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ field: 'mobile', value: '+19876543210' }),
          })
        },
        { timeout: 1000 }
      )
    })

    it('should show error when mobile is already registered', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ isUnique: false }),
      })

      render(<Signup />)

      const mobileInput = screen.getByPlaceholderText('1234567890')
      fireEvent.change(mobileInput, { target: { value: '9876543210' } })

      await waitFor(
        () => {
          expect(screen.getByText('Mobile number is already registered')).toBeInTheDocument()
        },
        { timeout: 1000 }
      )
    })

    it('should check mobile with correct country code', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ isUnique: true }),
      })

      render(<Signup />)

      const countryCodeDropdown = screen.getByTestId('country-code-dropdown')
      fireEvent.change(countryCodeDropdown, { target: { value: '+91' } })

      const mobileInput = screen.getByPlaceholderText('1234567890')
      fireEvent.change(mobileInput, { target: { value: '9876543210' } })

      await waitFor(
        () => {
          expect(global.fetch).toHaveBeenCalledWith('/api/auth/check-unique', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ field: 'mobile', value: '+919876543210' }),
          })
        },
        { timeout: 1000 }
      )
    })
  })

  describe('Avatar Upload', () => {
    it('should handle avatar file selection', () => {
      render(<Signup />)

      const file = new File(['dummy content'], 'avatar.png', { type: 'image/png' })
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement

      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      })

      fireEvent.change(fileInput)

      // File will be processed
      expect(fileInput.files?.[0]).toBe(file)
    })

    it('should show error for non-image file', () => {
      render(<Signup />)

      const file = new File(['dummy content'], 'document.pdf', { type: 'application/pdf' })
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement

      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      })

      fireEvent.change(fileInput)

      expect(toast.error).toHaveBeenCalledWith(
        'Please select a valid image file (JPG, PNG, or GIF)'
      )
    })

    it('should show error for oversized file', () => {
      render(<Signup />)

      const largeFile = new File(['x'.repeat(2 * 1024 * 1024)], 'large.png', { type: 'image/png' })
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement

      Object.defineProperty(fileInput, 'files', {
        value: [largeFile],
        writable: false,
      })

      fireEvent.change(fileInput)

      expect(toast.error).toHaveBeenCalledWith('Image size must be less than 1MB')
    })

    it('should accept valid image file', () => {
      render(<Signup />)

      const validFile = new File(['valid content'], 'avatar.png', { type: 'image/png' })
      Object.defineProperty(validFile, 'size', { value: 500 * 1024 }) // 500KB

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement

      Object.defineProperty(fileInput, 'files', {
        value: [validFile],
        writable: false,
      })

      // Mock FileReader
      const mockFileReader = {
        readAsDataURL: jest.fn(),
        onloadend: jest.fn(),
        result: 'data:image/png;base64,mock',
      }
      global.FileReader = jest.fn(() => mockFileReader) as any

      fireEvent.change(fileInput)

      expect(mockFileReader.readAsDataURL).toHaveBeenCalledWith(validFile)
    })
  })

  describe('Form Validation', () => {
    it('should validate password mismatch', async () => {
      render(<Signup />)

      const passwordInputs = screen.getAllByLabelText(/password/i)
      const passwordInput = passwordInputs[0]
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i)

      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.change(confirmPasswordInput, { target: { value: 'password456' } })

      const submitButton = screen.getByRole('button', { name: 'Create Account' })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Passwords do not match')
      })
    })

    it('should validate password length', async () => {
      render(<Signup />)

      const passwordInputs = screen.getAllByLabelText(/password/i)
      const passwordInput = passwordInputs[0]
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i)

      fireEvent.change(passwordInput, { target: { value: '12345' } })
      fireEvent.change(confirmPasswordInput, { target: { value: '12345' } })

      const submitButton = screen.getByRole('button', { name: 'Create Account' })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Password must be at least 6 characters long')
      })
    })

    it('should validate username length', async () => {
      render(<Signup />)

      const usernameInput = screen.getByPlaceholderText(/choose a unique username/i)
      fireEvent.change(usernameInput, { target: { value: 'ab' } })

      const submitButton = screen.getByRole('button', { name: 'Create Account' })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Username must be at least 3 characters long')
      })
    })

    it('should validate company name for agents', async () => {
      render(<Signup />)

      const agentCheckbox = screen.getByRole('checkbox')
      fireEvent.click(agentCheckbox)

      const submitButton = screen.getByRole('button', { name: 'Create Account' })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Company name is required for agents')
      })
    })

    it('should show error if validation errors exist', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ isUnique: false }),
      })

      render(<Signup />)

      const usernameInput = screen.getByPlaceholderText(/choose a unique username/i)
      fireEvent.change(usernameInput, { target: { value: 'existinguser' } })

      await waitFor(() => expect(screen.getByText('Username is already taken')).toBeInTheDocument())

      const submitButton = screen.getByRole('button', { name: 'Create Account' })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          'Please fix all validation errors before submitting'
        )
      })
    })
  })

  describe('Form Submission', () => {
    const fillValidForm = async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true, json: async () => ({ isUnique: true }) }) // username
        .mockResolvedValueOnce({ ok: true, json: async () => ({ isUnique: true }) }) // email
        .mockResolvedValueOnce({ ok: true, json: async () => ({ isUnique: true }) }) // mobile

      const inputs = screen.getAllByRole('textbox')
      const firstNameInput = inputs.find(
        input => input.getAttribute('name') === 'firstName'
      ) as HTMLInputElement
      const lastNameInput = inputs.find(
        input => input.getAttribute('name') === 'lastName'
      ) as HTMLInputElement

      fireEvent.change(firstNameInput, { target: { value: 'John' } })
      fireEvent.change(lastNameInput, { target: { value: 'Doe' } })

      const usernameInput = screen.getByPlaceholderText(/choose a unique username/i)
      fireEvent.change(usernameInput, { target: { value: 'johndoe' } })

      const emailInput = screen.getByPlaceholderText('you@example.com')
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } })

      const mobileInput = screen.getByPlaceholderText('1234567890')
      fireEvent.change(mobileInput, { target: { value: '9876543210' } })

      const passwordInputs = screen.getAllByLabelText(/password/i)
      const passwordInput = passwordInputs[0]
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i)

      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } })

      await waitFor(() => {}, { timeout: 1000 })
    }

    it('should submit form successfully', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true, json: async () => ({ isUnique: true }) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ isUnique: true }) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ isUnique: true }) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({}) }) // signup API

      mockSignIn.mockResolvedValueOnce({ ok: true })

      render(<Signup />)
      await fillValidForm()

      const submitButton = screen.getByRole('button', { name: 'Create Account' })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/auth/signup',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          })
        )
        expect(toast.success).toHaveBeenCalledWith('Account created successfully!')
      })
    })

    it('should auto-login after successful signup', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true, json: async () => ({ isUnique: true }) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ isUnique: true }) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ isUnique: true }) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({}) })

      mockSignIn.mockResolvedValueOnce({ ok: true })

      render(<Signup />)
      await fillValidForm()

      const submitButton = screen.getByRole('button', { name: 'Create Account' })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith('credentials', {
          identifier: 'johndoe',
          password: 'password123',
          loginType: 'password',
          redirect: false,
        })
        expect(mockPush).toHaveBeenCalledWith('/')
      })
    })

    it('should redirect to login if auto-login fails', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true, json: async () => ({ isUnique: true }) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ isUnique: true }) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ isUnique: true }) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({}) })

      mockSignIn.mockResolvedValueOnce({ ok: false })

      render(<Signup />)
      await fillValidForm()

      const submitButton = screen.getByRole('button', { name: 'Create Account' })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Please login with your credentials')
        expect(mockPush).toHaveBeenCalledWith('/auth/login')
      })
    })

    it('should show error on signup failure', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true, json: async () => ({ isUnique: true }) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ isUnique: true }) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ isUnique: true }) })
        .mockResolvedValueOnce({ ok: false, json: async () => ({ message: 'Signup failed' }) })

      render(<Signup />)
      await fillValidForm()

      const submitButton = screen.getByRole('button', { name: 'Create Account' })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Signup failed')
      })
    })

    it('should handle signup exception', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true, json: async () => ({ isUnique: true }) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ isUnique: true }) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ isUnique: true }) })
        .mockRejectedValueOnce(new Error('Network error'))

      render(<Signup />)
      await fillValidForm()

      const submitButton = screen.getByRole('button', { name: 'Create Account' })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Signup failed. Please try again.')
      })
    })

    it('should show loading state during submission', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({ ok: true, json: async () => ({ isUnique: true }) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ isUnique: true }) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ isUnique: true }) })
        .mockImplementationOnce(
          () =>
            new Promise(resolve =>
              setTimeout(() => resolve({ ok: true, json: async () => ({}) }), 100)
            )
        )

      mockSignIn.mockResolvedValueOnce({ ok: true })

      render(<Signup />)
      await fillValidForm()

      const submitButton = screen.getByRole('button', { name: 'Create Account' })
      fireEvent.click(submitButton)

      expect(screen.getByText('Creating account...')).toBeInTheDocument()

      await waitFor(() => {
        expect(screen.queryByText('Creating account...')).not.toBeInTheDocument()
      })
    })
  })

  describe('Form Button State', () => {
    it('should disable submit button when form is invalid', () => {
      render(<Signup />)

      const submitButton = screen.getByRole('button', { name: 'Create Account' })
      expect(submitButton).toBeDisabled()
    })

    it('should enable submit button when form is valid', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ isUnique: true }),
      })

      render(<Signup />)

      const inputs = screen.getAllByRole('textbox')
      const firstNameInput = inputs.find(
        input => input.getAttribute('name') === 'firstName'
      ) as HTMLInputElement
      const lastNameInput = inputs.find(
        input => input.getAttribute('name') === 'lastName'
      ) as HTMLInputElement

      fireEvent.change(firstNameInput, { target: { value: 'John' } })
      fireEvent.change(lastNameInput, { target: { value: 'Doe' } })

      const usernameInput = screen.getByPlaceholderText(/choose a unique username/i)
      fireEvent.change(usernameInput, { target: { value: 'johndoe' } })

      const emailInput = screen.getByPlaceholderText('you@example.com')
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } })

      const mobileInput = screen.getByPlaceholderText('1234567890')
      fireEvent.change(mobileInput, { target: { value: '9876543210' } })

      const passwordInputs = screen.getAllByLabelText(/password/i)
      const passwordInput = passwordInputs[0]
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i)

      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } })

      await waitFor(
        () => {
          const submitButton = screen.getByRole('button', { name: 'Create Account' })
          expect(submitButton).not.toBeDisabled()
        },
        { timeout: 1500 }
      )
    })
  })

  describe('CSS Classes', () => {
    it('should have correct container classes', () => {
      const { container } = render(<Signup />)

      expect(container.querySelector('.signup-container')).toBeInTheDocument()
      expect(container.querySelector('.signup-main')).toBeInTheDocument()
      expect(container.querySelector('.signup-content')).toBeInTheDocument()
      expect(container.querySelector('.signup-form')).toBeInTheDocument()
    })

    it('should have correct form classes', () => {
      const { container } = render(<Signup />)

      expect(container.querySelector('.signup-form__field')).toBeInTheDocument()
      expect(container.querySelector('.signup-form__label')).toBeInTheDocument()
      expect(container.querySelector('.signup-form__input')).toBeInTheDocument()
    })

    it('should apply error class to input with validation error', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ isUnique: false }),
      })

      const { container } = render(<Signup />)

      const usernameInput = screen.getByPlaceholderText(/choose a unique username/i)
      fireEvent.change(usernameInput, { target: { value: 'existinguser' } })

      await waitFor(
        () => {
          expect(container.querySelector('.signup-form__input--error')).toBeInTheDocument()
        },
        { timeout: 1000 }
      )
    })
  })

  describe('Accessibility', () => {
    it('should have required attributes on form inputs', () => {
      render(<Signup />)

      const inputs = screen.getAllByRole('textbox')
      const firstNameInput = inputs.find(input => input.getAttribute('name') === 'firstName')
      const lastNameInput = inputs.find(input => input.getAttribute('name') === 'lastName')

      expect(firstNameInput).toHaveAttribute('required')
      expect(lastNameInput).toHaveAttribute('required')
    })

    it('should have minLength on username', () => {
      render(<Signup />)

      const usernameInput = screen.getByPlaceholderText(/choose a unique username/i)
      expect(usernameInput).toHaveAttribute('minLength', '3')
    })

    it('should have minLength on password', () => {
      render(<Signup />)

      const passwordInputs = screen.getAllByLabelText(/password/i)
      const passwordInput = passwordInputs[0]

      expect(passwordInput).toHaveAttribute('minLength', '6')
    })

    it('should have accept attribute on file input', () => {
      render(<Signup />)

      const fileInput = document.querySelector('input[type="file"]')
      expect(fileInput).toHaveAttribute('accept', 'image/jpeg,image/png,image/gif')
    })
  })

  describe('Error Handling', () => {
    it('should handle network error during uniqueness check gracefully', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

      render(<Signup />)

      const usernameInput = screen.getByPlaceholderText(/choose a unique username/i)
      fireEvent.change(usernameInput, { target: { value: 'testuser' } })

      await waitFor(
        () => {
          expect(global.fetch).toHaveBeenCalled()
        },
        { timeout: 1000 }
      )
    })
  })
})
