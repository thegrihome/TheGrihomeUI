// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Polyfill for TextEncoder/TextDecoder (required by jose/openid-client used by NextAuth)
const { TextEncoder, TextDecoder } = require('util')
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Suppress console errors for known test warnings
const originalError = console.error
const originalWarn = console.warn

beforeAll(() => {
  console.error = (...args) => {
    const message = typeof args[0] === 'string' ? args[0] : ''
    const errorObj = args[0]
    if (
      message.includes('Google Maps API key') ||
      message.includes('Not implemented: HTMLFormElement.prototype.submit') ||
      message.includes('Not implemented: window.scrollTo') ||
      message.includes('ReactDOM.render') ||
      message.includes('act()') ||
      message.includes('Warning: An update to') ||
      (errorObj && errorObj.type === 'not implemented')
    ) {
      return
    }
    originalError.call(console, ...args)
  }

  console.warn = (...args) => {
    const message = typeof args[0] === 'string' ? args[0] : ''
    if (message.includes('componentWillReceiveProps') || message.includes('componentWillMount')) {
      return
    }
    originalWarn.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
  console.warn = originalWarn
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

// Mock next-auth default export
jest.mock('next-auth', () => {
  return jest.fn(() => (req, res) => res.status(200).json({}))
})

// Mock database config to prevent DATABASE_URL errors
jest.mock('./lib/cockroachDB/database-config', () => ({
  getDatabaseConfig: jest.fn(() => ({
    url: 'postgresql://test:test@localhost:5432/test',
    maxConnections: 5,
  })),
  logDatabaseConnection: jest.fn(),
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

// Mock scrollIntoView
Element.prototype.scrollIntoView = jest.fn()

// Mock uuid to avoid ESM issues
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-1234'),
  v1: jest.fn(() => 'test-uuid-1234'),
  v3: jest.fn(() => 'test-uuid-1234'),
  v5: jest.fn(() => 'test-uuid-1234'),
}))
