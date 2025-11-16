import React from 'react'
import { render } from '@testing-library/react'
import { useRouter } from 'next/router'
import LoginRedirect from '@/pages/login'

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}))

describe('Login Redirect Page', () => {
  const mockReplace = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({
      replace: mockReplace,
    })
  })

  it('should redirect to /auth/login', () => {
    render(<LoginRedirect />)

    expect(mockReplace).toHaveBeenCalledWith('/auth/login')
  })

  it('should render null', () => {
    const { container } = render(<LoginRedirect />)

    expect(container.firstChild).toBeNull()
  })

  it('should call replace immediately on mount', () => {
    render(<LoginRedirect />)

    expect(mockReplace).toHaveBeenCalledTimes(1)
  })
})
