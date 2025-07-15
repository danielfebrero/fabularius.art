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

## Styling

The application uses **Tailwind CSS** for styling. Utility classes are used to style components directly in the JSX, which allows for rapid development and a consistent design system.

## Component Library

The application has a collection of reusable UI components in the `frontend/src/components/ui` directory. These components are used throughout the application to ensure a consistent look and feel.

## Routing

The application uses the Next.js App Router for routing. Routes are defined by the directory structure in the `frontend/src/app` directory. For example, a file at `frontend/src/app/albums/[albumId]/page.tsx` will create a route at `/albums/:albumId`.
