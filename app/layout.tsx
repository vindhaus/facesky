import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Navigation } from "@/components/navigation"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/contexts/auth-context"
import { Toaster } from "@/components/ui/toaster"
import { FeedbackButton } from "@/components/feedback-button"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Facesky - Social AT Protocol Client",
  description: "A Facebook-style interface for the AT Protocol with Groups and Pages",
  keywords: ["AT Protocol", "Bluesky", "Social Media", "Decentralized"],
  authors: [{ name: "Facesky Team" }],
  openGraph: {
    title: "Facesky - Social AT Protocol Client",
    description: "A Facebook-style interface for the AT Protocol with Groups and Pages",
    type: "website",
  },
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <div className="min-h-screen bg-background">
              <Navigation />
              <main className="pt-16">{children}</main>
            </div>
            <Toaster />
            <FeedbackButton />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
