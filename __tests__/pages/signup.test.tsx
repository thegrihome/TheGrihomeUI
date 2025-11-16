import React from 'react'
import { render } from '@testing-library/react'
import { useRouter } from 'next/router'
import SignupRedirect from '@/pages/signup'

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}))

describe('Signup Redirect Page', () => {
  const mockReplace = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({
      replace: mockReplace,
    })
  })

  it('should redirect to /auth/signup', () => {
    render(<SignupRedirect />)

    expect(mockReplace).toHaveBeenCalledWith('/auth/signup')
  })

  it('should render null', () => {
    const { container } = render(<SignupRedirect />)

    expect(container.firstChild).toBeNull()
  })

  it('should call replace immediately on mount', () => {
    render(<SignupRedirect />)

    expect(mockReplace).toHaveBeenCalledTimes(1)
  })
})
