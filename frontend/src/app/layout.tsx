import type { Metadata } from "next";
import { Manrope, Sora } from "next/font/google";
import "./globals.css";
import { SystemPopup } from "@/components/system-popup";

const bodyFont = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
});

const displayFont = Sora({
  subsets: ["latin"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "Cinema",
  description: "Donghua streaming platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body
        className={`${bodyFont.variable} ${displayFont.variable} min-h-screen bg-[var(--bg)] text-white antialiased`}
      >
        {children}
        <SystemPopup />
      </body>
    </html>
  );
}
