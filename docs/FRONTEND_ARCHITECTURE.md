# Frontend Architecture

This document provides a comprehensive overview of the frontend architecture for the PornSpot.ai application. The frontend is built with Next.js and follows modern React development practices.

## Project Structure

The `frontend/src` directory is organized as follows:

- **`app`**: Contains the application's pages and layouts, following the Next.js App Router conventions.
- **`components`**: Contains reusable React components.
  - **`ui`**: Contains general-purpose UI components.
  - **`user`**: Contains components related to user-specific features.
  - **`admin`**: Contains components for the admin dashboard.
- **`contexts`**: Contains React Context providers for state management.
- **`hooks`**: Contains custom React hooks for data fetching and other logic.
- **`lib`**: Contains library code, such as API clients and utility functions.
- **`types`**: Contains TypeScript type definitions.

```
frontend/src/
├── app/
│   ├── (main)/
│   │   ├── page.tsx
│   │   └── layout.tsx
│   ├── admin/
│   └── user/
├── components/
│   ├── ui/
│   ├── user/
│   └── admin/
├── contexts/
│   ├── AdminContext.tsx
│   └── UserContext.tsx
├── hooks/
│   ├── useAlbums.ts
│   └── useUser.ts
├── lib/
│   └── api.ts
└── types/
    └── index.ts
```

## State Management

The application uses React Context for state management, which provides a way to share state between components without having to pass props down manually at every level.

### `UserProvider`

- **File**: [`frontend/src/contexts/UserContext.tsx`](../frontend/src/contexts/UserContext.tsx)
- **Purpose**: Manages the authentication state for regular users.
- **State**:
  - `user`: The currently logged-in user, or `null` if the user is not authenticated.
  - `loading`: A boolean that indicates whether an authentication-related operation is in progress.
  - `error`: A string that contains any authentication-related error messages.
- **Functions**:
  - `login`: Authenticates a user with an email and password.
  - `register`: Registers a new user.
  - `logout`: Logs out the current user.
  - `checkAuth`: Checks if the user is authenticated by calling the `/api/me` endpoint.

### `AdminProvider`

- **File**: `frontend/src/contexts/AdminContext.tsx`
- **Purpose**: Manages the authentication state for admin users. The structure is similar to the `UserProvider`.

### Usage

The `UserProvider` and `AdminProvider` are wrapped around the application in the root layout ([`frontend/src/app/layout.tsx`](../frontend/src/app/layout.tsx)), making the authentication state available to all components.

```tsx
// frontend/src/app/layout.tsx
import { AdminProvider } from "@/contexts/AdminContext";
import { UserProvider } from "@/contexts/UserContext";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body>
        <UserProvider>
          <AdminProvider>
            {/* ... */}
            {children}
            {/* ... */}
          </AdminProvider>
        </UserProvider>
      </body>
    </html>
  );
}
```

## Data Fetching with Custom Hooks

The application uses custom React hooks to fetch data from the API. This approach encapsulates the data fetching logic and makes it reusable across multiple components.

### `useAlbums` Hook

- **File**: [`frontend/src/hooks/useAlbums.ts`](../frontend/src/hooks/useAlbums.ts)
- **Purpose**: Fetches a list of albums from the API.
- **State**:
  - `albums`: An array of album objects.
  - `loading`: A boolean that indicates whether the albums are being fetched.
  - `error`: A string that contains any error messages.
  - `pagination`: An object that contains pagination information.
- **Functions**:
  - `refetch`: Re-fetches the albums.
  - `loadMore`: Fetches the next page of albums.

### `useUser` Hook

- **File**: `frontend/src/hooks/useUser.ts`
- **Purpose**: A simple hook that provides access to the user state from the `UserContext`.

### `useAuthRedirect` Hook

- **File**: [`frontend/src/hooks/useAuthRedirect.ts`](../frontend/src/hooks/useAuthRedirect.ts)
- **Purpose**: Provides functionality to redirect unauthenticated users to the login page while preserving their current location.
- **Functions**:
  - `redirectToLogin(currentPath?)`: Redirects to `/auth/login` with a `returnTo` parameter containing the current URL or the provided path.
