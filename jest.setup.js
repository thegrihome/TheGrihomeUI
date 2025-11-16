// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Suppress console errors for Google Maps API key warnings globally
const originalError = console.error
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Google Maps API key') ||
        args[0].includes('Not implemented: HTMLFormElement.prototype.submit'))
    ) {
      return
    }
    originalError.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
})

// Mock next/router
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
  push: jest.fn(),
}))

// Mock next-auth/react
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({
    data: null,
    status: 'unauthenticated',
  })),
  signIn: jest.fn(),
  signOut: jest.fn(),
  getSession: jest.fn(),
}))

// Mock Google Maps
global.google = {
  maps: {
    places: {
      AutocompleteService: jest.fn(() => ({
        getPlacePredictions: jest.fn(),
      })),
      PlacesService: jest.fn(() => ({
        getDetails: jest.fn(),
      })),
      PlacesServiceStatus: {
        OK: 'OK',
      },
    },
    Map: jest.fn(),
    Marker: jest.fn(),
    Animation: {
      DROP: 'DROP',
    },
  },
}

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
  takeRecords() {
    return []
  }
}
