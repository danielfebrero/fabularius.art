# Frontend Testing Infrastructure

This document provides a comprehensive overview of the testing infrastructure created for the pornspot.ai Next.js application.

## Overview

The testing suite includes:

- **Unit Tests**: Component and utility function testing
- **Integration Tests**: API integration and component interaction testing
- **End-to-End Tests**: Full user workflow testing with Playwright
- **Custom Hook Tests**: React hooks testing
- **Error Boundary Tests**: Error handling and recovery testing

## Test Structure

```
frontend/__tests__/
├── components/           # Component unit tests
│   ├── Button.test.tsx
│   ├── Card.test.tsx
│   ├── Input.test.tsx
│   └── ErrorBoundary.test.tsx
├── pages/               # Page-level tests
│   ├── layout.test.tsx
│   └── page.test.tsx
├── hooks/               # Custom hooks tests
│   └── useAlbums.test.tsx
├── integration/         # API integration tests
│   └── api.integration.test.tsx
├── e2e/                # End-to-end tests
│   ├── homepage.spec.ts
│   ├── album-detail.spec.ts
│   └── admin.spec.ts
├── fixtures/           # Test data and types
│   ├── types.ts
│   └── data.ts
├── mocks/              # MSW request handlers
│   ├── handlers.ts
│   └── server.ts
├── utils/              # Test utilities
│   └── test-utils.tsx
└── README.md           # This file
```

## Configuration Files

### Jest Configuration (`jest.config.js`)

- Next.js integration with `next/jest`
- TypeScript support
- Path mapping for imports
- Coverage thresholds (80% minimum)
- Test environment setup

### Playwright Configuration (`playwright.config.ts`)

- Multi-browser testing (Chromium, Firefox, WebKit)
- Mobile device testing
- Screenshot and video capture on failure
- Global setup and teardown

### Jest Setup (`jest.setup.js`)

- Testing Library matchers
- MSW server setup
- Next.js mocks (router, image, etc.)
- Global test utilities

## Test Categories

### 1. Component Tests

#### Button Component (`Button.test.tsx`)

- **Coverage**: Variants, sizes, loading states, accessibility
- **Key Tests**:
  - Renders with different variants (primary, secondary, outline, ghost)
  - Handles loading state with spinner
  - Supports keyboard navigation
  - Proper ARIA attributes
  - Click event handling

#### Card Component (`Card.test.tsx`)

- **Coverage**: Variants, sizes, clickable states, accessibility
- **Key Tests**:
  - Default and outlined variants
  - Small, medium, large sizes
  - Clickable cards with hover states
  - Keyboard navigation (Enter key)
  - Proper role and tabIndex attributes

#### Input Component (`Input.test.tsx`)

- **Coverage**: Variants, validation, accessibility, form integration
- **Key Tests**:
  - Text input with label and helper text
  - Error state display and styling
  - Required field validation
  - Different input types (email, password)
  - Focus and blur event handling
  - ARIA attributes for accessibility

#### ErrorBoundary Component (`ErrorBoundary.test.tsx`)

- **Coverage**: Error catching, recovery, development vs production
- **Key Tests**:
  - Catches and displays component errors
  - Custom fallback UI support
  - Retry functionality
  - Development error details
  - Error logging and reporting
  - Reset on prop changes

### 2. Page Tests

#### Layout Component (`layout.test.tsx`)

- **Coverage**: Navigation, responsive design, theme
- **Key Tests**:
  - Renders navigation elements
  - Mobile menu functionality
  - Dark theme application
  - Accessibility landmarks

#### Homepage (`page.test.tsx`)

- **Coverage**: Hero section, album grid, loading states
- **Key Tests**:
  - Hero section content
  - Album grid display
  - Loading and error states
  - Responsive layout

### 3. Custom Hook Tests

#### useAlbums Hook (`useAlbums.test.tsx`)

- **Coverage**: Data fetching, pagination, filtering, error handling
- **Key Tests**:
  - Successful data fetching
  - Loading states
  - Error handling (API and network errors)
  - Public-only filtering
  - Pagination support
  - Refresh functionality
  - Race condition handling
  - Cleanup on unmount

### 4. Integration Tests

#### API Integration (`api.integration.test.tsx`)

- **Coverage**: API client components, MSW mocking, real API flows
- **Key Tests**:
  - Albums list fetching and display
  - Error handling for API failures
  - Album creation workflow
  - Form validation and submission
  - Public vs private album filtering
  - Pagination controls

### 5. End-to-End Tests

#### Homepage E2E (`homepage.spec.ts`)

