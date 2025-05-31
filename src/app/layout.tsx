import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MarketPod Digest - Stay Ahead of the Market",
  description: "Get concise summaries from the top finance podcasts. Stay informed with AI-powered insights and analysis.",
  keywords: "finance podcast, market analysis, investment insights, podcast summary, financial news",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className} suppressHydrationWarning>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
