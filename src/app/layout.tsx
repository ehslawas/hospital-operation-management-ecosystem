import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AuthWrapper from "@/components/AuthWrapper";
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
  title: "Pharmacy Inventory & Logistics System (PILS)",
  description: "Comprehensive hospital pharmacy inventory and logistics management system",
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning style={{overscrollBehavior: 'none', height: '100%', margin: 0, padding: 0}}>
      <head>
        <script dangerouslySetInnerHTML={{__html: `
          if (typeof window !== 'undefined') {
            window.addEventListener('load', function() {
              document.body.style.overscrollBehavior = 'none';
              document.documentElement.style.overscrollBehavior = 'none';
            });
          }
        `}} />
      </head>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased app-background`}
        style={{overscrollBehavior: 'none', margin: 0, padding: 0}}
      >
        <AuthWrapper>
          {children}
        </AuthWrapper>
        <Toaster />
      </body>
    </html>
  );
}
