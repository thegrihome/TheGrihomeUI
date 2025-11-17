/**
 * Viewport Integration Tests
 * End-to-end responsive behavior tests using viewport utilities
 */

import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import {
  setScreenSize,
  testAcrossScreenSizes,
  testAcrossCommonDevices,
  matchesBreakpoint,
  getCurrentBreakpoint,
  changeOrientation,
  assertElementIsResponsive,
  assertTextIsReadable,
  assertTouchTargetIsAdequate,
  getScreenSizeName,
  VIEWPORTS,
} from '../utils/viewport-test-utils'

// Test component
const TestResponsiveLayout = () => (
  <div className="container-responsive">
    <header className="header">
      <h1 className="text-responsive-base">TheGrihome</h1>
      <nav className="desktop-nav hidden md:flex">
        <a href="/properties">Properties</a>
        <a href="/projects">Projects</a>
      </nav>
      <button className="mobile-menu-button md:hidden">Menu</button>
    </header>

    <main className="grid-responsive-1 sm:grid-responsive-2 lg:grid-responsive-3 xl:grid-responsive-4">
      <div className="card">
        <img src="/test.jpg" alt="Test" className="img-responsive" />
        <h2 className="text-responsive-sm">Card Title</h2>
        <p className="text-responsive-xs">Card description goes here</p>
      </div>
    </main>
  </div>
)

