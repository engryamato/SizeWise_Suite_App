import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AppShellContainer } from '@/components/layout/AppShellContainer'
import { ToasterProvider } from '@/lib/hooks/useToaster'
import { ThemeProvider } from '@/lib/hooks/useTheme'
import { ServiceProvider } from '@/lib/providers/ServiceProvider'
import { TwentyFirstToolbar } from '@21st-extension/toolbar-next'
import { SentryErrorBoundary } from '@/components/error/SentryErrorBoundary'
import { SentryTestPanel } from '@/components/debug/SentryTestPanel'

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
      </head>
      <body className={inter.className}>
        <SentryErrorBoundary>
          <ServiceProvider mode="offline">
            <ThemeProvider defaultTheme="system" storageKey="sizewise-theme">
              <ToasterProvider position="bottom-left" maxToasts={5}>
                <AppShellContainer>
                  {children}
                </AppShellContainer>
              </ToasterProvider>
            </ThemeProvider>
          </ServiceProvider>
        </SentryErrorBoundary>

        {/* Development Tools */}
        {process.env.NODE_ENV === 'development' && (
          <>
            <TwentyFirstToolbar
              config={{
                plugins: [], // Add custom plugins here if needed
              }}
            />
            <SentryTestPanel />
          </>
        )}
      </body>
    </html>
  )
}