- **Usage**: Used in components like `ContentCard`, `LikeButton`, and `BookmarkButton` to automatically redirect users who attempt to interact with authenticated features while not logged in.

## Styling

The application uses **Tailwind CSS** for styling. Utility classes are used to style components directly in the JSX, which allows for rapid development and a consistent design system.

## Component Library

The application has a collection of reusable UI components in the `frontend/src/components/ui` directory. These components are used throughout the application to ensure a consistent look and feel.

## Profile Pages

The application includes profile pages that display user-specific content accessible via `/profile/[username]/` routes:

### Profile Albums Page

- **File**: `/app/[locale]/profile/[username]/albums/page.tsx`
- **Purpose**: Displays a user's public albums in a paginated view
- **Features**:
  - Grid and list view modes
  - Loading states and error handling
  - Mock data implementation with 6 sample albums
  - Responsive design following app patterns
  - Integration with existing ProfileComponent navigation

### Profile Media Page

- **File**: `/app/[locale]/profile/[username]/media/page.tsx`
- **Purpose**: Displays a user's uploaded and generated media content
- **Features**:
  - Grid and list view toggle
  - Lightbox support for media viewing
  - Interactive media cards with like/bookmark actions
  - Loading states and error handling
  - Mock data implementation with 8 sample media items
  - Responsive design with 1-4 column layout based on screen size
  - Navigation back to main profile page

### Profile Albums Page

- **File**: `/app/[locale]/profile/[username]/albums/page.tsx`
- **Purpose**: Displays albums created by a specific user (public albums only unless viewing own profile)
- **Features**:
  - Grid and list view toggle
  - Real-time album fetching using `useAlbums` hook with user parameter
  - Pagination with "Load More" functionality
  - Loading states and error handling
  - Responsive design with 1-3 column layout based on screen size
  - Navigation back to main profile page
  - Album folder icon theming for albums context
  - Uses `/albums?user=username&limit=12` API endpoint

### Profile Likes Page

- **File**: `/app/[locale]/profile/[username]/likes/page.tsx`
- **Purpose**: Displays content that a user has liked (both media and albums)
- **Features**:
  - Grid and list view toggle
  - Mixed content display (media and albums)
  - Lightbox support for media items
  - Interactive content cards with like/bookmark actions
  - Loading states and error handling
  - Mock data implementation with 8 sample likes (mix of media and albums)
  - Responsive design with 1-3 column layout based on screen size
  - Navigation back to main profile page
  - Heart icon theming for likes context

### Profile Comments Page

- **File**: `/app/[locale]/profile/[username]/comments/page.tsx`
- **Purpose**: Displays user comments and activity

All profile pages follow established patterns for:

- Locale-aware routing with `[locale]` parameter
- Dynamic username routing with `[username]` parameter
- Consistent styling using Tailwind CSS utility classes
- ContentCard components for displaying album/media items
- Button and Card UI components from the shared component library
- Loading skeletons and error states
- Back navigation to parent profile page

## Comment System

### Comments Component Architecture

The comment system is implemented with two main components that work together to provide an optimized user experience:

#### CommentItem Component

- **File**: `/components/ui/Comment.tsx`
- **Purpose**: Individual comment display and interaction
- **Features**:
  - User avatar with fallback to initials
  - Username linking to user profiles
  - Inline editing with textarea and character count
  - Owner-only edit/delete actions with hover states
  - Time formatting (e.g., "2h ago", "3d ago")
  - Like functionality (placeholder for future implementation)
  - Edited indicator for modified comments

#### Comments Component (Optimized)

- **File**: `/components/ui/CommentsOptimized.tsx`
- **Purpose**: Comment section with optimized loading strategy
- **Key Features**:
  - **Initial Comments**: Uses pre-loaded comments from Media/Album objects
  - **Lazy Loading**: Only fetches additional comments when needed
  - **Duplicate Prevention**: Filters out already loaded comments
  - **Real-time Updates**: New comments appear immediately
  - **Keyboard Shortcuts**: Cmd+Enter to submit on desktop
  - **Permission Checks**: Only authenticated users can comment
  - **Error Handling**: Graceful error states with retry options

#### Implementation Strategy

**Optimized Loading Pattern**:

