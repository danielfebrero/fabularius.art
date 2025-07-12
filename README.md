# Fabularius.art

A minimalist gallery application for showcasing art and photography collections. Built with modern serverless architecture using AWS services and Next.js.

## Architecture

- **Frontend**: Next.js 14 with TypeScript and Tailwind CSS
- **Backend**: AWS Lambda functions with TypeScript
- **Database**: DynamoDB with single-table design
- **Storage**: S3 with CloudFront CDN
- **Infrastructure**: AWS SAM (Serverless Application Model)

## Features

- 🎨 **Album Management**: Create and organize artwork into beautiful albums
- 📸 **Media Upload**: High-quality image uploads with automatic optimization
- 🌐 **CDN Delivery**: Fast global content delivery via CloudFront
- 🔒 **Privacy Controls**: Public and private album settings
- 👤 **Admin Panel**: Secure admin interface for content management
- 🔐 **User Authentication**: Secure admin login with bcrypt password hashing
- 📱 **Responsive Design**: Beautiful dark theme that works on all devices
- ⚡ **Serverless**: Scalable and cost-effective serverless architecture

## Project Structure

```
fabularius-art/
├── frontend/                 # Next.js frontend application
│   ├── src/
│   │   ├── app/             # Next.js 14 app directory
│   │   ├── components/      # React components
│   │   ├── lib/            # Utility libraries
│   │   ├── types/          # TypeScript type definitions
│   │   ├── hooks/          # Custom React hooks
│   │   └── utils/          # Utility functions
│   ├── __tests__/          # Frontend test suite
│   │   ├── components/     # Component tests
│   │   ├── e2e/           # End-to-end tests
│   │   ├── integration/   # Integration tests
│   │   ├── mocks/         # MSW mocks
│   │   └── fixtures/      # Test data
│   ├── public/             # Static assets
│   └── package.json
├── backend/                  # Lambda functions and API
│   ├── functions/
│   │   ├── albums/         # Album management functions
│   │   └── media/          # Media management functions
│   ├── shared/
│   │   ├── utils/          # Shared utilities
│   │   ├── types/          # Shared type definitions
│   │   └── middleware/     # Lambda middleware
│   ├── __tests__/          # Backend test suite
│   │   ├── unit/          # Unit tests
│   │   ├── integration/   # Integration tests
│   │   ├── fixtures/      # Test data
│   │   └── helpers/       # Test utilities
│   └── package.json
├── .github/
│   └── workflows/          # CI/CD pipelines
├── .husky/                 # Git hooks
├── scripts/                # Testing and deployment scripts
├── docs/                   # Documentation
├── coverage/               # Combined coverage reports
├── docker-compose.test.yml # Docker test environment
├── jest.config.root.js     # Root Jest configuration
├── TESTING.md             # Comprehensive testing guide
├── template.yaml          # SAM template
└── samconfig.toml        # SAM configuration
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- AWS CLI configured with appropriate permissions
- AWS SAM CLI installed

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd fabularius-art
   ```

2. **Install backend dependencies**

   ```bash
   cd backend
   npm install
   cd ..
   ```

3. **Install frontend dependencies**
   ```bash
   cd frontend
   npm install
   cd ..
   ```

### Development

1. **Start the backend locally**

   ```bash
   sam build
   sam local start-api
   ```

2. **Start the frontend development server**

   ```bash
   cd frontend
   npm run dev
   ```

3. **Access the application**
   - Frontend: http://localhost:3000
   - API: http://localhost:3001

### Deployment

The project supports multiple environments (dev, staging, prod) with automated deployment scripts.

#### Quick Deployment

1. **Deploy backend to development**

   ```bash
   ./scripts/deploy.sh --env dev
   ```

2. **Deploy backend to production**

   ```bash
   ./scripts/deploy.sh --env prod --guided
   ```

3. **Prepare frontend for deployment**
   ```bash
   ./scripts/deploy-frontend.sh --env prod --type production
   vercel --prod
   ```

#### Environment Support

- **Development**: `./scripts/deploy.sh --env dev`
- **Staging**: `./scripts/deploy.sh --env staging`
- **Production**: `./scripts/deploy.sh --env prod --guided`

#### Manual Deployment

1. **Backend (SAM)**

   ```bash
   sam build
   sam deploy --config-env prod  # or dev, staging
   ```

2. **Frontend (Vercel)**
   ```bash
   cd frontend
   npm run build
   vercel --prod
   ```

For detailed deployment instructions, see [`DEPLOYMENT.md`](DEPLOYMENT.md).

## Testing

This project includes a comprehensive testing infrastructure with 99%+ code coverage across backend and frontend components.

### Quick Start

```bash
# Setup testing environment (first time only)
./scripts/setup-testing.sh

# Run all tests
npm run test:all

# Run tests with coverage
npm run test:coverage:combined

# Validate testing setup
./scripts/validate-testing.sh
```

### Test Types

- **Unit Tests**: Fast, isolated component testing
- **Integration Tests**: API and database integration testing
- **End-to-End Tests**: Full user workflow testing with Playwright
- **Performance Tests**: Lighthouse CI performance monitoring
- **Security Tests**: Dependency and vulnerability scanning

### Test Commands

