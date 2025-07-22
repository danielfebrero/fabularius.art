"use client";

import { usePathname } from "next/navigation";
import { AdminProvider } from "../../contexts/AdminContext";
import { ProtectedRoute } from "../../components/admin/ProtectedRoute";
import { AdminNav } from "../../components/admin/AdminNav";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminProvider>
      <div className="min-h-screen bg-muted/30">
        <AdminLayoutContent>{children}</AdminLayoutContent>
      </div>
    </AdminProvider>
  );
}

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/admin/login";

  // Render login page without protection
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Render protected admin content with layout
  return (
    <ProtectedRoute>
      <div className="flex h-screen">
        {/* Sidebar Navigation */}
        <AdminNav />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          {/* <AdminHeader /> */}

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
