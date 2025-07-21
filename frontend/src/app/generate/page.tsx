import { Metadata } from "next";
import { GenerateClient } from "@/components/GenerateClient";

export const metadata: Metadata = {
  title: "AI Image Generator - PornSpot",
  description:
    "Generate AI-powered adult content with our advanced image generation tools. Choose from multiple models, styles, and parameters.",
  keywords: [
    "AI image generation",
    "adult content creation",
    "custom parameters",
    "LoRA models",
    "bulk generation",
  ],
};

export default function GeneratePage() {
  return <GenerateClient />;
}
