/**
 * Viewport Testing Utilities
 * Helper functions for testing responsive designs across all screen sizes
 */

export type ScreenSize =
  | 'mobile-small'
  | 'mobile'
  | 'mobile-landscape'
  | 'tablet-portrait'
  | 'tablet-landscape'
  | 'desktop'
  | 'desktop-large'
  | 'fullhd'
  | 'ultrawide'
  | '4k'

export interface ViewportDimensions {
  width: number
  height: number
  devicePixelRatio?: number
}

// Predefined viewport sizes matching our breakpoints
export const VIEWPORTS: Record<ScreenSize, ViewportDimensions> = {
  'mobile-small': {
    width: 360,
    height: 640,
    devicePixelRatio: 2,
  },
  mobile: {
    width: 375,
    height: 667,
    devicePixelRatio: 2,
  },
  'mobile-landscape': {
    width: 667,
    height: 375,
    devicePixelRatio: 2,
  },
  'tablet-portrait': {
    width: 768,
    height: 1024,
    devicePixelRatio: 2,
  },
  'tablet-landscape': {
    width: 1024,
    height: 768,
    devicePixelRatio: 2,
  },
  desktop: {
    width: 1280,
    height: 1024,
    devicePixelRatio: 1,
  },
  'desktop-large': {
    width: 1536,
    height: 864,
    devicePixelRatio: 1,
  },
  fullhd: {
    width: 1920,
    height: 1080,
    devicePixelRatio: 1,
  },
  ultrawide: {
    width: 2560,
    height: 1440,
    devicePixelRatio: 1,
  },
  '4k': {
    width: 3840,
    height: 2160,
    devicePixelRatio: 2,
  },
}

/**
 * Set the viewport to a specific size
 */
export const setViewport = (dimensions: ViewportDimensions) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: dimensions.width,
  })

  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: dimensions.height,
  })

  if (dimensions.devicePixelRatio) {
    Object.defineProperty(window, 'devicePixelRatio', {
      writable: true,
      configurable: true,
      value: dimensions.devicePixelRatio,
    })
  }

  // Trigger resize event
  window.dispatchEvent(new Event('resize'))
}

/**
 * Set viewport to a predefined screen size
 */
export const setScreenSize = (screenSize: ScreenSize) => {
  const dimensions = VIEWPORTS[screenSize]
  setViewport(dimensions)
}

/**
 * Test a component across all screen sizes
 */
export const testAcrossScreenSizes = (
  callback: (screenSize: ScreenSize, dimensions: ViewportDimensions) => void
) => {
  Object.entries(VIEWPORTS).forEach(([name, dimensions]) => {
    setViewport(dimensions)
    callback(name as ScreenSize, dimensions)
  })
}

/**
 * Check if current viewport matches a breakpoint
 */
export const matchesBreakpoint = (
  breakpoint: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl'
): boolean => {
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

  return window.innerWidth >= breakpoints[breakpoint]
}

/**
 * Get current breakpoint name
 */
export const getCurrentBreakpoint = (): string => {
  const width = window.innerWidth

  if (width >= 2560) return '4xl'
  if (width >= 1920) return '3xl'
  if (width >= 1536) return '2xl'
  if (width >= 1280) return 'xl'
  if (width >= 1024) return 'lg'
  if (width >= 768) return 'md'
  if (width >= 640) return 'sm'
  return 'xs'
}

/**
 * Simulate orientation change
 */
export const changeOrientation = (orientation: 'portrait' | 'landscape') => {
  const currentWidth = window.innerWidth
  const currentHeight = window.innerHeight

  if (orientation === 'landscape' && currentWidth < currentHeight) {
    setViewport({ width: currentHeight, height: currentWidth })
  } else if (orientation === 'portrait' && currentWidth > currentHeight) {
    setViewport({ width: currentHeight, height: currentWidth })
  }
}

/**
 * Check if element is visible within viewport
 */
export const isElementInViewport = (element: Element): boolean => {
  const rect = element.getBoundingClientRect()

  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= window.innerHeight &&
    rect.right <= window.innerWidth
  )
}

/**
 * Check if element causes horizontal overflow
 */
export const causesHorizontalOverflow = (element: Element): boolean => {
  const rect = element.getBoundingClientRect()
  return rect.right > window.innerWidth
}

/**
 * Mock media query matching
 */
export const mockMatchMedia = (query: string): void => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(q => ({
      matches: q === query,
      media: q,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  })
}

/**
 * Get readable screen size name
 */
export const getScreenSizeName = (width: number): string => {
  if (width >= 2560) return 'Ultra-wide / 2K+'
  if (width >= 1920) return 'Full HD'
  if (width >= 1536) return 'Large Desktop'
  if (width >= 1280) return 'Desktop'
  if (width >= 1024) return 'Tablet Landscape'
  if (width >= 768) return 'Tablet Portrait'
  if (width >= 640) return 'Mobile Landscape'
  if (width >= 360) return 'Mobile'
  return 'Small Mobile'
}

/**
 * Test helper: Assert element is responsive
 */
export const assertElementIsResponsive = (element: Element): void => {
  const rect = element.getBoundingClientRect()

  // Should not cause horizontal overflow
  expect(rect.right).toBeLessThanOrEqual(window.innerWidth)

  // Should not have fixed width that's too large
  const computedStyle = window.getComputedStyle(element)
  const width = computedStyle.width

  if (width && width !== 'auto' && !width.includes('%')) {
    const numericWidth = parseFloat(width)
    expect(numericWidth).toBeLessThanOrEqual(window.innerWidth)
  }
}

/**
 * Test helper: Assert text is readable
 */
export const assertTextIsReadable = (element: Element): void => {
  const computedStyle = window.getComputedStyle(element)
  const fontSize = parseFloat(computedStyle.fontSize)

  // Minimum font size for readability (WCAG recommendation)
  const minFontSize = 14 // pixels
  expect(fontSize).toBeGreaterThanOrEqual(minFontSize)
}

/**
 * Test helper: Assert touch target is adequate
 */
export const assertTouchTargetIsAdequate = (element: Element): void => {
  const rect = element.getBoundingClientRect()

  // WCAG recommends minimum 44x44 pixels for touch targets
  const minSize = 44
  expect(rect.width).toBeGreaterThanOrEqual(minSize)
  expect(rect.height).toBeGreaterThanOrEqual(minSize)
}

/**
 * Reset viewport to default desktop size
 */
export const resetViewport = () => {
  setScreenSize('desktop')
}

/**
 * Common screen sizes for quick testing
 */
export const COMMON_SCREEN_SIZES = [
  { name: 'iPhone SE', width: 375, height: 667 },
  { name: 'iPhone 12/13', width: 390, height: 844 },
  { name: 'iPhone 14 Pro Max', width: 430, height: 932 },
  { name: 'iPad Mini', width: 768, height: 1024 },
  { name: 'iPad Pro 11"', width: 834, height: 1194 },
  { name: 'iPad Pro 12.9"', width: 1024, height: 1366 },
  { name: 'MacBook Air', width: 1280, height: 800 },
  { name: 'MacBook Pro 16"', width: 1728, height: 1117 },
  { name: 'Desktop 1080p', width: 1920, height: 1080 },
  { name: 'Desktop 1440p', width: 2560, height: 1440 },
  { name: 'Desktop 4K', width: 3840, height: 2160 },
]

/**
 * Test component across common devices
 */
export const testAcrossCommonDevices = (
  callback: (device: { name: string; width: number; height: number }) => void
) => {
  COMMON_SCREEN_SIZES.forEach(device => {
    setViewport({ width: device.width, height: device.height })
    callback(device)
  })
}
