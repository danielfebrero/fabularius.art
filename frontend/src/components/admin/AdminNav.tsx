"use client";

import LocaleLink from "@/components/ui/LocaleLink";
import React from "react";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";

const navItems = [
  {
    href: "/admin",
    label: "Dashboard",
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z"
        />
      </svg>
    ),
  },
  {
    href: "/admin/albums",
    label: "Albums",
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
        />
      </svg>
    ),
  },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="w-64 bg-admin-sidebar border-r border-border h-full">
      <div className="p-6">
        <div className="mb-8">
          <h2 className="text-lg font-bold text-admin-sidebar-foreground">
            pornspot Admin
          </h2>
          <p className="text-sm text-admin-sidebar-foreground/70">
            Art Gallery Management
          </p>
        </div>
        <div className="space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;

            return (
              <LocaleLink
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-admin-primary text-admin-primary-foreground shadow-lg"
                    : "text-admin-sidebar-foreground/70 hover:text-admin-sidebar-foreground hover:bg-admin-sidebar-foreground/10"
                )}
              >
                {item.icon}
                <span>{item.label}</span>
              </LocaleLink>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
