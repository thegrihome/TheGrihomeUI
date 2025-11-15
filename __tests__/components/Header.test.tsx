import React from 'react'
import { render, screen } from '@testing-library/react'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import Header from '@/components/Header'
import { mockRouter } from '@/__tests__/utils/test-utils'

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}))

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
  signOut: jest.fn(),
}))

describe('Header Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
    ;(useSession as jest.Mock).mockReturnValue({
      data: null,
      status: 'unauthenticated',
    })
  })

  it('renders header correctly', () => {
    render(<Header />)
    expect(screen.getByText(/grihome/i)).toBeInTheDocument()
  })

  it('shows navigation links', () => {
    render(<Header />)
    expect(screen.getByText(/buy/i)).toBeInTheDocument()
    expect(screen.getByText(/rent/i)).toBeInTheDocument()
    expect(screen.getByText(/projects/i)).toBeInTheDocument()
  })

  it('shows sign in button for unauthenticated users', () => {
    render(<Header />)
    expect(screen.getByText(/sign in/i)).toBeInTheDocument()
  })
})
