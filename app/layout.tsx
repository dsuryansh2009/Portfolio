import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter, Lora, Martel } from "next/font/google";
import "@/styles/globals.css";
import GlobalEffects from "@/components/layout/global-effects";

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
    default: "Suryansh | AI Developer & Student Portfolio",
    template: "%s | Suryansh",
  },
  description: "Personal portfolio of Suryansh showcasing AI projects, blogs, creative work, photography, sketches, and experiments with technology.",
  keywords: [
    "dsuryansh", "dsuryansh portfolio", "Suryansh", "Suryansh portfolio", 
    "Suryansh AI", "Suryansh developer", "AI developer India", 
    "Student developer portfolio", "Suryansh Kumar"
  ],
  authors: [{ name: "Suryansh Kumar", url: "https://localhost:3000" }],
  creator: "Suryansh Kumar",
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "/",
    title: "Suryansh | AI Developer & Student Portfolio",
    description: "Personal portfolio of Suryansh showcasing AI projects, blogs, creative work, photography, sketches, and experiments with technology.",
    siteName: "Suryansh Portfolio",
  },
  twitter: {
    card: "summary_large_image",
    title: "Suryansh | AI Developer & Student Portfolio",
    description: "Personal portfolio of Suryansh showcasing AI projects, blogs, creative work, photography, sketches, and experiments with technology.",
    creator: "@dsuryansh",
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
};

export const viewport = {
  themeColor: "#050505",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} ${lora.variable} ${martel.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#050505]">
        <GlobalEffects />
        {children}
      </body>
    </html>
  );
}
