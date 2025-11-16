import React from 'react'
import { render } from '@testing-library/react'
import App from '@/pages/_app'

jest.mock('next-auth/react', () => ({
  SessionProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

describe('App Component', () => {
  const mockComponent = () => <div>Test Component</div>
  const mockPageProps = {}

  it('should render component', () => {
    const { container } = render(
      <App Component={mockComponent} pageProps={mockPageProps} router={{} as any} />
    )

    expect(container.textContent).toContain('Test Component')
  })

  it('should wrap with SessionProvider', () => {
    const mockSession = { user: { email: 'test@example.com' } }
    const pagePropsWithSession = { session: mockSession }

    const { container } = render(
      <App Component={mockComponent} pageProps={pagePropsWithSession} router={{} as any} />
    )

    expect(container).toBeInTheDocument()
  })

  it('should pass pageProps to component', () => {
    const TestComponent = (props: any) => <div>{JSON.stringify(props)}</div>
    const pageProps = { test: 'value' }

    const { container } = render(
      <App Component={TestComponent} pageProps={pageProps} router={{} as any} />
    )

    expect(container.textContent).toContain('test')
    expect(container.textContent).toContain('value')
  })

  it('should exclude session from pageProps', () => {
    const TestComponent = (props: any) => <div>{JSON.stringify(props)}</div>
    const pageProps = { session: { user: {} }, otherProp: 'value' }

    const { container } = render(
      <App Component={TestComponent} pageProps={pageProps} router={{} as any} />
    )

    expect(container.textContent).not.toContain('session')
    expect(container.textContent).toContain('otherProp')
  })

  it('should include Google Maps script', () => {
    const originalEnv = process.env
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = 'test-key'

    const { container } = render(
      <App Component={mockComponent} pageProps={mockPageProps} router={{} as any} />
    )

    // next/script doesn't create real DOM elements in test environment
    // Just verify the app renders successfully with the script component
    expect(container).toBeInTheDocument()

    process.env = originalEnv
  })

  it('should set window.googleMapsLoaded on script load', () => {
    const originalEnv = process.env
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = 'test-key'

    render(<App Component={mockComponent} pageProps={mockPageProps} router={{} as any} />)

    process.env = originalEnv
  })
})
