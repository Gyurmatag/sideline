import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const SITE_URL = "https://sideline-agentb-web.cfi-ops.workers.dev";
const DESCRIPTION =
  "White-label, real-time, play-money prediction markets that drive engagement at events and hackathons. Powered by SpacetimeDB, Cloudflare, and Claude.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Sideline — Live event prediction markets",
    template: "%s — Sideline",
  },
  description: DESCRIPTION,
  applicationName: "Sideline",
  openGraph: {
    title: "Sideline — Live event prediction markets",
    description: DESCRIPTION,
    url: SITE_URL,
    siteName: "Sideline",
    type: "website",
  },
  twitter: { card: "summary_large_image", title: "Sideline", description: DESCRIPTION },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
