# PornSpot.ai Copilot Instructions

## Architecture Overview

This is a serverless adult content gallery platform with Next.js frontend and AWS Lambda backend using a single-table DynamoDB design.

**Core Stack:**

- Frontend: Next.js 14 with TypeScript, Tailwind CSS, next-intl (i18n)
- Backend: AWS Lambda functions (Node.js 20.x) with TypeScript
- Database: DynamoDB single-table design with 4 GSIs
- Storage: S3 + CloudFront CDN with 5-tier thumbnail system
- Infrastructure: AWS SAM for deployment

## Essential Development Patterns

### Monorepo Structure & Scripts

```bash
# Always install all dependencies in correct order:
npm run install:all  # Never use npm install in workspaces directly

# Local development requires specific sequence:
./scripts/start-local-backend.sh  # Starts LocalStack + SAM + API
npm run dev:frontend              # In separate terminal

# Backend changes require full restart (no hot reload)
# Frontend has HMR enabled
```

### Permission System (Critical)

All features are gated by a centralized permission system in `/frontend/src/contexts/PermissionsContext.tsx`:

```tsx
const { canCreatePrivateContent, canGenerateImages } = usePermissions();

// Always check before rendering features:
{
  canCreatePrivateContent() && <PrivateContentToggle />;
}
```

- Plans: `free`, `starter`, `unlimited`, `pro` (defined in `/backend/shared/permissions.json`)
- Roles: `user`, `admin`, `moderator`
- Pro-only features marked with Crown icon component

### Database Patterns (Single-Table DynamoDB)

**Table:** `${env}-pornspot-media`

```typescript
// Standard entity patterns:
Album:  PK: "ALBUM#{albumId}"     SK: "METADATA"
Media:  PK: "ALBUM#{albumId}"     SK: "MEDIA#{mediaId}"
User:   PK: "USER#{userId}"       SK: "PROFILE"

// Always use GSIs for queries:
GSI1: List albums by creation date
GSI2: User-specific queries
GSI3: Public content filtering
GSI4: Album-specific media queries
```

### Component Architecture

- UI components in `/frontend/src/components/ui/` (reusable)
- Feature components in specific directories (`/admin/`, `/user/`, `/albums/`)
- All forms use react-hook-form with zod validation
- Responsive images use `ResponsivePicture` component with 5-tier thumbnails

### Backend Lambda Patterns

```typescript
// Standard Lambda structure in /backend/functions/:
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    // Always include CORS headers
    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Content-Type": "application/json",
    };

    // Use shared utilities from /backend/shared/
    // Return consistent response format
  } catch (error) {
    return errorResponse(error.message, 500);
  }
};
```

### Internationalization (i18n)

- All text uses `next-intl`: `const t = useTranslations('common');`
- Translation keys in `/frontend/messages/` (en.json, etc.)
- Namespace patterns: `common`, `user.userAlbumForm`, `admin.userManagement`

### Testing Patterns

```bash
# Comprehensive test suite with 99%+ coverage:
npm run test:all                    # All tests
npm run test:coverage:combined      # Combined coverage report

# Backend: Jest with LocalStack integration
# Frontend: Jest + React Testing Library + Playwright E2E
```

## Key Workflows

### Local Development Setup

```bash
# 1. Dependencies (required order)
npm run install:all

# 2. Environment files (copy examples)
cp frontend/.env.example frontend/.env.local
cp backend/.env.example.json backend/.env.local.json
cp scripts/.env.example scripts/.env.local

# 3. Start services
./scripts/start-local-backend.sh    # Starts LocalStack + API on :3001
npm run dev:frontend               # Frontend on :3000
```

### Deployment Process

```bash
# Backend deployment
./scripts/deploy.sh --env prod --guided

# Frontend deployment (Vercel)
cd frontend && npm run build && vercel --prod
```

### Debugging Backend

- API: `http://localhost:3001/{endpoint}`
- Database: Use AWS CLI with `--endpoint-url http://localhost:4566` for local
- S3: LocalStack S3 on port 4566

## Critical File Locations

- **Permissions:** `/backend/shared/permissions.json` (plan/role definitions)
- **Types:** `/frontend/src/types/` and `/backend/shared/types/`
- **Utils:** `/frontend/src/lib/urlUtils.ts` (media URL composition)
- **Auth:** `/backend/shared/auth/` (user authentication helpers)
- **SAM Template:** `/template.yaml` (infrastructure as code)

## Common Gotchas

1. **Backend changes require full restart** - no hot module replacement
2. **Always use `npm run install:all`** instead of workspace npm install
3. **DynamoDB queries must use GSIs** for non-key lookups
4. **Thumbnail URLs need composition** via `urlUtils.composeThumbnailUrls()`
5. **Permission checks required** before rendering Pro features
6. **CORS headers mandatory** in all Lambda responses
7. **LocalStack endpoint** must be configured for local S3/DynamoDB access

This codebase prioritizes serverless architecture, comprehensive testing, and a permission-based feature system. Always check existing patterns in similar components before implementing new features.
