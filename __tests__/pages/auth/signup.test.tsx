import React from 'react'
import { render, screen } from '@testing-library/react'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import Signup from '@/pages/auth/signup'
import { mockRouter } from '@/__tests__/utils/test-utils'

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}))

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
  signIn: jest.fn(),
}))

describe('Signup Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
    ;(useSession as jest.Mock).mockReturnValue({
      data: null,
      status: 'unauthenticated',
    })
  })

  it('renders signup page correctly', () => {
    render(<Signup />)
    expect(screen.getByText(/create account/i)).toBeInTheDocument()
  })

  it('shows form structure', () => {
    render(<Signup />)
    expect(screen.getByText(/join grihome/i)).toBeInTheDocument()
  })
})
