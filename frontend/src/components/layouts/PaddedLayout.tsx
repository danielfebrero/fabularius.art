import React from "react";

interface PaddedLayoutProps {
  children: React.ReactNode;
}

export function PaddedLayout({ children }: PaddedLayoutProps) {
  return <div className="container mx-auto px-4 py-8">{children}</div>;
}
