import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AdminProvider } from "@/contexts/AdminContext";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "PornSpot.ai - AI Generated Porn Images & Videos",
  description:
    "Discover and create AI-generated porn content. Generate custom images and videos with prompts, LoRA selections, and more. Plans: Free (5 images/day, 1 video/week), Classic ($15/month: unlimited images, 7 videos/week), Plus ($25/month: unlimited everything).",
  keywords: [
    "AI porn",
    "generated porn",
    "AI adult content",
    "porn images",
    "porn videos",
    "AI generator",
    "adult AI",
    "custom porn",
    "LoRA porn",
  ],
  authors: [{ name: "PornSpot.ai" }],
  creator: "PornSpot.ai",
  publisher: "PornSpot.ai",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(
    process.env["NEXT_PUBLIC_SITE_URL"] || "https://pornspot.ai"
  ),
  openGraph: {
    title: "PornSpot.ai - AI Generated Porn Images & Videos",
    description:
      "Discover and create AI-generated porn content. Generate custom images and videos with prompts, LoRA selections, and more. Plans: Free (5 images/day, 1 video/week), Classic ($15/month: unlimited images, 7 videos/week), Plus ($25/month: unlimited everything).",
    url: "https://pornspot.ai",
    siteName: "PornSpot.ai",
    images: [
      {
        url: "/website.png",
        width: 1024,
        height: 1024,
        alt: "PornSpot.ai - AI Generated Porn",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PornSpot.ai - AI Generated Porn Images & Videos",
    description:
      "Discover and create AI-generated porn content. Generate custom images and videos with prompts, LoRA selections, and more. Plans: Free (5 images/day, 1 video/week), Classic ($15/month: unlimited images, 7 videos/week), Plus ($25/month: unlimited everything).",
    images: ["/website.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  ...(process.env["GOOGLE_SITE_VERIFICATION"] && {
    verification: {
      google: process.env["GOOGLE_SITE_VERIFICATION"],
    },
  }),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/180.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/16.png" />
        <meta name="theme-color" content="#000000" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <div className="min-h-screen bg-background">
          <AdminProvider>
            <main className="container mx-auto px-4 py-8">{children}</main>
          </AdminProvider>

          <footer className="border-t border-border mt-16">
            <div className="container mx-auto px-4 py-8">
              <div className="text-center">
                <p className="text-muted-foreground">
                  &copy; 2024 PornSpot.ai. All rights reserved.
                </p>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
