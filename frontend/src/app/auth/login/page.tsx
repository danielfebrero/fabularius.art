import { Metadata } from "next";
import { LoginForm } from "@/components/user/LoginForm";

export const metadata: Metadata = {
  title: "Sign In - PornSpot.ai",
  description: "Sign in to your PornSpot.ai account",
};

export default function LoginPage() {
  return <LoginForm />;
}
