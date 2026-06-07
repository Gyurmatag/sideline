import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sideline — Live Event Prediction Markets",
  description:
    "White-label, real-time, play-money prediction markets that drive engagement at events and hackathons.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
