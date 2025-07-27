"use client";

import { usePathname } from "next/navigation";
import { ConditionalWhyRegisterSection } from "./ConditionalWhyRegisterSection";

interface AuthLayoutContentProps {
  children: React.ReactNode;
}

export function AuthLayoutContent({ children }: AuthLayoutContentProps) {
  const pathname = usePathname();
  const isRegisterPage = pathname.includes("/register");

  if (isRegisterPage) {
    // Layout avec deux colonnes pour la page register
    return (
      <div className="lg:flex lg:gap-12 lg:items-start">
        {/* Form Card */}
        <div className="lg:w-96 lg:flex-shrink-0">
          <div className="bg-card border border-border rounded-lg shadow-lg p-6">
            {children}
          </div>
        </div>

        {/* Why Register Section */}
        <div className="lg:flex-1 mt-8 lg:mt-0">
          <ConditionalWhyRegisterSection />
        </div>
      </div>
    );
  }

  // Layout centré pour les autres pages (login, etc.)
  return (
    <div className="flex justify-center">
      <div className="w-full max-w-md">
        <div className="bg-card border border-border rounded-lg shadow-lg p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
