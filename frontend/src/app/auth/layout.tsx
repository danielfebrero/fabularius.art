import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Authentication - PornSpot.ai",
  description: "Sign in or create an account for PornSpot.ai",
  robots: {
    index: false,
    follow: false,
  },
};

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-foreground">
                PornSpot.ai
              </h1>
              <p className="text-muted-foreground mt-2">
                AI Generated Porn Images & Videos
              </p>
            </div>

            <div className="bg-card border border-border rounded-lg shadow-lg p-6">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
