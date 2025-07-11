"use client";

import { useAdminContext } from "../../contexts/AdminContext";
import { Button } from "../ui/Button";

export function AdminHeader() {
  const { user, logout, loading } = useAdminContext();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className="border-b border-border bg-background">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-semibold text-foreground">Admin Panel</h1>
        </div>

        <div className="flex items-center space-x-4">
          {user && (
            <span className="text-sm text-muted-foreground">
              Welcome, {user.username}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            loading={loading}
            disabled={loading}
          >
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}