```bash
# Backend tests
npm run test:backend              # All backend tests
npm run test:backend:unit         # Unit tests only
npm run test:backend:integration  # Integration tests only
npm run test:backend:coverage     # With coverage

# Frontend tests
npm run test:frontend             # All frontend tests
npm run test:frontend:unit        # Unit tests only
npm run test:frontend:e2e         # E2E tests only
npm run test:frontend:coverage    # With coverage

# Combined testing
npm run test:all                  # All tests across projects
npm run test:ci                   # CI-optimized test run
npm run test:coverage:combined    # Combined coverage report
npm run test:summary              # Generate test summary
```

### Test Environment Setup

```bash
# Local development
./scripts/test-setup.sh local

# CI environment
./scripts/test-setup.sh ci

# Docker environment
./scripts/test-setup.sh docker

# Cleanup after testing
./scripts/test-cleanup.sh
```

### Coverage Reports

- **Backend**: 99%+ coverage with Jest
- **Frontend**: 95%+ coverage with Jest + React Testing Library
- **E2E**: Critical user paths with Playwright
- **Combined**: Aggregated coverage across all projects

View coverage reports:

```bash
# Generate and open coverage report
npm run test:coverage:combined
open coverage/lcov-report/index.html
```

### CI/CD Pipeline

Tests run automatically on:

- Push to `main` or `develop` branches
- Pull requests
- Manual workflow dispatch

Quality gates:

- ✅ 85%+ code coverage
- ✅ 95%+ test pass rate
- ✅ Security vulnerability scanning
- ✅ Performance benchmarks

### Documentation

- [`TESTING.md`](./TESTING.md) - Comprehensive testing guide
- [`TESTING_QUICKSTART.md`](./TESTING_QUICKSTART.md) - Quick reference
- Backend tests: [`backend/__tests__/README.md`](./backend/__tests__/README.md)
- Frontend tests: [`frontend/__tests__/README.md`](./frontend/__tests__/README.md)

## Environment Variables

### Backend (Lambda)

- `DYNAMODB_TABLE`: DynamoDB table name
- `S3_BUCKET`: S3 bucket for media storage
- `CLOUDFRONT_DOMAIN`: CloudFront distribution domain

### Frontend

- `NEXT_PUBLIC_API_URL`: Backend API URL
- `NEXT_PUBLIC_CDN_URL`: CloudFront CDN URL
- `NEXT_PUBLIC_SITE_URL`: Frontend site URL

## API Endpoints

### Albums

- `GET /albums` - List all albums
- `POST /albums` - Create a new album
- `GET /albums/{albumId}` - Get album details
- `PUT /albums/{albumId}` - Update album
- `DELETE /albums/{albumId}` - Delete album

### Media

- `GET /albums/{albumId}/media` - List media in album
- `POST /albums/{albumId}/media` - Upload media to album
- `DELETE /albums/{albumId}/media/{mediaId}` - Delete media

### Admin Authentication

- `POST /admin/login` - Admin login
- `POST /admin/logout` - Admin logout
- `GET /admin/me` - Get current admin user info

### Admin Management

- `GET /admin/albums` - List all albums (admin)
- `PUT /admin/albums/{albumId}` - Update album (admin)
- `DELETE /admin/albums/{albumId}` - Delete album (admin)
- `DELETE /admin/albums/{albumId}/media/{mediaId}` - Delete media (admin)
- `GET /admin/stats` - Get admin statistics

## Database Schema

### Single Table Design (DynamoDB)

**Albums**

- PK: `ALBUM#{albumId}`
- SK: `METADATA`
- GSI1PK: `ALBUM`
- GSI1SK: `{createdAt}#{albumId}`

**Media**

- PK: `ALBUM#{albumId}`
- SK: `MEDIA#{mediaId}`
- GSI1PK: `MEDIA#{albumId}`
- GSI1SK: `{createdAt}#{mediaId}`

**Admin Users**

- PK: `ADMIN#{adminId}`
- SK: `METADATA`
- GSI1PK: `ADMIN_USERNAME`
- GSI1SK: `{username}`

## User Management

### Creating Admin Users

For production environments, use the dedicated script to create admin users:

```bash
# Install backend dependencies first
cd backend && npm install && cd ..

# Create admin user in production
node scripts/create-admin-prod.js prod <username> <password>

# Example
node scripts/create-admin-prod.js prod admin MySecurePassword123!
```

### Password Requirements

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

### Environment-Specific Commands

```bash
# Development
node scripts/create-admin-prod.js dev admin DevPassword123!

# Staging
node scripts/create-admin-prod.js staging admin StagingPassword123!

# Local (using existing script)
node scripts/create-admin.js admin LocalPassword123!
```

For detailed user management instructions, see [`docs/USER_MANAGEMENT.md`](docs/USER_MANAGEMENT.md).

## Documentation

- [`TESTING.md`](./TESTING.md) - Comprehensive testing guide
- [`docs/USER_MANAGEMENT.md`](./docs/USER_MANAGEMENT.md) - User management and admin setup
- [`docs/ADMIN_AUTH.md`](./docs/ADMIN_AUTH.md) - Admin authentication system
- [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) - System architecture overview

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, please open an issue in the GitHub repository or contact the maintainers.
