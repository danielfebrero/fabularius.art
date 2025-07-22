import React from "react";

interface NonPaddedLayoutProps {
  children: React.ReactNode;
}

export function NonPaddedLayout({ children }: NonPaddedLayoutProps) {
  return <div className="w-full">{children}</div>;
}
