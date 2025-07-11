# Backend Testing Suite

This directory contains comprehensive tests for the fabularius.art backend API, covering unit tests, integration tests, and end-to-end workflows.

## Test Structure

```
__tests__/
├── fixtures/           # Test data and mock entities
│   ├── albums.ts      # Album test fixtures
│   └── media.ts       # Media test fixtures
├── helpers/           # Test utilities and helpers
│   ├── api-gateway.ts # API Gateway event builders
│   └── aws-mocks.ts   # AWS service mocking utilities
├── integration/       # Integration tests
│   ├── albums.integration.test.ts
│   └── media.integration.test.ts
├── unit/             # Unit tests
│   ├── functions/    # Lambda function tests
│   │   ├── albums/
│   │   │   ├── create.test.ts
│   │   │   ├── get.test.ts
│   │   │   └── getById.test.ts
│   │   └── media/
│   │       ├── get.test.ts
│   │       └── upload.test.ts
│   └── shared/       # Shared utility tests
│       └── utils/
│           ├── dynamodb.test.ts
│           ├── response.test.ts
│           └── s3.test.ts
└── setup.ts          # Global test configuration
```

## Running Tests

### All Tests

```bash
npm test
```

### With Coverage Report

```bash
npm run test:coverage
```

### Specific Test Files

```bash
npm test -- __tests__/unit/functions/albums/get.test.ts
npm test -- __tests__/integration/albums.integration.test.ts
```

### Watch Mode

```bash
npm test -- --watch
```

## Test Coverage

Current coverage metrics:

- **Statements**: 99.47%
- **Branches**: 95.45%
- **Functions**: 100%
- **Lines**: 99.46%

Coverage thresholds are enforced in [`jest.config.js`](../jest.config.js):

- Global: 90% for all metrics
- Per-file: 80% for all metrics

## Test Categories

### Unit Tests

#### Lambda Functions

- **Albums**: Create, get list, get by ID
- **Media**: Upload presigned URLs, get media list
- Tests cover success cases, error handling, validation, and edge cases

#### Shared Utilities

- **Response Utils**: HTTP response formatting, CORS headers
- **DynamoDB Service**: CRUD operations, pagination, error handling
- **S3 Service**: Presigned URLs, object operations, utility functions

### Integration Tests

#### Albums Workflow

- Complete album lifecycle: create → retrieve → list
- Cross-service data consistency
- Error propagation and handling

#### Media Workflow

- Media upload and retrieval flow
- Album-media relationships
- Service integration validation

## Mocking Strategy

### AWS SDK v3 Mocking

The test suite uses a simplified mocking approach for AWS SDK v3 commands:

```typescript
// Verify command types are called correctly
expect(mockSend).toHaveBeenCalledWith(expect.any(PutCommand));
expect(mockGetSignedUrl).toHaveBeenCalledWith(
  expect.any(Object), // S3Client
  expect.any(PutObjectCommand), // Command
  { expiresIn: 3600 }
);
```

This approach provides functional coverage while avoiding complex parameter inspection issues with Jest mocking.

### Service Mocking

- **DynamoDB**: Mocked client with command verification
- **S3**: Mocked client and presigned URL generation
- **UUID**: Consistent mock values for predictable test data

## Test Fixtures

### Albums

- `mockAlbumEntity`: Complete album with all fields
- `mockAlbumEntityMinimal`: Album with required fields only
- `mockAlbumId`: Consistent test album ID

### Media

- `mockMediaEntity`: Complete media entity
- `mockMediaEntityMinimal`: Media with required fields only
- `mockS3Key`: Test S3 object key

## Error Testing

Comprehensive error scenario coverage:

- **AWS Service Errors**: DynamoDB/S3 operation failures
- **Validation Errors**: Invalid input data
- **Not Found Errors**: Missing resources
- **Permission Errors**: Access denied scenarios

## Best Practices

### Test Organization

- Group related tests in `describe` blocks
- Use descriptive test names that explain the scenario
- Follow AAA pattern: Arrange, Act, Assert

### Mocking

- Reset mocks in `beforeEach` hooks
- Use specific mock implementations for different scenarios
- Verify both success and failure paths

### Assertions

- Test both positive and negative cases
- Verify response structure and data types
- Check error messages and status codes
- Validate side effects (database calls, logging)

### Data Management

- Use test fixtures for consistent data
- Avoid hardcoded values in tests
- Clean up test data between tests

## Debugging Tests

### Common Issues

1. **Mock not reset**: Ensure `mockClear()` in `beforeEach`
2. **UUID conflicts**: Use individual test `beforeEach` for UUID mocks
3. **Type errors**: Check TypeScript strict mode compliance
4. **AWS SDK mocking**: Verify command type expectations

### Debug Commands

```bash
# Run single test with verbose output
npm test -- --verbose __tests__/unit/functions/albums/get.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="should create album"

# Debug mode
npm test -- --detectOpenHandles --forceExit
```

## Continuous Integration

Tests are designed to run reliably in CI environments:

- No external dependencies
- Deterministic test data
- Proper cleanup and isolation
- Fast execution (< 10 seconds)

## Contributing

When adding new features:

1. Write tests first (TDD approach)
2. Ensure >90% coverage for new code
3. Add both unit and integration tests
4. Update fixtures if needed
5. Document any new testing patterns

## Architecture Notes

### AWS SDK v3 Challenges

The test suite addresses specific challenges with AWS SDK v3 mocking:

- Command constructor mocking complexity
- Parameter inspection limitations with Jest
- Simplified verification focusing on command types rather than detailed parameters

This approach provides adequate functional coverage while maintaining test reliability and maintainability.
