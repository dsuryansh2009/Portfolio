import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter, Lora, Martel } from "next/font/google";
import "@/styles/globals.css";
import GlobalEffects from "@/components/layout/global-effects";
import { Analytics } from "@vercel/analytics/react";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
});

const martel = Martel({
  variable: "--font-martel",
  weight: ["700", "800"],
  subsets: ["devanagari", "latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://localhost:3000"),
  title: {
    default: "dsuryansh",
    template: "%s | dsuryansh",
  },
  description: "Personal portfolio of dsuryansh showcasing AI projects, blogs, creative work, photography, sketches, and experiments with technology.",
  keywords: [
    "dsuryansh", "dsuryansh portfolio", "dsuryansh", "dsuryansh portfolio", 
    "dsuryansh AI", "dsuryansh developer", "AI developer India", 
    "Student developer portfolio", "dsuryansh Kumar"
  ],
  authors: [{ name: "dsuryansh Kumar", url: "https://localhost:3000" }],
  creator: "dsuryansh Kumar",
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "/",
    title: "dsuryansh",
    description: "Personal portfolio of dsuryansh showcasing AI projects, blogs, creative work, photography, sketches, and experiments with technology.",
    siteName: "dsuryansh",
  },
  twitter: {
    card: "summary_large_image",
    title: "dsuryansh",
    description: "Personal portfolio of dsuryansh showcasing AI projects, blogs, creative work, photography, sketches, and experiments with technology.",
    creator: "@dsuryansh",
  },

  manifest: "/manifest.json",
};

export const viewport = {
  themeColor: "#050505",
};

import SmoothScroll from "@/components/layout/smooth-scroll";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} ${lora.variable} ${martel.variable} antialiased`}
    >
      <body className="bg-[#050505] overflow-x-hidden">
        <SmoothScroll>
          <GlobalEffects />
          {children}
          <Analytics />
        </SmoothScroll>
      </body>
    </html>
  );
}