- **Coverage**: Full user workflows, navigation, responsive design
- **Key Tests**:
  - Page loading and content display
  - Album grid interaction
  - Navigation between pages
  - Mobile responsiveness
  - Loading states
  - Error handling

#### Album Detail E2E (`album-detail.spec.ts`)

- **Coverage**: Media gallery, lightbox, pagination
- **Key Tests**:
  - Album information display
  - Media gallery with thumbnails
  - Lightbox functionality
  - Image navigation (keyboard and mouse)
  - Pagination through media
  - Mobile responsive layout
  - Loading and error states

#### Admin Interface E2E (`admin.spec.ts`)

- **Coverage**: Admin dashboard, CRUD operations, file upload
- **Key Tests**:
  - Admin dashboard display
  - Album creation and editing
  - Album deletion with confirmation
  - Media upload with progress
  - Bulk media operations
  - User management interface
  - System settings
  - Mobile admin interface

## Test Utilities

### Custom Render Function (`test-utils.tsx`)

- Wraps components with necessary providers
- Includes React Query client
- Theme provider setup
- Router context
- User event utilities

### Mock Data (`fixtures/data.ts`)

- Realistic test data for albums and media
- Helper functions for data manipulation
- Type-safe mock objects

### MSW Handlers (`mocks/handlers.ts`)

- API endpoint mocking
- Realistic response simulation
- Error scenario testing
- Pagination support

## Coverage Goals

- **Statements**: 80% minimum
- **Branches**: 80% minimum
- **Functions**: 80% minimum
- **Lines**: 80% minimum

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run E2E tests in headed mode
npm run test:e2e:headed

# Run specific test file
npm test Button.test.tsx

# Run tests matching pattern
npm test -- --testNamePattern="renders correctly"
```

## Test Scripts

```json
{
  "test": "jest",
  "test:watch": "jest --watch",
  "test:coverage": "jest --coverage",
  "test:e2e": "playwright test",
  "test:e2e:headed": "playwright test --headed",
  "test:e2e:debug": "playwright test --debug",
  "test:ci": "jest --ci --coverage --watchAll=false"
}
```

## Best Practices

### 1. Test Organization

- Group related tests in describe blocks
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)

### 2. Component Testing

- Test behavior, not implementation
- Use semantic queries (getByRole, getByLabelText)
- Test accessibility features
- Mock external dependencies

### 3. Integration Testing

- Test realistic user workflows
- Use MSW for API mocking
- Test error scenarios
- Verify loading states

### 4. E2E Testing

- Test critical user paths
- Use page object patterns for complex flows
- Test on multiple browsers and devices
- Capture screenshots on failure

### 5. Accessibility Testing

- Use jest-axe for automated a11y testing
- Test keyboard navigation
- Verify ARIA attributes
- Test screen reader compatibility

## Continuous Integration

The test suite is designed to run in CI environments:

```yaml
# Example GitHub Actions workflow
- name: Run Tests
  run: |
    npm run test:ci
    npm run test:e2e

- name: Upload Coverage
  uses: codecov/codecov-action@v3
  with:
    file: ./coverage/lcov.info
```

## Dependencies

### Testing Framework

- **Jest**: Test runner and assertion library
- **@testing-library/react**: React component testing utilities
- **@testing-library/jest-dom**: Custom Jest matchers
- **@testing-library/user-event**: User interaction simulation

### E2E Testing

- **Playwright**: Cross-browser end-to-end testing
- **@playwright/test**: Playwright test runner

### Mocking

- **MSW**: API mocking for integration tests
- **jest-environment-jsdom**: DOM environment for Jest

### Accessibility

- **jest-axe**: Automated accessibility testing

## Future Enhancements

1. **Visual Regression Testing**: Add visual diff testing with Playwright
2. **Performance Testing**: Add Lighthouse CI for performance monitoring
3. **Cross-browser Testing**: Expand browser coverage in CI
4. **Mobile Testing**: Add more mobile device testing scenarios
5. **API Contract Testing**: Add Pact.js for API contract testing

## Troubleshooting

### Common Issues

1. **TypeScript Errors**: Expected until dependencies are installed
2. **MSW Handlers**: Ensure handlers match actual API endpoints
3. **Async Testing**: Use waitFor for async operations
4. **Mock Cleanup**: Clear mocks between tests

### Debug Tips

1. Use `screen.debug()` to see rendered output
2. Add `--verbose` flag for detailed test output
3. Use Playwright's `--debug` mode for E2E debugging
4. Check browser console in E2E tests for errors

This testing infrastructure provides comprehensive coverage of the pornspot.ai frontend application, ensuring reliability, accessibility, and maintainability.
