import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mindful",
  description: "A full-screen learning card, one at a time. Open this instead of doom-scrolling.",
  applicationName: "Mindful",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Mindful",
  },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icon.svg",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#0b0b0f",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-ink text-paper">{children}</body>
    </html>
  );
}
