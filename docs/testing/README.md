# Testing Documentation

This directory contains comprehensive unit tests for the Grihome application.

## Setup

### Install Dependencies

Before running tests, install the required testing dependencies:

```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event jest jest-environment-jsdom node-mocks-http
```

### Test Configuration

The test configuration is already set up:

- `jest.config.js` - Jest configuration
- `jest.setup.js` - Global test setup and mocks
- `__tests__/utils/test-utils.tsx` - Custom render utilities and helpers

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (auto-rerun on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run tests in CI mode (for continuous integration)
npm run test:ci
```

## Test Structure

Tests are organized by module:

### Authentication Tests

- `__tests__/pages/auth/login.test.tsx` - Login page tests
- `__tests__/pages/auth/signup.test.tsx` - Signup page tests

### Property Tests

- `__tests__/pages/properties/index.test.tsx` - Properties listing and filtering
- `__tests__/api/properties/list.test.ts` - Properties API endpoint

### Agent Tests

- `__tests__/pages/agents/[id]/properties.test.tsx` - Agent properties listing

### Project Tests

- `__tests__/pages/projects/submit.test.tsx` - Project submission form

### Home Page Tests

- `__tests__/pages/index.test.tsx` - Home page and benefits section

### Component Tests

- `__tests__/components/Header.test.tsx` - Header component
- `__tests__/components/Footer.test.tsx` - Footer component

### Utility Tests

- `__tests__/lib/utils/geocoding.test.ts` - Geocoding utilities

## Test Coverage

The test suite covers:

### Authentication Flows

- ✅ Login with password
- ✅ Login with OTP
- ✅ Google OAuth login
- ✅ Signup with role selection (Buyer/Agent)
- ✅ Field validation (email, username, mobile, password)
- ✅ Uniqueness checks (email, username)
- ✅ Redirect behavior for authenticated users

### Search Functionality

- ✅ Location search (city, locality, neighborhood, zipcode)
- ✅ Google Maps autocomplete predictions
- ✅ Property filtering (type, listing type, bedrooms, bathrooms)
- ✅ Sorting (price, date)
- ✅ Pagination

### Properties & Projects

- ✅ Property listing display
- ✅ Filter by multiple criteria
- ✅ Location-based search with partial matching
- ✅ Project submission form
- ✅ Image uploaders
- ✅ Dynamic lists (highlights, amenities)
- ✅ Builder selection

### Components

- ✅ Header navigation
- ✅ User authentication state display
- ✅ Footer links and social media
- ✅ Mobile menu toggle
- ✅ Role-based UI (Agent vs Buyer)

### Agent Features

- ✅ Agent properties listing
- ✅ Clickable property count
- ✅ Pagination
- ✅ Property details display

### Utilities

- ✅ Geocoding address to coordinates
- ✅ Location normalization
- ✅ Error handling

## Writing New Tests

### Example Test Structure

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithSession } from '@/__tests__/utils/test-utils'
import MyComponent from '@/components/MyComponent'

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />)
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })

  it('handles user interaction', async () => {
    render(<MyComponent />)

    const button = screen.getByRole('button')
    fireEvent.click(button)

    await waitFor(() => {
      expect(screen.getByText('Clicked')).toBeInTheDocument()
    })
  })
})
```

### Testing with Session

```typescript
import { renderWithSession, mockSession } from '@/__tests__/utils/test-utils'

it('shows user data when authenticated', () => {
  renderWithSession(<MyComponent />, { session: mockSession })
  expect(screen.getByText('Test User')).toBeInTheDocument()
})
```

### Mocking API Calls

```typescript
import { mockFetchSuccess, mockFetchError } from '@/__tests__/utils/test-utils'

it('handles successful API call', async () => {
  mockFetchSuccess({ data: 'success' })

  // ... test code
})

it('handles API error', async () => {
  mockFetchError('Something went wrong', 500)

  // ... test code
})
```

## Coverage Goals

Current coverage thresholds (defined in jest.config.js):

- Branches: 50%
- Functions: 50%
- Lines: 50%
- Statements: 50%

## Continuous Integration

Tests are configured to run in CI mode with:

- Coverage reporting
- Limited workers (maxWorkers=2)
- No watch mode

Add to your CI pipeline:

```yaml
- name: Run tests
  run: npm run test:ci
```

## Best Practices

1. **Test User Behavior**: Test what users see and do, not implementation details
2. **Use Semantic Queries**: Prefer `getByRole`, `getByLabelText` over `getByTestId`
3. **Wait for Async**: Always use `waitFor` for asynchronous operations
4. **Mock External Dependencies**: Mock API calls, routers, and third-party services
5. **Clean Up**: Clear mocks in `beforeEach` to avoid test pollution
6. **Descriptive Names**: Use clear test descriptions that explain what's being tested
7. **Arrange-Act-Assert**: Structure tests with setup, action, and verification

## Troubleshooting

### Tests Fail with "Cannot find module"

Make sure all dependencies are installed:

```bash
npm install
```

### Mock Not Working

Check `jest.setup.js` for global mocks and ensure they're configured correctly.

### Timeout Errors

Increase timeout for slow tests:

```typescript
jest.setTimeout(10000) // 10 seconds
```

### Coverage Not Generated

Run with coverage flag:

```bash
npm run test:coverage
```

## Next Steps

To expand test coverage:

1. Add forum feature tests
2. Add project detail page tests
3. Add builder components tests
4. Add integration tests for complex flows
5. Add E2E tests with Playwright or Cypress
