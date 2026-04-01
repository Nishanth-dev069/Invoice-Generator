import type { Metadata } from "next";
import { Quicksand, Lora } from "next/font/google";
import { Toaster } from "sonner";
import { Providers } from "@/components/providers";
import "./globals.css";

const quicksand = Quicksand({ 
  subsets: ["latin"],
  variable: "--font-quicksand",
  display: "swap"
});

// Lora serves as the closest accessible Google Font alternative for Quincy CF wordmarks
const quincy = Lora({
  subsets: ["latin"],
  variable: "--font-quincy",
  display: "swap"
});

export const metadata: Metadata = {
  title: "Ink & Print Studio",
  description: "Print studio management system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${quicksand.variable} ${quincy.variable} font-sans`}>
        <Providers>
          {children}
          <Toaster richColors position="top-right" />
        </Providers>
      </body>
    </html>
  );
}
