import type { Metadata } from "next";
import { PricingClient } from "@/components/PricingClient";

export const metadata: Metadata = {
  title: "Pricing - PornSpot.ai | AI Generated Porn Plans",
  description:
    "Choose the perfect plan for your AI porn generation needs. From starter to unlimited plans with advanced features like private content and customization.",
  keywords: [
    "AI porn pricing",
    "generated porn plans",
    "AI adult content subscription",
    "porn generation pricing",
    "AI porn membership",
    "adult AI plans",
  ],
  openGraph: {
    title: "Pricing - PornSpot.ai | AI Generated Porn Plans",
    description:
      "Choose the perfect plan for your AI porn generation needs. From starter to unlimited plans with advanced features.",
    url: "/pricing",
  },
};

export default function PricingPage() {
  return <PricingClient />;
}
