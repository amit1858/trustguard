import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TrustGuard — Guardian Agent for Ads Trust & Safety",
  description:
    "Runtime trust-and-safety control layer for agentic ads workflows.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
