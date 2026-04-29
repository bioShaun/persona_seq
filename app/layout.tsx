import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import { GeistSans } from "geist/font/sans";

import "./globals.css";
import { Toaster } from "sonner";
import { cn } from "@/lib/utils";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Proposal Platform",
  description: "Proposal platform MVP scaffold"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={cn(spaceGrotesk.variable, GeistSans.variable)}>
      <body className="font-sans">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
