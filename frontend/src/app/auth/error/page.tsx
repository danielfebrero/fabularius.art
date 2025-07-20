import { Metadata } from "next";
import { AuthErrorClient } from "@/components/user/AuthErrorClient";

export const metadata: Metadata = {
  title: "Authentication Error - PornSpot.ai",
  description: "There was an issue with your authentication request.",
};

export default function AuthErrorPage() {
  return <AuthErrorClient />;
}
