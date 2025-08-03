"use client";

import { useAdminContext } from "@/contexts/AdminContext";
import { Button } from "@/components/ui/Button";
import Avatar from "@/components/ui/Avatar";

export function AdminHeader() {
  const { user, logout, loading } = useAdminContext();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className="border-b border-border bg-card shadow-sm">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-admin-primary to-admin-secondary rounded-lg flex items-center justify-center">
              <svg
                className="w-5 h-5 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">
                Admin Dashboard
              </h1>
              <p className="text-xs text-muted-foreground">
                Gallery Management System
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {user && (
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <p className="text-sm font-medium text-foreground">
                  {user.username || user.email}
                </p>
                <p className="text-xs text-muted-foreground">
                  {user.role === "admin" ? "Administrator" : "Moderator"}
                </p>
              </div>
              <Avatar
                user={user}
                size="small"
                className="bg-gradient-to-br from-admin-accent to-admin-primary"
              />
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            loading={loading}
            disabled={loading}
            className="border-admin-primary/20 text-admin-primary hover:bg-admin-primary hover:text-admin-primary-foreground"
          >
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}
