import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AdminProvider } from "@/contexts/AdminContext";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Fabularius.art - Minimalist Gallery",
  description:
    "A beautiful, minimalist gallery for showcasing art and photography",
  keywords: ["gallery", "art", "photography", "minimalist", "portfolio"],
  authors: [{ name: "Fabularius.art" }],
  creator: "Fabularius.art",
  publisher: "Fabularius.art",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(
    process.env["NEXT_PUBLIC_SITE_URL"] || "https://fabularius.art"
  ),
  openGraph: {
    title: "Fabularius.art - Minimalist Gallery",
    description:
      "A beautiful, minimalist gallery for showcasing art and photography",
    url: "https://fabularius.art",
    siteName: "Fabularius.art",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Fabularius.art Gallery",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Fabularius.art - Minimalist Gallery",
    description:
      "A beautiful, minimalist gallery for showcasing art and photography",
    images: ["/og-image.jpg"],
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
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon-16x16.png"
        />
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
                  &copy; 2024 Fabularius.art. All rights reserved.
                </p>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
