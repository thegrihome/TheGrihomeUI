import React from 'react'
import { render } from '@testing-library/react'
import Document from '@/pages/_document'

jest.mock('next/document', () => ({
  Html: ({ children, ...props }: any) => <html {...props}>{children}</html>,
  Head: ({ children }: any) => <head>{children}</head>,
  Main: () => <main>Main</main>,
  NextScript: () => <script>NextScript</script>,
}))

describe('Document Component', () => {
  it('should render document structure', () => {
    const { container } = render(<Document />)

    expect(container.querySelector('html')).toBeInTheDocument()
    expect(container.querySelector('head')).toBeInTheDocument()
    expect(container.querySelector('body')).toBeInTheDocument()
  })

  it('should set lang attribute to en', () => {
    const { container } = render(<Document />)

    const html = container.querySelector('html')
    expect(html).toHaveAttribute('lang', 'en')
  })

  it('should include favicon link', () => {
    const { container } = render(<Document />)

    const favicon = container.querySelector('link[href="/favicon.ico"]')
    expect(favicon).toBeInTheDocument()
    expect(favicon).toHaveAttribute('rel', 'icon')
    expect(favicon).toHaveAttribute('type', 'image/x-icon')
  })

  it('should include 32x32 favicon', () => {
    const { container } = render(<Document />)

    const favicon32 = container.querySelector('link[href="/favicon-32x32.png"]')
    expect(favicon32).toBeInTheDocument()
    expect(favicon32).toHaveAttribute('sizes', '32x32')
  })

  it('should include 16x16 favicon', () => {
    const { container } = render(<Document />)

    const favicon16 = container.querySelector('link[href="/favicon-16x16.png"]')
    expect(favicon16).toBeInTheDocument()
    expect(favicon16).toHaveAttribute('sizes', '16x16')
  })

  it('should include apple touch icon', () => {
    const { container } = render(<Document />)

    const appleIcon = container.querySelector('link[href="/apple-touch-icon.png"]')
    expect(appleIcon).toBeInTheDocument()
    expect(appleIcon).toHaveAttribute('rel', 'apple-touch-icon')
    expect(appleIcon).toHaveAttribute('sizes', '180x180')
  })

  it('should set theme color', () => {
    const { container } = render(<Document />)

    const themeMeta = container.querySelector('meta[name="theme-color"]')
    expect(themeMeta).toBeInTheDocument()
    expect(themeMeta).toHaveAttribute('content', '#9333ea')
  })

  it('should render Main component', () => {
    const { container } = render(<Document />)

    expect(container.textContent).toContain('Main')
  })

  it('should render NextScript component', () => {
    const { container } = render(<Document />)

    expect(container.textContent).toContain('NextScript')
  })
})
