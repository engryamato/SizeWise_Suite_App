import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
// Temporarily disable complex imports to test basic functionality
// import { AppShellContainer } from '@/components/layout/AppShellContainer'
// import { ToasterProvider } from '@/lib/hooks/useToaster'
// import { ThemeProvider } from '@/lib/hooks/useTheme'
// import { ServiceProvider } from '@/lib/providers/ServiceProvider'
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
      </head>
      <body className={inter.className}>
        {/* Minimal layout for testing */}
        <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
          <h1 style={{ color: '#333', marginBottom: '20px' }}>SizeWise Suite - Testing Basic Layout</h1>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            If you can see this message, the basic Next.js setup is working.
          </p>
          {children}
        </div>
      </body>
    </html>
  )
}
