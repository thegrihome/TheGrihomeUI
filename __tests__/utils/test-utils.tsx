import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { SessionProvider } from 'next-auth/react'

// Mock session data
export const mockSession = {
  user: {
    id: 'test-user-id',
    name: 'Test User',
    email: 'test@example.com',
    username: 'testuser',
    mobileNumber: '+911234567890',
    isEmailVerified: true,
    isMobileVerified: true,
    isAgent: false,
    companyName: null,
    imageLink: null,
  },
  expires: '2099-12-31',
}

export const mockAgentSession = {
  user: {
    ...mockSession.user,
    isAgent: true,
    companyName: 'Test Realty',
  },
  expires: '2099-12-31',
}

// Custom render with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  session?: any
}

export function renderWithSession(
  ui: ReactElement,
  { session = null, ...renderOptions }: CustomRenderOptions = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return <SessionProvider session={session}>{children}</SessionProvider>
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions })
}

// Mock fetch responses
export const mockFetchSuccess = (data: any) => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve(data),
    })
  ) as jest.Mock
}

export const mockFetchError = (message: string, status = 500) => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: false,
      status,
      json: () => Promise.resolve({ message }),
    })
  ) as jest.Mock
}

// Mock router
export const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  reload: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  prefetch: jest.fn(),
  beforePopState: jest.fn(),
  isReady: true,
  pathname: '/',
  query: {},
  asPath: '/',
  route: '/',
  basePath: '',
  isFallback: false,
  isLocaleDomain: false,
  isPreview: false,
  events: {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
  },
}

// Wait for async updates
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0))
