import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BIZMATE — Intelligent Operating System for Business",
  description: "BIZMATE helps companies understand, decide and act from one intelligent workspace.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