```typescript
interface CommentsProps {
  targetType: "album" | "media";
  targetId: string;
  initialComments?: Comment[]; // Pre-loaded from parent object
  currentUserId?: string;
}
```

**Benefits**:

- **Performance**: Reduces initial API calls by leveraging existing data
- **UX**: Comments appear immediately without loading states
- **Scalability**: Only fetches additional comments when user requests them
- **Consistency**: Works seamlessly with both Media and Album objects

**Integration Example**:

```typescript
// MediaDetailClient.tsx
<Comments
  targetType="media"
  targetId={media.id}
  initialComments={media.comments}
  currentUserId={user?.userId}
/>
```

## AI Image Generation

### GenerateClient Component

- **File**: `/components/GenerateClient.tsx`
- **Purpose**: Main interface for AI image generation with advanced controls

#### Key Features

- **Prompt Input**: Large textarea for detailed generation prompts
- **Advanced Controls**: Professional-grade parameters for fine-tuning
- **LoRA Models**: Specialized model enhancement system
- **Permission-Based UI**: Features gated by user subscription level

#### LoRA System Architecture

The LoRA (Low-Rank Adaptation) system includes a global selection mode with sophisticated strength management:

```typescript
interface GenerationSettings {
  // ... other settings
  selectedLoras: string[];
  loraStrengths: Record<string, { mode: "auto" | "manual"; value: number }>;
  loraSelectionMode: "auto" | "manual"; // Global toggle
}
```

**Global Selection Modes**:

- **Automatic Mode**: AI automatically selects and configures LoRA models based on prompt
- **Manual Mode**: User manually selects and configures individual LoRA models (Pro only)

**Individual LoRA Strength Options** (Manual Mode Only):

- **Auto Mode**: Automatic strength based on model recommendations
- **Manual Mode**: Slider control (0.0 to 1.5 range, default: 1.0, step: 0.05)

**Permission Handling & Teaser Strategy**:

- **Global Toggle**: Available to all users, manual mode requires Pro subscription
- **LoRA Preview**: Non-Pro users see all available LoRA models as teaser content
- **Visual Indicators**: Lock icons, Pro badges, and opacity effects indicate restrictions
- **Upgrade Prompts**: Clear call-to-action buttons encourage plan conversion
- **Functional Degradation**: Automatic mode remains fully functional for all tiers

**UI Patterns**:

- Global toggle with descriptive text explaining current mode
- Conditional rendering: manual interface vs. teaser content
- Expandable cards showing LoRA details and strength controls (Pro users)
- Disabled preview cards with upgrade prompts (Free/Starter users)
- Real-time value display with 2-decimal precision
- Responsive slider component with proper accessibility

#### Permission System Integration

The component leverages the centralized permission system:

```typescript
const {
  canGenerateImages,
  canUseBulkGeneration,
  canUseLoRAModels,
  canUseNegativePrompt,
} = useUserPermissions();
```

Features are gracefully degraded when permissions are insufficient, maintaining UI consistency while clearly indicating upgrade requirements.

**LoRA Model Access Strategy**:

- **All Users**: Can see available LoRA models in automatic mode as a teaser
- **Free/Starter Users**: Limited to automatic LoRA selection with visual upgrade prompts
- **Pro Users**: Full manual control over LoRA model selection and strength configuration
- **Global Toggle**: Available to all users, with manual mode restricted to Pro subscribers

**Teaser Implementation**:

- Non-Pro users see all available LoRA models in a disabled state
- Clear visual indicators (lock icons, Pro badges) show upgrade requirements
- Upgrade call-to-action buttons encourage plan conversion
- Automatic mode remains fully functional for all user tiers

## Routing

The application uses the Next.js App Router for routing. Routes are defined by the directory structure in the `frontend/src/app` directory. Key routing patterns include:

- Dynamic routes: `/albums/[albumId]/page.tsx` creates `/albums/:albumId`
- Locale routing: `/[locale]/profile/[username]/albums/page.tsx` creates `/fr/profile/:username/albums`
- Nested layouts: Layout files apply to all child routes in their directory

### Locale-Aware Navigation

All internal navigation uses:

- `LocaleLink` component for links (preserves current locale)
- `useLocaleRouter` hook for programmatic navigation
- Automatic locale prefixing for internationalization support
