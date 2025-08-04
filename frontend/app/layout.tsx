import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
// Re-enabling core providers for production functionality
import { AppShellContainer } from '@/components/layout/AppShellContainer'
import { ToasterProvider } from '@/lib/hooks/useToaster'
import { ThemeProvider } from '@/lib/hooks/useTheme'
import { ServiceProvider } from '@/lib/providers/ServiceProvider'
// Keep these temporarily disabled for stability
// import { TwentyFirstToolbar } from '@21st-extension/toolbar-next' // Temporarily disabled
// import { SentryErrorBoundary } from '@/components/error/SentryErrorBoundary'
// import { SentryTestPanel } from '@/components/debug/SentryTestPanel'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SizeWise Suite App',
  description: 'A modular, offline-first HVAC engineering and estimating platform with Air Duct Sizer, standards compliance (SMACNA/NFPA/ASHRAE), and Progressive Web App capabilities',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#ffffff" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className={inter.className}>
        {/* Production layout with proper provider hierarchy */}
        <ThemeProvider defaultTheme="system" storageKey="sizewise-theme">
          <ServiceProvider mode="offline">
            <ToasterProvider position="bottom-right" maxToasts={5}>
              <AppShellContainer>
                {children}
              </AppShellContainer>
            </ToasterProvider>
          </ServiceProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
