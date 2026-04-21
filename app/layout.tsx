import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import NavbarWrapper from "@/components/custom/NavbarWrapper";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Suraki",
  description: "Wildlife and nature incident reporting app",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Suraki",
  },
  icons: {
    icon: "/suraki-app.png",
    apple: "/suraki-app.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0B3D2E",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <NavbarWrapper />
      </body>
    </html>
  );
}