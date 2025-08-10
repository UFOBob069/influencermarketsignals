import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react";
import SiteNav from "./components/SiteNav";
import { AuthProvider } from "@/lib/auth";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Influencer Market Signals — Daily Market Signals",
  description:
    "Hear what top finance influencers are saying about stocks. Updated daily. We scan 100+ voices to surface tickers, sentiment, and snippets.",
  keywords:
    "stocks, influencers, finance podcasts, market signals, sentiment, tickers, trading, daily updates",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-black text-white`} suppressHydrationWarning>
        <AuthProvider>
          <SiteNav />
          {children}
          <Analytics />
        </AuthProvider>
      </body>
    </html>
  );
}
