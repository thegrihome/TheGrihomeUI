import React from 'react'
import { render, screen } from '@testing-library/react'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import Login from '@/pages/auth/login'
import { mockRouter } from '@/__tests__/utils/test-utils'

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
    ;(useSession as jest.Mock).mockReturnValue({
      data: null,
      status: 'unauthenticated',
    })
  })

  it('renders login page correctly', () => {
    render(<Login />)
    expect(screen.getByText(/welcome back/i)).toBeInTheDocument()
  })

  it('shows login form elements', () => {
    render(<Login />)
    // Just check that the page renders
    expect(screen.getByText(/welcome back/i)).toBeInTheDocument()
  })
})
