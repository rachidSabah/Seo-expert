import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SEO Expert — AI-Powered SEO Analytics & Optimization Platform",
  description:
    "Smart AI-powered SEO platform with real-time scoring, keyword research, backlink analysis, rank tracking, on-page SEO assistant, and Puter.js AI content generation. Combining Ahrefs, SEMrush, and Rank Math capabilities.",
  keywords: [
    "SEO Expert",
    "SEO Analytics",
    "AI SEO Assistant",
    "On-Page SEO",
    "Keyword Research",
    "Backlink Analysis",
    "Rank Tracking",
    "SEO Audit",
    "Content Optimization",
    "SEO Scoring",
    "Puter.js",
  ],
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "SEO Expert — AI-Powered SEO Platform",
    description: "Smart SEO analytics with real-time scoring, AI content generation, and Rank Math-like on-page optimization",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
