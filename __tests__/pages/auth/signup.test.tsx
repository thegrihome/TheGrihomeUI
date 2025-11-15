import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import Signup from '@/pages/auth/signup'
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

describe('Signup Page', () => {
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

    it('renders signup page correctly', () => {
      render(<Signup />)
      expect(screen.getByText(/create your account/i)).toBeInTheDocument()
    })

    it('shows all required input fields', () => {
      render(<Signup />)

      expect(screen.getByPlaceholderText(/full name/i)).toBeInTheDocument()
      expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument()
      expect(screen.getByPlaceholderText(/username/i)).toBeInTheDocument()
      expect(screen.getByPlaceholderText(/mobile number/i)).toBeInTheDocument()
      expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument()
    })

    it('shows role selection (Buyer/Agent)', () => {
      render(<Signup />)

      expect(screen.getByText(/i am a buyer/i)).toBeInTheDocument()
      expect(screen.getByText(/i am an agent/i)).toBeInTheDocument()
    })

    it('validates email format', async () => {
      render(<Signup />)

      const emailInput = screen.getByPlaceholderText(/email/i)
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } })
      fireEvent.blur(emailInput)

      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email/i)).toBeInTheDocument()
      })
    })

    it('validates username uniqueness', async () => {
      mockFetchSuccess({ available: false })

      render(<Signup />)

      const usernameInput = screen.getByPlaceholderText(/username/i)
      fireEvent.change(usernameInput, { target: { value: 'existinguser' } })
      fireEvent.blur(usernameInput)

      await waitFor(() => {
        expect(screen.getByText(/username already taken/i)).toBeInTheDocument()
      })
    })

    it('validates email uniqueness', async () => {
      mockFetchSuccess({ available: false })

      render(<Signup />)

      const emailInput = screen.getByPlaceholderText(/email/i)
      fireEvent.change(emailInput, { target: { value: 'existing@example.com' } })
      fireEvent.blur(emailInput)

      await waitFor(() => {
        expect(screen.getByText(/email already registered/i)).toBeInTheDocument()
      })
    })

    it('validates mobile number format', async () => {
      render(<Signup />)

      const mobileInput = screen.getByPlaceholderText(/mobile number/i)
      fireEvent.change(mobileInput, { target: { value: '123' } })
      fireEvent.blur(mobileInput)

      await waitFor(() => {
        expect(screen.getByText(/please enter a valid 10-digit mobile number/i)).toBeInTheDocument()
      })
    })

    it('validates password strength', async () => {
      render(<Signup />)

      const passwordInput = screen.getByPlaceholderText(/password/i)
      fireEvent.change(passwordInput, { target: { value: '123' } })
      fireEvent.blur(passwordInput)

      await waitFor(() => {
        expect(screen.getByText(/password must be at least 6 characters/i)).toBeInTheDocument()
      })
    })

    it('shows company name field when Agent role is selected', async () => {
      render(<Signup />)

      const agentRadio = screen.getByLabelText(/i am an agent/i)
      fireEvent.click(agentRadio)

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/company name/i)).toBeInTheDocument()
      })
    })

    it('handles successful signup', async () => {
      mockFetchSuccess({ message: 'Account created successfully' })

      render(<Signup />)

      // Fill in all fields
      fireEvent.change(screen.getByPlaceholderText(/full name/i), {
        target: { value: 'Test User' },
      })
      fireEvent.change(screen.getByPlaceholderText(/email/i), {
        target: { value: 'test@example.com' },
      })
      fireEvent.change(screen.getByPlaceholderText(/username/i), {
        target: { value: 'testuser' },
      })
      fireEvent.change(screen.getByPlaceholderText(/mobile number/i), {
        target: { value: '1234567890' },
      })
      fireEvent.change(screen.getByPlaceholderText(/password/i), {
        target: { value: 'password123' },
      })

      // Submit form
      const submitButton = screen.getByRole('button', { name: /sign up/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/auth/login')
      })
    })

    it('shows error message on signup failure', async () => {
      mockFetchError('Registration failed')

      render(<Signup />)

      // Fill in all fields
      fireEvent.change(screen.getByPlaceholderText(/full name/i), {
        target: { value: 'Test User' },
      })
      fireEvent.change(screen.getByPlaceholderText(/email/i), {
        target: { value: 'test@example.com' },
      })
      fireEvent.change(screen.getByPlaceholderText(/username/i), {
        target: { value: 'testuser' },
      })
      fireEvent.change(screen.getByPlaceholderText(/mobile number/i), {
        target: { value: '1234567890' },
      })
      fireEvent.change(screen.getByPlaceholderText(/password/i), {
        target: { value: 'password123' },
      })

      // Submit form
      const submitButton = screen.getByRole('button', { name: /sign up/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/registration failed/i)).toBeInTheDocument()
      })
    })

    it('has link to login page', () => {
      render(<Signup />)
      const loginLink = screen.getByText(/already have an account/i)
      expect(loginLink).toBeInTheDocument()
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
      render(<Signup />)

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/auth/userinfo')
      })
    })
  })
})
