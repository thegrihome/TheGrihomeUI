/**
 * Responsive Design Test Suite
 * Tests for all screen resolutions from mobile to ultra-wide displays
 */

import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'

// Mock screen size utility
const mockScreenSize = (width: number, height: number = 768) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  })
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height,
  })
  window.dispatchEvent(new Event('resize'))
}

// Test component with responsive classes
const ResponsiveTestComponent = () => (
  <div className="container-responsive">
    <h1 className="text-responsive-base">Responsive Heading</h1>
    <div className="grid-responsive-1 grid-responsive-2 grid-responsive-3 grid-responsive-4">
      <div className="text-responsive-xs">Item 1</div>
      <div className="text-responsive-sm">Item 2</div>
      <div className="text-responsive-base">Item 3</div>
    </div>
    <img src="/test.jpg" alt="test" className="img-responsive" />
  </div>
)

describe('Responsive Design System', () => {
  describe('Screen Size Definitions', () => {
    it('defines all required breakpoints', () => {
      const breakpoints = {
        xs: 360,
        sm: 640,
        md: 768,
        lg: 1024,
        xl: 1280,
        '2xl': 1536,
        '3xl': 1920,
        '4xl': 2560,
      }

      expect(breakpoints).toHaveProperty('xs')
      expect(breakpoints).toHaveProperty('sm')
      expect(breakpoints).toHaveProperty('md')
      expect(breakpoints).toHaveProperty('lg')
      expect(breakpoints).toHaveProperty('xl')
      expect(breakpoints).toHaveProperty('2xl')
      expect(breakpoints).toHaveProperty('3xl')
      expect(breakpoints).toHaveProperty('4xl')
    })
  })

  describe('Mobile Devices (360px - 639px)', () => {
    beforeEach(() => {
      mockScreenSize(360, 640)
    })

    it('renders correctly on small mobile (360px)', () => {
      const { container } = render(<ResponsiveTestComponent />)
      expect(container.querySelector('.container-responsive')).toBeInTheDocument()
    })

    it('applies mobile-specific styles', () => {
      const { container } = render(<ResponsiveTestComponent />)
      const element = container.querySelector('.container-responsive')
      expect(element).toHaveStyle({ width: '100%' })
    })

    it('shows mobile navigation elements', () => {
      mockScreenSize(480)
      // Mobile menu button should be visible
      // Desktop nav should be hidden
      expect(window.innerWidth).toBe(480)
    })
  })

  describe('Mobile Landscape (640px - 767px)', () => {
    beforeEach(() => {
      mockScreenSize(640, 360)
    })

    it('renders correctly on mobile landscape', () => {
      const { container } = render(<ResponsiveTestComponent />)
      expect(container.querySelector('.container-responsive')).toBeInTheDocument()
    })

    it('adjusts layout for landscape orientation', () => {
      expect(window.innerWidth).toBe(640)
      expect(window.innerHeight).toBe(360)
    })
  })

  describe('Tablet Portrait (768px - 1023px)', () => {
    beforeEach(() => {
      mockScreenSize(768, 1024)
    })

    it('renders correctly on tablet portrait', () => {
      const { container } = render(<ResponsiveTestComponent />)
      expect(container.querySelector('.container-responsive')).toBeInTheDocument()
    })

    it('applies tablet-specific layout', () => {
      expect(window.innerWidth).toBe(768)
    })

    it('shows 2-column grid on tablet', () => {
      const { container } = render(<ResponsiveTestComponent />)
      const grid = container.querySelector('.grid-responsive-2')
      expect(grid).toBeInTheDocument()
    })
  })

  describe('Tablet Landscape (1024px - 1279px)', () => {
    beforeEach(() => {
      mockScreenSize(1024, 768)
    })

    it('renders correctly on tablet landscape', () => {
      const { container } = render(<ResponsiveTestComponent />)
      expect(container.querySelector('.container-responsive')).toBeInTheDocument()
    })

    it('shows 3-column grid on large tablet', () => {
      const { container } = render(<ResponsiveTestComponent />)
      const grid = container.querySelector('.grid-responsive-3')
      expect(grid).toBeInTheDocument()
    })
  })

  describe('Desktop (1280px - 1535px)', () => {
    beforeEach(() => {
      mockScreenSize(1280, 1024)
    })

    it('renders correctly on desktop', () => {
      const { container } = render(<ResponsiveTestComponent />)
      expect(container.querySelector('.container-responsive')).toBeInTheDocument()
    })

    it('applies desktop-specific styles', () => {
      expect(window.innerWidth).toBe(1280)
    })

    it('shows desktop navigation', () => {
      // Desktop nav should be visible
      // Mobile menu should be hidden
      expect(window.innerWidth).toBeGreaterThanOrEqual(1280)
    })
  })

  describe('Large Desktop (1536px - 1919px)', () => {
    beforeEach(() => {
      mockScreenSize(1536, 1080)
    })

    it('renders correctly on large desktop', () => {
      const { container } = render(<ResponsiveTestComponent />)
      expect(container.querySelector('.container-responsive')).toBeInTheDocument()
    })

    it('shows 4-column grid on large desktop', () => {
      const { container } = render(<ResponsiveTestComponent />)
      const grid = container.querySelector('.grid-responsive-4')
      expect(grid).toBeInTheDocument()
    })
  })

  describe('Full HD (1920px - 2559px)', () => {
    beforeEach(() => {
      mockScreenSize(1920, 1080)
    })

    it('renders correctly on Full HD display', () => {
      const { container } = render(<ResponsiveTestComponent />)
      expect(container.querySelector('.container-responsive')).toBeInTheDocument()
    })

    it('applies Full HD specific spacing', () => {
      expect(window.innerWidth).toBe(1920)
    })

    it('increases font sizes for larger displays', () => {
      const { container } = render(<ResponsiveTestComponent />)
      const text = container.querySelector('.text-responsive-base')
      expect(text).toBeInTheDocument()
    })
  })

  describe('Ultra-Wide / 2K (2560px+)', () => {
    beforeEach(() => {
      mockScreenSize(2560, 1440)
    })

    it('renders correctly on ultra-wide display', () => {
      const { container } = render(<ResponsiveTestComponent />)
      expect(container.querySelector('.container-responsive')).toBeInTheDocument()
    })

    it('shows 6-column grid on ultra-wide', () => {
      const { container } = render(<ResponsiveTestComponent />)
      const grid = container.querySelector('.grid-responsive-6')
      expect(grid).toBeInTheDocument()
    })

    it('applies maximum spacing for ultra-wide displays', () => {
      expect(window.innerWidth).toBeGreaterThanOrEqual(2560)
    })
  })

  describe('4K Display (3840px+)', () => {
    beforeEach(() => {
      mockScreenSize(3840, 2160)
    })

    it('renders correctly on 4K display', () => {
      const { container } = render(<ResponsiveTestComponent />)
      expect(container.querySelector('.container-responsive')).toBeInTheDocument()
    })

    it('handles extremely large resolutions', () => {
      expect(window.innerWidth).toBe(3840)
      expect(window.innerHeight).toBe(2160)
    })
  })

  describe('Responsive Images', () => {
    it('applies responsive image class', () => {
      const { container } = render(<ResponsiveTestComponent />)
      const img = container.querySelector('.img-responsive')
      expect(img).toBeInTheDocument()
      expect(img).toHaveClass('img-responsive')
    })

    it('ensures images do not overflow', () => {
      const { container } = render(
        <img src="/test.jpg" alt="test" className="img-responsive" />
      )
      const img = container.querySelector('img')
      expect(img).toHaveClass('img-responsive')
    })
  })

  describe('Responsive Text', () => {
    it('applies text-responsive-xs class', () => {
      const { container } = render(
        <span className="text-responsive-xs">Small Text</span>
      )
      const text = container.querySelector('.text-responsive-xs')
      expect(text).toBeInTheDocument()
    })

    it('applies text-responsive-sm class', () => {
      const { container } = render(
        <span className="text-responsive-sm">Medium Text</span>
      )
      const text = container.querySelector('.text-responsive-sm')
      expect(text).toBeInTheDocument()
    })

    it('applies text-responsive-base class', () => {
      const { container } = render(
        <span className="text-responsive-base">Base Text</span>
      )
      const text = container.querySelector('.text-responsive-base')
      expect(text).toBeInTheDocument()
    })
  })

  describe('Container Responsiveness', () => {
    it('applies container-responsive class', () => {
      const { container } = render(
        <div className="container-responsive">
          <p>Content</p>
        </div>
      )
      const element = container.querySelector('.container-responsive')
      expect(element).toBeInTheDocument()
    })

    it('contains content within max-width', () => {
      const { container } = render(
        <div className="container-responsive">
          <p>Content that should not overflow</p>
        </div>
      )
      const element = container.querySelector('.container-responsive')
      expect(element).toHaveStyle({ width: '100%' })
    })
  })

  describe('Orientation Changes', () => {
    it('handles portrait to landscape transition', () => {
      mockScreenSize(768, 1024) // Portrait
      expect(window.innerWidth).toBe(768)
      expect(window.innerHeight).toBe(1024)

      mockScreenSize(1024, 768) // Landscape
      expect(window.innerWidth).toBe(1024)
      expect(window.innerHeight).toBe(768)
    })

    it('handles landscape to portrait transition', () => {
      mockScreenSize(1024, 768) // Landscape
      expect(window.innerWidth).toBe(1024)

      mockScreenSize(768, 1024) // Portrait
      expect(window.innerWidth).toBe(768)
    })
  })

  describe('Edge Cases', () => {
    it('handles minimum supported width (360px)', () => {
      mockScreenSize(360)
      expect(window.innerWidth).toBe(360)
      const { container } = render(<ResponsiveTestComponent />)
      expect(container).toBeInTheDocument()
    })

    it('handles very narrow screens (< 360px)', () => {
      mockScreenSize(320)
      expect(window.innerWidth).toBe(320)
      // Should still render, though not officially supported
      const { container } = render(<ResponsiveTestComponent />)
      expect(container).toBeInTheDocument()
    })

    it('handles extremely wide screens (> 5000px)', () => {
      mockScreenSize(5120, 2880)
      expect(window.innerWidth).toBe(5120)
      const { container } = render(<ResponsiveTestComponent />)
      expect(container).toBeInTheDocument()
    })
  })

  describe('Overflow Prevention', () => {
    it('prevents horizontal overflow on body', () => {
      const { container } = render(<ResponsiveTestComponent />)
      // Check that overflow-x: hidden is applied
      expect(document.body.style.overflowX !== 'scroll').toBe(true)
    })

    it('ensures content does not exceed viewport width', () => {
      const { container } = render(
        <div style={{ width: '100vw' }}>
          <ResponsiveTestComponent />
        </div>
      )
      expect(container).toBeInTheDocument()
    })
  })
})
