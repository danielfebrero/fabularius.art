import { Metadata } from "next";
import { RegisterForm } from "@/components/user/RegisterForm";

export const metadata: Metadata = {
  title: "Sign Up - PornSpot.ai",
  description: "Create your PornSpot.ai account",
};

export default function RegisterPage() {
  return <RegisterForm />;
}
