import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { PrivacyNotice } from "@/components/ui/PrivacyNotice";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "AEGIS | Security Intelligence Dashboard",
  description: "Real-time security intelligence dashboard for threat monitoring, CVE tracking, and APT analysis",
  icons: {
    icon: [
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: { images: ["/icon-512.png"] },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
        <PrivacyNotice />
      </body>
    </html>
  );
}
