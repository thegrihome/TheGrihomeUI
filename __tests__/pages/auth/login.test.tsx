import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter } from 'next/router'
import { signIn, useSession } from 'next-auth/react'
import Login from '@/pages/auth/login'
import toast from 'react-hot-toast'

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}))

jest.mock('next-auth/react', () => ({
  signIn: jest.fn(),
  useSession: jest.fn(),
}))

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
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

describe('Login Page - Comprehensive Tests', () => {
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
    it('should render login page with all components', () => {
      render(<Login />)

      expect(screen.getByTestId('header')).toBeInTheDocument()
      expect(screen.getByTestId('footer')).toBeInTheDocument()
      expect(screen.getByText('Sign In')).toBeInTheDocument()
      expect(screen.getByText('Welcome back to Grihome')).toBeInTheDocument()
    })

    it('should render all three login method tabs', () => {
      render(<Login />)

      expect(screen.getByText('Email OTP')).toBeInTheDocument()
      expect(screen.getByText('Mobile OTP')).toBeInTheDocument()
      expect(screen.getByText('Username & Password')).toBeInTheDocument()
    })

    it('should have email OTP method selected by default', () => {
      render(<Login />)

      const emailTab = screen.getByText('Email OTP').closest('button')
      expect(emailTab).toHaveClass('login-tab--active')
    })

    it('should render signup link', () => {
      render(<Login />)

      expect(screen.getByText("Don't have an account?")).toBeInTheDocument()
      expect(screen.getByText('Sign up')).toBeInTheDocument()
    })

    it('should show loading state when status is loading', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'loading',
      })

      render(<Login />)

      expect(screen.getByText('Loading...')).toBeInTheDocument()
      expect(screen.queryByText('Sign In')).not.toBeInTheDocument()
    })

    it('should show loading state when authenticated', () => {
      mockUseSession.mockReturnValue({
        data: { user: { email: 'test@example.com' } },
        status: 'authenticated',
      })

      render(<Login />)

      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })
  })

  describe('Authentication Redirect', () => {
    it('should redirect to home when authenticated', () => {
      mockUseSession.mockReturnValue({
        data: { user: { email: 'test@example.com' } },
        status: 'authenticated',
      })

      render(<Login />)

      expect(mockPush).toHaveBeenCalledWith('/')
    })

    it('should not redirect when unauthenticated', () => {
      render(<Login />)

      expect(mockPush).not.toHaveBeenCalled()
    })
  })

  describe('Login Method Tabs', () => {
    it('should switch to mobile OTP method', () => {
      render(<Login />)

      const mobileTab = screen.getByText('Mobile OTP')
      fireEvent.click(mobileTab)

      expect(mobileTab.closest('button')).toHaveClass('login-tab--active')
      expect(screen.getByPlaceholderText('1234567890')).toBeInTheDocument()
    })

    it('should switch to password method', () => {
      render(<Login />)

      const passwordTab = screen.getByText('Username & Password')
      fireEvent.click(passwordTab)

      expect(passwordTab.closest('button')).toHaveClass('login-tab--active')
      expect(screen.getByPlaceholderText('Enter username or email')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Your password')).toBeInTheDocument()
    })

    it('should reset form when switching methods', () => {
      render(<Login />)

      const emailInput = screen.getByPlaceholderText('you@example.com')
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })

      const mobileTab = screen.getByText('Mobile OTP')
      fireEvent.click(mobileTab)

      const emailTab = screen.getByText('Email OTP')
      fireEvent.click(emailTab)

      const newEmailInput = screen.getByPlaceholderText('you@example.com')
      expect(newEmailInput).toHaveValue('')
    })
  })

  describe('Email OTP Login', () => {
    it('should render email input field', () => {
      render(<Login />)

      expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument()
      expect(screen.getByText('Email Address')).toBeInTheDocument()
    })

    it('should update email input value', () => {
      render(<Login />)

      const emailInput = screen.getByPlaceholderText('you@example.com')
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })

      expect(emailInput).toHaveValue('test@example.com')
    })

    it('should validate email format', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Invalid email format' }),
      })

      render(<Login />)

      const emailInput = screen.getByPlaceholderText('you@example.com')
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } })

      await waitFor(
        () => {
          expect(screen.getByText('Invalid email format')).toBeInTheDocument()
        },
        { timeout: 1000 }
      )
    })

    it('should check if email exists in database', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ exists: true }),
      })

      render(<Login />)

      const emailInput = screen.getByPlaceholderText('you@example.com')
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })

      await waitFor(
        () => {
          expect(global.fetch).toHaveBeenCalledWith('/api/auth/check-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'email', value: 'test@example.com' }),
          })
        },
        { timeout: 1000 }
      )
    })

    it('should show error when email does not exist', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Email not registered. Please sign up first.' }),
      })

      render(<Login />)

      const emailInput = screen.getByPlaceholderText('you@example.com')
      fireEvent.change(emailInput, { target: { value: 'nonexistent@example.com' } })

      await waitFor(
        () => {
          expect(
            screen.getByText('Email not registered. Please sign up first.')
          ).toBeInTheDocument()
        },
        { timeout: 1000 }
      )
    })

    it('should show checking indicator while validating', async () => {
      ;(global.fetch as jest.Mock).mockImplementationOnce(
        () =>
          new Promise(resolve =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => ({ exists: true }),
                }),
              100
            )
          )
      )

      render(<Login />)

      const emailInput = screen.getByPlaceholderText('you@example.com')
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })

      await waitFor(() => {
        expect(screen.getByText('(checking...)')).toBeInTheDocument()
      })
    })

    it('should disable Send OTP button when email does not exist', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Email not registered. Please sign up first.' }),
      })

      render(<Login />)

      const emailInput = screen.getByPlaceholderText('you@example.com')
      fireEvent.change(emailInput, { target: { value: 'nonexistent@example.com' } })

      await waitFor(
        () => {
          const sendButton = screen.getByText('Send OTP')
          expect(sendButton).toBeDisabled()
        },
        { timeout: 1000 }
      )
    })

    it('should send OTP when user exists', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ exists: true }),
      })

      render(<Login />)

      const emailInput = screen.getByPlaceholderText('you@example.com')
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })

      await waitFor(
        async () => {
          const sendButton = screen.getByText('Send OTP')
          expect(sendButton).not.toBeDisabled()
          fireEvent.click(sendButton)

          await waitFor(() => {
            expect(toast.success).toHaveBeenCalledWith('OTP sent! Use 123456 for testing')
          })
        },
        { timeout: 1000 }
      )
    })

    it('should show OTP input after sending OTP', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ exists: true }),
      })

      render(<Login />)

      const emailInput = screen.getByPlaceholderText('you@example.com')
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })

      await waitFor(
        async () => {
          const sendButton = screen.getByText('Send OTP')
          fireEvent.click(sendButton)

          await waitFor(() => {
            expect(screen.getByPlaceholderText('123456')).toBeInTheDocument()
            expect(screen.getByText('Enter OTP')).toBeInTheDocument()
          })
        },
        { timeout: 1000 }
      )
    })

    it('should verify OTP and login successfully', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ exists: true }),
      })

      mockSignIn.mockResolvedValueOnce({ ok: true, error: null })

      render(<Login />)

      const emailInput = screen.getByPlaceholderText('you@example.com')
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })

      await waitFor(
        async () => {
          const sendButton = screen.getByText('Send OTP')
          fireEvent.click(sendButton)

          await waitFor(async () => {
            const otpInput = screen.getByPlaceholderText('123456')
            fireEvent.change(otpInput, { target: { value: '123456' } })

            const verifyButton = screen.getByText('Verify & Login')
            fireEvent.click(verifyButton)

            await waitFor(() => {
              expect(mockSignIn).toHaveBeenCalledWith('credentials', {
                identifier: 'test@example.com',
                otp: '123456',
                loginType: 'otp',
                redirect: false,
              })
              expect(toast.success).toHaveBeenCalledWith('Login successful!')
              expect(mockPush).toHaveBeenCalledWith('/')
            })
          })
        },
        { timeout: 2000 }
      )
    })

    it('should show error on invalid OTP', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ exists: true }),
      })

      mockSignIn.mockResolvedValueOnce({ ok: false, error: 'Invalid OTP' })

      render(<Login />)

      const emailInput = screen.getByPlaceholderText('you@example.com')
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })

      await waitFor(
        async () => {
          const sendButton = screen.getByText('Send OTP')
          fireEvent.click(sendButton)

          await waitFor(async () => {
            const otpInput = screen.getByPlaceholderText('123456')
            fireEvent.change(otpInput, { target: { value: '999999' } })

            const verifyButton = screen.getByText('Verify & Login')
            fireEvent.click(verifyButton)

            await waitFor(() => {
              expect(toast.error).toHaveBeenCalledWith('Invalid OTP or user not found')
            })
          })
        },
        { timeout: 2000 }
      )
    })

    it('should allow going back from OTP screen', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ exists: true }),
      })

      render(<Login />)

      const emailInput = screen.getByPlaceholderText('you@example.com')
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })

      await waitFor(
        async () => {
          const sendButton = screen.getByText('Send OTP')
          fireEvent.click(sendButton)

          await waitFor(() => {
            const backButton = screen.getByText('Back')
            fireEvent.click(backButton)

            expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument()
          })
        },
        { timeout: 1000 }
      )
    })

    it('should disable verify button when OTP is incomplete', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ exists: true }),
      })

      render(<Login />)

      const emailInput = screen.getByPlaceholderText('you@example.com')
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })

      await waitFor(
        async () => {
          const sendButton = screen.getByText('Send OTP')
          fireEvent.click(sendButton)

          await waitFor(() => {
            const otpInput = screen.getByPlaceholderText('123456')
            fireEvent.change(otpInput, { target: { value: '123' } })

            const verifyButton = screen.getByText('Verify & Login')
            expect(verifyButton).toBeDisabled()
          })
        },
        { timeout: 1000 }
      )
    })

    it('should show error toast when email is empty on Send OTP', () => {
      render(<Login />)

      const sendButton = screen.getByText('Send OTP')
      fireEvent.click(sendButton)

      expect(toast.error).toHaveBeenCalledWith('Please enter your email address')
    })
  })

  describe('Mobile OTP Login', () => {
    beforeEach(() => {
      render(<Login />)
      const mobileTab = screen.getByText('Mobile OTP')
      fireEvent.click(mobileTab)
    })

    it('should render mobile input field with country code dropdown', () => {
      expect(screen.getByTestId('country-code-dropdown')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('1234567890')).toBeInTheDocument()
      expect(screen.getByText('Mobile Number')).toBeInTheDocument()
    })

    it('should update mobile number input value', () => {
      const mobileInput = screen.getByPlaceholderText('1234567890')
      fireEvent.change(mobileInput, { target: { value: '9876543210' } })

      expect(mobileInput).toHaveValue('9876543210')
    })

    it('should change country code', () => {
      const countryCodeDropdown = screen.getByTestId('country-code-dropdown')
      fireEvent.change(countryCodeDropdown, { target: { value: '+91' } })

      expect(countryCodeDropdown).toHaveValue('+91')
    })

    it('should check if mobile exists in database', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ exists: true }),
      })

      const mobileInput = screen.getByPlaceholderText('1234567890')
      fireEvent.change(mobileInput, { target: { value: '9876543210' } })

      await waitFor(
        () => {
          expect(global.fetch).toHaveBeenCalledWith('/api/auth/check-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'mobile', value: '+19876543210' }),
          })
        },
        { timeout: 1000 }
      )
    })

    it('should show error when mobile does not exist', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Mobile number not registered. Please sign up first.' }),
      })

      const mobileInput = screen.getByPlaceholderText('1234567890')
      fireEvent.change(mobileInput, { target: { value: '9876543210' } })

      await waitFor(
        () => {
          expect(
            screen.getByText('Mobile number not registered. Please sign up first.')
          ).toBeInTheDocument()
        },
        { timeout: 1000 }
      )
    })

    it('should send OTP when mobile exists', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ exists: true }),
      })

      const mobileInput = screen.getByPlaceholderText('1234567890')
      fireEvent.change(mobileInput, { target: { value: '9876543210' } })

      await waitFor(
        async () => {
          const sendButton = screen.getByText('Send OTP')
          expect(sendButton).not.toBeDisabled()
          fireEvent.click(sendButton)

          await waitFor(() => {
            expect(toast.success).toHaveBeenCalledWith('OTP sent! Use 123456 for testing')
          })
        },
        { timeout: 1000 }
      )
    })

    it('should verify mobile OTP successfully', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ exists: true }),
      })

      mockSignIn.mockResolvedValueOnce({ ok: true, error: null })

      const mobileInput = screen.getByPlaceholderText('1234567890')
      fireEvent.change(mobileInput, { target: { value: '9876543210' } })

      await waitFor(
        async () => {
          const sendButton = screen.getByText('Send OTP')
          fireEvent.click(sendButton)

          await waitFor(async () => {
            const otpInput = screen.getByPlaceholderText('123456')
            fireEvent.change(otpInput, { target: { value: '123456' } })

            const verifyButton = screen.getByText('Verify & Login')
            fireEvent.click(verifyButton)

            await waitFor(() => {
              expect(mockSignIn).toHaveBeenCalledWith('credentials', {
                identifier: '+19876543210',
                otp: '123456',
                loginType: 'otp',
                redirect: false,
              })
            })
          })
        },
        { timeout: 2000 }
      )
    })

    it('should show error toast when mobile is empty on Send OTP', () => {
      const sendButton = screen.getByText('Send OTP')
      fireEvent.click(sendButton)

      expect(toast.error).toHaveBeenCalledWith('Please enter your mobile number')
    })
  })

  describe('Password Login', () => {
    beforeEach(() => {
      render(<Login />)
      const passwordTab = screen.getByText('Username & Password')
      fireEvent.click(passwordTab)
    })

    it('should render username and password inputs', () => {
      expect(screen.getByPlaceholderText('Enter username or email')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Your password')).toBeInTheDocument()
      expect(screen.getByText('Username or Email')).toBeInTheDocument()
      expect(screen.getByText('Password')).toBeInTheDocument()
    })

    it('should update username input value', () => {
      const usernameInput = screen.getByPlaceholderText('Enter username or email')
      fireEvent.change(usernameInput, { target: { value: 'testuser' } })

      expect(usernameInput).toHaveValue('testuser')
    })

    it('should update password input value', () => {
      const passwordInput = screen.getByPlaceholderText('Your password')
      fireEvent.change(passwordInput, { target: { value: 'password123' } })

      expect(passwordInput).toHaveValue('password123')
    })

    it('should login successfully with valid credentials', async () => {
      mockSignIn.mockResolvedValueOnce({ ok: true, error: null })

      const usernameInput = screen.getByPlaceholderText('Enter username or email')
      const passwordInput = screen.getByPlaceholderText('Your password')

      fireEvent.change(usernameInput, { target: { value: 'testuser' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })

      const signInButton = screen.getByText('Sign In')
      fireEvent.click(signInButton)

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith('credentials', {
          identifier: 'testuser',
          password: 'password123',
          loginType: 'password',
          redirect: false,
        })
        expect(toast.success).toHaveBeenCalledWith('Login successful!')
        expect(mockPush).toHaveBeenCalledWith('/')
      })
    })

    it('should show error on invalid credentials', async () => {
      mockSignIn.mockResolvedValueOnce({ ok: false, error: 'Invalid credentials' })

      const usernameInput = screen.getByPlaceholderText('Enter username or email')
      const passwordInput = screen.getByPlaceholderText('Your password')

      fireEvent.change(usernameInput, { target: { value: 'wronguser' } })
      fireEvent.change(passwordInput, { target: { value: 'wrongpass' } })

      const signInButton = screen.getByText('Sign In')
      fireEvent.click(signInButton)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Invalid username or password')
      })
    })

    it('should show loading state during login', async () => {
      mockSignIn.mockImplementationOnce(
        () => new Promise(resolve => setTimeout(() => resolve({ ok: true }), 100))
      )

      const usernameInput = screen.getByPlaceholderText('Enter username or email')
      const passwordInput = screen.getByPlaceholderText('Your password')

      fireEvent.change(usernameInput, { target: { value: 'testuser' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })

      const signInButton = screen.getByText('Sign In')
      fireEvent.click(signInButton)

      expect(screen.getByText('Signing in...')).toBeInTheDocument()

      await waitFor(() => {
        expect(screen.queryByText('Signing in...')).not.toBeInTheDocument()
      })
    })

    it('should handle login exception', async () => {
      mockSignIn.mockRejectedValueOnce(new Error('Network error'))

      const usernameInput = screen.getByPlaceholderText('Enter username or email')
      const passwordInput = screen.getByPlaceholderText('Your password')

      fireEvent.change(usernameInput, { target: { value: 'testuser' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })

      const signInButton = screen.getByText('Sign In')
      fireEvent.click(signInButton)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Login failed. Please try again.')
      })
    })

    it('should disable button during loading', async () => {
      mockSignIn.mockImplementationOnce(
        () => new Promise(resolve => setTimeout(() => resolve({ ok: true }), 100))
      )

      const usernameInput = screen.getByPlaceholderText('Enter username or email')
      const passwordInput = screen.getByPlaceholderText('Your password')

      fireEvent.change(usernameInput, { target: { value: 'testuser' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })

      const signInButton = screen.getByText('Sign In')
      fireEvent.click(signInButton)

      expect(signInButton).toBeDisabled()

      await waitFor(() => {
        expect(signInButton).not.toBeDisabled()
      })
    })
  })

  describe('CSS Classes', () => {
    it('should have correct container classes', () => {
      const { container } = render(<Login />)

      expect(container.querySelector('.login-container')).toBeInTheDocument()
      expect(container.querySelector('.login-main')).toBeInTheDocument()
      expect(container.querySelector('.login-content')).toBeInTheDocument()
      expect(container.querySelector('.login-card')).toBeInTheDocument()
    })

    it('should have correct form classes', () => {
      const { container } = render(<Login />)

      expect(container.querySelector('.login-form')).toBeInTheDocument()
      expect(container.querySelector('.login-form__field')).toBeInTheDocument()
      expect(container.querySelector('.login-form__label')).toBeInTheDocument()
      expect(container.querySelector('.login-form__input')).toBeInTheDocument()
    })

    it('should have correct tab classes', () => {
      const { container } = render(<Login />)

      expect(container.querySelector('.login-tabs')).toBeInTheDocument()
      expect(container.querySelector('.login-tab')).toBeInTheDocument()
      expect(container.querySelector('.login-tab--active')).toBeInTheDocument()
    })

    it('should apply error class to input with validation error', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Email not registered. Please sign up first.' }),
      })

      const { container } = render(<Login />)

      const emailInput = screen.getByPlaceholderText('you@example.com')
      fireEvent.change(emailInput, { target: { value: 'nonexistent@example.com' } })

      await waitFor(
        () => {
          expect(container.querySelector('.login-form__input--error')).toBeInTheDocument()
        },
        { timeout: 1000 }
      )
    })
  })

  describe('Error Handling', () => {
    it('should handle fetch error gracefully when checking email', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

      render(<Login />)

      const emailInput = screen.getByPlaceholderText('you@example.com')
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })

      await waitFor(
        () => {
          expect(global.fetch).toHaveBeenCalled()
        },
        { timeout: 1000 }
      )
    })

    it('should show error toast when OTP sending fails', async () => {
      render(<Login />)

      const emailInput = screen.getByPlaceholderText('you@example.com')

      fireEvent.change(emailInput, { target: { value: '' } })

      const sendButton = screen.getByText('Send OTP')
      fireEvent.click(sendButton)

      expect(toast.error).toHaveBeenCalledWith('Please enter your email address')
    })
  })

  describe('Accessibility', () => {
    it('should have required attribute on email input', () => {
      render(<Login />)

      const emailInput = screen.getByPlaceholderText('you@example.com')
      expect(emailInput).toHaveAttribute('required')
    })

    it('should have required attribute on password input', () => {
      render(<Login />)

      const passwordTab = screen.getByText('Username & Password')
      fireEvent.click(passwordTab)

      const usernameInput = screen.getByPlaceholderText('Enter username or email')
      const passwordInput = screen.getByPlaceholderText('Your password')

      expect(usernameInput).toHaveAttribute('required')
      expect(passwordInput).toHaveAttribute('required')
    })

    it('should have maxLength on OTP input', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ exists: true }),
      })

      render(<Login />)

      const emailInput = screen.getByPlaceholderText('you@example.com')
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })

      await waitFor(
        async () => {
          const sendButton = screen.getByText('Send OTP')
          fireEvent.click(sendButton)

          await waitFor(() => {
            const otpInput = screen.getByPlaceholderText('123456')
            expect(otpInput).toHaveAttribute('maxLength', '6')
          })
        },
        { timeout: 1000 }
      )
    })

    it('should have proper button types', () => {
      render(<Login />)

      const tabs = screen.getAllByRole('button')
      tabs.forEach(tab => {
        if (
          tab.textContent === 'Email OTP' ||
          tab.textContent === 'Mobile OTP' ||
          tab.textContent === 'Username & Password'
        ) {
          expect(tab).toHaveAttribute('type', 'button')
        }
      })
    })
  })

  describe('Form Submission', () => {
    it('should prevent default form submission on OTP login', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ exists: true }),
      })

      render(<Login />)

      const emailInput = screen.getByPlaceholderText('you@example.com')
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })

      await waitFor(
        async () => {
          const sendButton = screen.getByText('Send OTP')
          fireEvent.click(sendButton)

          await waitFor(() => {
            const form = screen.getByText('Enter OTP').closest('form')
            const submitEvent = new Event('submit', { bubbles: true, cancelable: true })
            const preventDefaultSpy = jest.spyOn(submitEvent, 'preventDefault')

            form?.dispatchEvent(submitEvent)

            expect(preventDefaultSpy).toHaveBeenCalled()
          })
        },
        { timeout: 1000 }
      )
    })

    it('should prevent default form submission on password login', () => {
      render(<Login />)

      const passwordTab = screen.getByText('Username & Password')
      fireEvent.click(passwordTab)

      const form = screen.getByText('Username or Email').closest('form')
      const submitEvent = new Event('submit', { bubbles: true, cancelable: true })
      const preventDefaultSpy = jest.spyOn(submitEvent, 'preventDefault')

      form?.dispatchEvent(submitEvent)

      expect(preventDefaultSpy).toHaveBeenCalled()
    })
  })
})
