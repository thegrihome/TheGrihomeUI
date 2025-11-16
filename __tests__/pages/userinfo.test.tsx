import React from 'react'
import { render } from '@testing-library/react'
import { useRouter } from 'next/router'
import UserinfoRedirect from '@/pages/userinfo'

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}))

describe('Userinfo Redirect Page', () => {
  const mockReplace = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({
      replace: mockReplace,
    })
  })

  it('should redirect to /auth/userinfo', () => {
    render(<UserinfoRedirect />)

    expect(mockReplace).toHaveBeenCalledWith('/auth/userinfo')
  })

  it('should render null', () => {
    const { container } = render(<UserinfoRedirect />)

    expect(container.firstChild).toBeNull()
  })

  it('should call replace immediately on mount', () => {
    render(<UserinfoRedirect />)

    expect(mockReplace).toHaveBeenCalledTimes(1)
  })
})
