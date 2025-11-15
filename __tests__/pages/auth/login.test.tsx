import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter } from 'next/router'
import { useSession, signIn } from 'next-auth/react'
import Login from '@/pages/auth/login'
import { mockRouter, mockSession } from '@/__tests__/utils/test-utils'

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}))

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
  signIn: jest.fn(),
}))

describe('Login Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
  })

  describe('Unauthenticated User', () => {
    beforeEach(() => {
      ;(useSession as jest.Mock).mockReturnValue({
        data: null,
        status: 'unauthenticated',
      })
    })

    it('renders login page correctly', () => {
      render(<Login />)
      expect(screen.getByText(/sign in to your account/i)).toBeInTheDocument()
    })

    it('shows email/username input field', () => {
      render(<Login />)
      const input = screen.getByPlaceholderText(/email or username/i)
      expect(input).toBeInTheDocument()
    })

    it('shows password input field for password login', async () => {
      render(<Login />)

      // Switch to password login
      const passwordTab = screen.getByText(/password/i)
      fireEvent.click(passwordTab)

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument()
      })
    })

    it('shows OTP input field for OTP login', async () => {
      render(<Login />)

      // Switch to OTP login
      const otpTab = screen.getByText(/otp/i)
      fireEvent.click(otpTab)

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/enter 6-digit otp/i)).toBeInTheDocument()
      })
    })

    it('validates email format', async () => {
      render(<Login />)

      const emailInput = screen.getByPlaceholderText(/email or username/i)
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } })
      fireEvent.blur(emailInput)

      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email/i)).toBeInTheDocument()
      })
    })

    it('handles password login submission', async () => {
      ;(signIn as jest.Mock).mockResolvedValue({ error: null })

      render(<Login />)

      // Switch to password login
      const passwordTab = screen.getByText(/password/i)
      fireEvent.click(passwordTab)

      // Fill in credentials
      const emailInput = screen.getByPlaceholderText(/email or username/i)
      const passwordInput = await screen.findByPlaceholderText(/password/i)

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })

      // Submit form
      const submitButton = screen.getByRole('button', { name: /sign in/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(signIn).toHaveBeenCalledWith('credentials', expect.any(Object))
      })
    })

    it('handles OTP login submission', async () => {
      ;(signIn as jest.Mock).mockResolvedValue({ error: null })

      render(<Login />)

      // Switch to OTP login
      const otpTab = screen.getByText(/otp/i)
      fireEvent.click(otpTab)

      // Fill in credentials
      const emailInput = screen.getByPlaceholderText(/email or username/i)
      const otpInput = await screen.findByPlaceholderText(/enter 6-digit otp/i)

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(otpInput, { target: { value: '123456' } })

      // Submit form
      const submitButton = screen.getByRole('button', { name: /sign in/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(signIn).toHaveBeenCalledWith('credentials', expect.any(Object))
      })
    })

    it('shows error message on login failure', async () => {
      ;(signIn as jest.Mock).mockResolvedValue({ error: 'Invalid credentials' })

      render(<Login />)

      // Switch to password login
      const passwordTab = screen.getByText(/password/i)
      fireEvent.click(passwordTab)

      // Fill in credentials
      const emailInput = screen.getByPlaceholderText(/email or username/i)
      const passwordInput = await screen.findByPlaceholderText(/password/i)

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } })

      // Submit form
      const submitButton = screen.getByRole('button', { name: /sign in/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument()
      })
    })

    it('has link to signup page', () => {
      render(<Login />)
      const signupLink = screen.getByText(/don't have an account/i)
      expect(signupLink).toBeInTheDocument()
    })
  })

  describe('Authenticated User', () => {
    beforeEach(() => {
      ;(useSession as jest.Mock).mockReturnValue({
        data: mockSession,
        status: 'authenticated',
      })
    })

    it('redirects authenticated user to userinfo page', async () => {
      render(<Login />)

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/auth/userinfo')
      })
    })
  })

  describe('Google OAuth', () => {
    beforeEach(() => {
      ;(useSession as jest.Mock).mockReturnValue({
        data: null,
        status: 'unauthenticated',
      })
    })

    it('shows Google sign-in button', () => {
      render(<Login />)
      const googleButton = screen.getByText(/sign in with google/i)
      expect(googleButton).toBeInTheDocument()
    })

    it('handles Google OAuth login', async () => {
      ;(signIn as jest.Mock).mockResolvedValue({ error: null })

      render(<Login />)

      const googleButton = screen.getByText(/sign in with google/i)
      fireEvent.click(googleButton)

      await waitFor(() => {
        expect(signIn).toHaveBeenCalledWith('google', expect.any(Object))
      })
    })
  })
})
