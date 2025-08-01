# Error Boundary Usage Examples

This file provides practical examples of how to use the new granular error boundary system.

## Basic Usage Examples

### 1. App-Level Protection (Root Layout)

```tsx
// app/layout.tsx
import { AppErrorBoundary } from "@/components/ErrorBoundaries";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AppErrorBoundary context="Root Application">
          {children}
        </AppErrorBoundary>
      </body>
    </html>
  );
}
```

### 2. Page-Level Protection

```tsx
// app/[locale]/layout.tsx
import {
  PageErrorBoundary,
  SectionErrorBoundary,
} from "@/components/ErrorBoundaries";

export default function LocaleLayout({ children, params: { locale } }) {
  return (
    <PageErrorBoundary context={`Locale Layout (${locale})`}>
      <div className="min-h-screen">
        <SectionErrorBoundary context="Header">
          <Header />
        </SectionErrorBoundary>

        <SectionErrorBoundary context="Main Content">
          <main>{children}</main>
        </SectionErrorBoundary>

        <SectionErrorBoundary context="Footer">
          <Footer />
        </SectionErrorBoundary>
      </div>
    </PageErrorBoundary>
  );
}
```

### 3. Component-Level Protection

```tsx
// components/AlbumGrid.tsx
import { ComponentErrorBoundary } from "./ErrorBoundaries";

export function AlbumGrid({ albums }) {
  return (
    <div className="grid">
      {albums.map((album) => (
        <ComponentErrorBoundary
          key={album.id}
          context={`Album Card (${album.id})`}
        >
          <AlbumCard album={album} />
        </ComponentErrorBoundary>
      ))}
    </div>
  );
}
```

## Advanced Usage Examples

### 4. Using Pre-built Error Boundaries

```tsx
// Using specialized error boundaries
import {
  AlbumGridErrorBoundary,
  MediaGalleryErrorBoundary,
  CommentsErrorBoundary,
} from "./ErrorBoundaries";

export function AlbumPage({ album, media }) {
  return (
    <div>
      <h1>{album.title}</h1>

      <MediaGalleryErrorBoundary>
        <MediaGallery media={media} />
      </MediaGalleryErrorBoundary>

      <CommentsErrorBoundary>
        <Comments albumId={album.id} />
      </CommentsErrorBoundary>
    </div>
  );
}
```

### 5. Custom Error Fallbacks

```tsx
import { SectionErrorBoundary } from "./ErrorBoundaries";

const CustomErrorFallback = () => (
  <div className="error-custom">
    <h3>Oops! Something went wrong with this section</h3>
    <p>This particular feature is temporarily unavailable.</p>
    <button onClick={() => window.location.reload()}>Refresh Page</button>
  </div>
);

export function MyComponent() {
  return (
    <SectionErrorBoundary
      context="Custom Section"
      fallback={<CustomErrorFallback />}
    >
      <ComplexComponent />
    </SectionErrorBoundary>
  );
}
```

### 6. Error Boundaries with Reset Keys

```tsx
import { SectionErrorBoundary } from "./ErrorBoundaries";

export function DataComponent({ userId, refreshKey }) {
  return (
    <SectionErrorBoundary
      context="User Data"
      resetKeys={[userId, refreshKey]} // Resets when these change
    >
      <UserData userId={userId} />
    </SectionErrorBoundary>
  );
}
```

### 7. Error Reporting Integration

```tsx
import { PageErrorBoundary } from "./ErrorBoundaries";

const handleError = (error, errorInfo) => {
  // Custom error reporting
  console.error("Page Error:", error);

  // Send to monitoring service
  if (process.env.NODE_ENV === "production") {
    errorReportingService.captureException(error, {
      context: "Page Level",
      extra: errorInfo,
    });
  }
};

export function MyPage() {
  return (
    <PageErrorBoundary context="My Page" onError={handleError}>
      <PageContent />
    </PageErrorBoundary>
  );
}
```

## Real-World Implementation Examples

### 8. E-commerce Product Grid

```tsx
import {
  SectionErrorBoundary,
  ComponentErrorBoundary,
} from "./ErrorBoundaries";

export function ProductGrid({ products }) {
  return (
    <SectionErrorBoundary context="Product Grid">
      <div className="grid grid-cols-4 gap-4">
        {products.map((product) => (
          <ComponentErrorBoundary
            key={product.id}
            context={`Product (${product.name})`}
          >
            <ProductCard product={product} />
          </ComponentErrorBoundary>
        ))}
      </div>
    </SectionErrorBoundary>
  );
}
```

