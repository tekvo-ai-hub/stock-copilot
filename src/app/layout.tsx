import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppLayout } from "@/components/app-layout";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Stock Copilot - AI-Powered Stock Prediction Platform",
  description: "Advanced AI-powered stock prediction and analysis platform for finance professionals. Get real-time predictions, technical analysis, and portfolio management tools.",
  keywords: ["stock prediction", "AI", "finance", "trading", "analysis", "portfolio"],
  authors: [{ name: "Tekvo AI Hub" }],
  openGraph: {
    title: "Stock Copilot - AI-Powered Stock Prediction",
    description: "Advanced AI-powered stock prediction and analysis platform",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AppLayout>
          {children}
        </AppLayout>
      </body>
    </html>
  );
}
