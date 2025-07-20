import { Metadata } from "next";
import { AuthSuccessClient } from "@/components/user/AuthSuccessClient";

export const metadata: Metadata = {
  title: "Welcome - PornSpot.ai",
  description: "Welcome to PornSpot.ai! Your account is ready.",
};

export default function AuthSuccessPage() {
  return <AuthSuccessClient />;
}