### 9. Social Media Feed

```tsx
import {
  SectionErrorBoundary,
  ComponentErrorBoundary,
} from "./ErrorBoundaries";

export function SocialFeed({ posts }) {
  return (
    <SectionErrorBoundary context="Social Feed">
      <div className="feed">
        {posts.map((post) => (
          <ComponentErrorBoundary key={post.id} context={`Post (${post.id})`}>
            <div className="post">
              <PostHeader user={post.user} />
              <PostContent content={post.content} />
              <ComponentErrorBoundary context="Post Actions">
                <PostActions postId={post.id} />
              </ComponentErrorBoundary>
            </div>
          </ComponentErrorBoundary>
        ))}
      </div>
    </SectionErrorBoundary>
  );
}
```

### 10. Admin Dashboard

```tsx
import { AdminErrorBoundary, SectionErrorBoundary } from "./ErrorBoundaries";

export function AdminDashboard() {
  return (
    <AdminErrorBoundary>
      <div className="admin-layout">
        <SectionErrorBoundary context="Admin Sidebar">
          <AdminSidebar />
        </SectionErrorBoundary>

        <main className="admin-main">
          <SectionErrorBoundary context="Admin Header">
            <AdminHeader />
          </SectionErrorBoundary>

          <SectionErrorBoundary context="Admin Content">
            <AdminContent />
          </SectionErrorBoundary>
        </main>
      </div>
    </AdminErrorBoundary>
  );
}
```

## Testing Error Boundaries

### 11. Development Error Testing

```tsx
// For development testing only
const ErrorTester = ({ shouldThrow = false }) => {
  if (shouldThrow) {
    throw new Error("Test error for boundary testing");
  }
  return <div>Component working normally</div>;
};

// Usage during development
export function TestPage() {
  const [shouldThrow, setShouldThrow] = useState(false);

  return (
    <div>
      <button onClick={() => setShouldThrow(!shouldThrow)}>Toggle Error</button>

      <ComponentErrorBoundary context="Error Test">
        <ErrorTester shouldThrow={shouldThrow} />
      </ComponentErrorBoundary>
    </div>
  );
}
```

### 12. Error Boundary Performance Testing

```tsx
// Monitor error boundary performance
import { ComponentErrorBoundary } from "./ErrorBoundaries";

const handleError = (error, errorInfo) => {
  console.time("Error Recovery Time");

  // Log error details
  console.error("Component Error:", {
    error: error.message,
    component: errorInfo.componentStack,
    timestamp: new Date().toISOString(),
  });
};

export function MonitoredComponent() {
  return (
    <ComponentErrorBoundary context="Performance Test" onError={handleError}>
      <ComplexComponent />
    </ComponentErrorBoundary>
  );
}
```

## Best Practices Summary

1. **Use appropriate levels**: Don't over-engineer with too many boundaries
2. **Provide meaningful context**: Help with debugging and user understanding
3. **Test error scenarios**: Regularly test your error boundaries
4. **Monitor in production**: Set up proper error reporting
5. **Graceful degradation**: Ensure app remains functional when components fail
6. **User experience**: Provide clear recovery options for users

## Common Patterns to Avoid

```tsx
// ❌ Don't wrap every single element
<ComponentErrorBoundary>
  <span>Just text</span>
</ComponentErrorBoundary>

// ❌ Don't create too deep nesting
<PageErrorBoundary>
  <SectionErrorBoundary>
    <ComponentErrorBoundary>
      <ComponentErrorBoundary>
        <SimpleComponent />
      </ComponentErrorBoundary>
    </ComponentErrorBoundary>
  </SectionErrorBoundary>
</PageErrorBoundary>

// ✅ Do use strategic placement
<PageErrorBoundary>
  <SectionErrorBoundary context="Main Content">
    <div className="grid">
      {items.map(item => (
        <ComponentErrorBoundary key={item.id} context={`Item ${item.id}`}>
          <ItemComponent item={item} />
        </ComponentErrorBoundary>
      ))}
    </div>
  </SectionErrorBoundary>
</PageErrorBoundary>
```

This system provides robust error handling while maintaining excellent user experience and developer productivity.
