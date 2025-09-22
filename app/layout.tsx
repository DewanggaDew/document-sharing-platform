import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import { LoadingProvider } from "@/components/loading-provider"
import { PageTransition } from "@/components/page-transition"
import "./globals.css"

export const metadata: Metadata = {
  title: "CompeteDocs - Competition Document Platform",
  description: "Discover winning competition documents from top universities worldwide",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        {/* Wrapped children with loading providers and Suspense for smooth transitions */}
        <LoadingProvider>
          <Suspense fallback={null}>
            <PageTransition>{children}</PageTransition>
          </Suspense>
        </LoadingProvider>
        <Analytics />
      </body>
    </html>
  )
}
