"use client";

import { usePathname } from "next/navigation";
import { WhyRegisterSection } from "./WhyRegisterSection";

export function ConditionalWhyRegisterSection() {
  const pathname = usePathname();
  const isRegisterPage = pathname.includes("/register");

  if (!isRegisterPage) {
    return null;
  }

  return <WhyRegisterSection />;
}