describe('Viewport Integration Tests', () => {
  describe('Breakpoint Detection', () => {
    it('correctly identifies xs breakpoint (360px)', () => {
      setScreenSize('mobile-small')
      expect(getCurrentBreakpoint()).toBe('xs')
      expect(matchesBreakpoint('xs')).toBe(true)
      expect(matchesBreakpoint('sm')).toBe(false)
    })

    it('correctly identifies sm breakpoint (640px+)', () => {
      setScreenSize('mobile-landscape')
      expect(getCurrentBreakpoint()).toBe('sm')
      expect(matchesBreakpoint('sm')).toBe(true)
      expect(matchesBreakpoint('md')).toBe(false)
    })

    it('correctly identifies md breakpoint (768px+)', () => {
      setScreenSize('tablet-portrait')
      expect(getCurrentBreakpoint()).toBe('md')
      expect(matchesBreakpoint('md')).toBe(true)
      expect(matchesBreakpoint('lg')).toBe(false)
    })

    it('correctly identifies lg breakpoint (1024px+)', () => {
      setScreenSize('tablet-landscape')
      expect(getCurrentBreakpoint()).toBe('lg')
      expect(matchesBreakpoint('lg')).toBe(true)
      expect(matchesBreakpoint('xl')).toBe(false)
    })

    it('correctly identifies xl breakpoint (1280px+)', () => {
      setScreenSize('desktop')
      expect(getCurrentBreakpoint()).toBe('xl')
      expect(matchesBreakpoint('xl')).toBe(true)
      expect(matchesBreakpoint('2xl')).toBe(false)
    })

    it('correctly identifies 2xl breakpoint (1536px+)', () => {
      setScreenSize('desktop-large')
      expect(getCurrentBreakpoint()).toBe('2xl')
      expect(matchesBreakpoint('2xl')).toBe(true)
      expect(matchesBreakpoint('3xl')).toBe(false)
    })

    it('correctly identifies 3xl breakpoint (1920px+)', () => {
      setScreenSize('fullhd')
      expect(getCurrentBreakpoint()).toBe('3xl')
      expect(matchesBreakpoint('3xl')).toBe(true)
      expect(matchesBreakpoint('4xl')).toBe(false)
    })

    it('correctly identifies 4xl breakpoint (2560px+)', () => {
      setScreenSize('ultrawide')
      expect(getCurrentBreakpoint()).toBe('4xl')
      expect(matchesBreakpoint('4xl')).toBe(true)
    })
  })

  describe('Screen Size Names', () => {
    it('returns correct name for each breakpoint', () => {
      expect(getScreenSizeName(360)).toBe('Mobile')
      expect(getScreenSizeName(640)).toBe('Mobile Landscape')
      expect(getScreenSizeName(768)).toBe('Tablet Portrait')
      expect(getScreenSizeName(1024)).toBe('Tablet Landscape')
      expect(getScreenSizeName(1280)).toBe('Desktop')
      expect(getScreenSizeName(1536)).toBe('Large Desktop')
      expect(getScreenSizeName(1920)).toBe('Full HD')
      expect(getScreenSizeName(2560)).toBe('Ultra-wide / 2K+')
    })
  })

  describe('All Screen Sizes Test', () => {
    it('renders correctly across all defined screen sizes', () => {
      testAcrossScreenSizes((screenSize, dimensions) => {
        const { container } = render(<TestResponsiveLayout />)

        // Component should render without errors
        expect(container.querySelector('.container-responsive')).toBeInTheDocument()

        // Viewport should match expected dimensions
        expect(window.innerWidth).toBe(dimensions.width)
        expect(window.innerHeight).toBe(dimensions.height)
      })
    })

    it('maintains responsive classes across all screen sizes', () => {
      testAcrossScreenSizes(screenSize => {
        const { container } = render(<TestResponsiveLayout />)

        // Container should always be present
        const containerElement = container.querySelector('.container-responsive')
        expect(containerElement).toBeInTheDocument()

        // Grid should be present
        const gridElement = container.querySelector('[class*="grid-responsive"]')
        expect(gridElement).toBeInTheDocument()
      })
    })
  })

  describe('Common Devices Test', () => {
    it('renders correctly on all common devices', () => {
      testAcrossCommonDevices(device => {
        const { container } = render(<TestResponsiveLayout />)

        // Should render on all devices
        expect(container.querySelector('.container-responsive')).toBeInTheDocument()

        // Log for visibility
        console.log(`✓ Tested on ${device.name} (${device.width}x${device.height})`)
      })
    })

    it('no horizontal overflow on any common device', () => {
      testAcrossCommonDevices(device => {
        const { container } = render(<TestResponsiveLayout />)
        const element = container.querySelector('.container-responsive')

        if (element) {
          assertElementIsResponsive(element)
        }
      })
    })
  })

  describe('Orientation Changes', () => {
    it('handles portrait to landscape transition', () => {
      setScreenSize('tablet-portrait')
      expect(window.innerWidth).toBe(768)
      expect(window.innerHeight).toBe(1024)

      changeOrientation('landscape')
      expect(window.innerWidth).toBe(1024)
      expect(window.innerHeight).toBe(768)
    })

    it('handles landscape to portrait transition', () => {
      setScreenSize('tablet-landscape')
      expect(window.innerWidth).toBe(1024)
      expect(window.innerHeight).toBe(768)

      changeOrientation('portrait')
      expect(window.innerWidth).toBe(768)
      expect(window.innerHeight).toBe(1024)
    })

    it('component re-renders correctly after orientation change', () => {
      setScreenSize('mobile')
      const { container, rerender } = render(<TestResponsiveLayout />)

      expect(container.querySelector('.container-responsive')).toBeInTheDocument()

      changeOrientation('landscape')
      rerender(<TestResponsiveLayout />)

      expect(container.querySelector('.container-responsive')).toBeInTheDocument()
    })
  })

  describe('Responsive Element Validation', () => {
    it('container is responsive on all screen sizes', () => {
      testAcrossScreenSizes(() => {
        const { container } = render(<TestResponsiveLayout />)
        const element = container.querySelector('.container-responsive')

        if (element) {
          assertElementIsResponsive(element)
        }
      })
    })

    it('images are responsive on all screen sizes', () => {
      testAcrossScreenSizes(() => {
        const { container } = render(<TestResponsiveLayout />)
        const images = container.querySelectorAll('.img-responsive')

        images.forEach(img => {
          assertElementIsResponsive(img)
        })
      })
    })

    it('text is readable on all screen sizes', () => {
      testAcrossScreenSizes(() => {
        const { container } = render(<TestResponsiveLayout />)
        const textElements = container.querySelectorAll('[class*="text-responsive"]')

        textElements.forEach(element => {
          assertTextIsReadable(element)
        })
      })
    })
  })

  describe('Touch Target Validation', () => {
    const ButtonComponent = () => (
      <div>
        <button
          className="btn-responsive"
          style={{ minWidth: '44px', minHeight: '44px', padding: '12px 24px' }}
        >
          Click Me
        </button>
        <a
          href="/test"
          style={{ display: 'inline-block', minWidth: '44px', minHeight: '44px', padding: '12px' }}
        >
          Link
        </a>
      </div>
    )

    it('buttons have adequate touch targets on mobile', () => {
      setScreenSize('mobile')
      const { container } = render(<ButtonComponent />)
      const button = container.querySelector('button')

      if (button) {
        assertTouchTargetIsAdequate(button)
      }
    })

    it('links have adequate touch targets on mobile', () => {
      setScreenSize('mobile')
      const { container } = render(<ButtonComponent />)
      const link = container.querySelector('a')

      if (link) {
        assertTouchTargetIsAdequate(link)
      }
    })

    it('touch targets are adequate across all mobile devices', () => {
      const mobileDevices = ['mobile-small', 'mobile', 'mobile-landscape'] as const

      mobileDevices.forEach(device => {
        setScreenSize(device)
        const { container } = render(<ButtonComponent />)

        const button = container.querySelector('button')
        const link = container.querySelector('a')

        if (button) assertTouchTargetIsAdequate(button)
        if (link) assertTouchTargetIsAdequate(link)
      })
    })
  })

  describe('Device Pixel Ratio', () => {
    it('sets correct device pixel ratio for retina displays', () => {
      setScreenSize('mobile')
      expect(window.devicePixelRatio).toBe(2)
    })

    it('sets correct device pixel ratio for standard displays', () => {
      setScreenSize('desktop')
      expect(window.devicePixelRatio).toBe(1)
    })

    it('handles high-DPI displays correctly', () => {
      setScreenSize('4k')
      expect(window.devicePixelRatio).toBe(2)
    })
  })

  describe('Extreme Edge Cases', () => {
    it('handles very narrow screens (320px)', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        value: 320,
      })

      const { container } = render(<TestResponsiveLayout />)
      expect(container.querySelector('.container-responsive')).toBeInTheDocument()
    })

    it('handles very tall screens', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        value: 390,
      })
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        value: 2000,
      })

      const { container } = render(<TestResponsiveLayout />)
      expect(container.querySelector('.container-responsive')).toBeInTheDocument()
    })

    it('handles ultra-wide screens (5120px)', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        value: 5120,
      })
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        value: 2880,
      })

      const { container } = render(<TestResponsiveLayout />)
      expect(container.querySelector('.container-responsive')).toBeInTheDocument()
    })

    it('handles square viewports', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        value: 1024,
      })
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        value: 1024,
      })

      const { container } = render(<TestResponsiveLayout />)
      expect(container.querySelector('.container-responsive')).toBeInTheDocument()
    })
  })

  describe('Performance Across Screen Sizes', () => {
    it('renders quickly on all screen sizes', () => {
      testAcrossScreenSizes(screenSize => {
        const startTime = performance.now()
        render(<TestResponsiveLayout />)
        const endTime = performance.now()

        const renderTime = endTime - startTime
        // Should render in less than 100ms
        expect(renderTime).toBeLessThan(100)
      })
    })
  })
})
