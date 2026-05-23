import {
  Cormorant_Garamond,
  Geist_Mono,
  Inter,
  Pinyon_Script,
} from "next/font/google"
import type { Metadata } from "next"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { CartProvider } from "@/components/cart/cart-provider"
import { Toaster } from "@/components/ui/sonner"
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })

// Calligraphic script — matches the BieLux wordmark
const pinyon = Pinyon_Script({
  subsets: ["latin"],
  variable: "--font-script",
  weight: "400",
})

// Refined serif for product names and headings
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-cormorant",
  weight: ["400", "500", "600"],
})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  title: "BieLux — Luxury, in bloom",
  description:
    "BieLux is a boutique of considered luxury — dresses, sets and the pieces everyone's after.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        inter.variable,
        pinyon.variable,
        cormorant.variable
      )}
    >
      <body>
        <ThemeProvider forcedTheme="light">
          <CartProvider>
            {children}
            <Toaster position="bottom-center" />
          </CartProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
