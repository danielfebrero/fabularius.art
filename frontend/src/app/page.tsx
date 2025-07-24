import { redirect } from "next/navigation";
import { Metadata } from "next";
import { generateHomepageMetadata } from "@/lib/opengraph";

export async function generateMetadata(): Promise<Metadata> {
  return generateHomepageMetadata("en");
}

// Root page redirects to the default locale
export default function RootPage() {
  redirect("/en");
}
