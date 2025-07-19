import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AppShell } from '@/components/ui/AppShell'
import { ToasterProvider } from '@/lib/hooks/useToaster'
import { ThemeProvider } from '@/lib/hooks/useTheme'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SizeWise Suite App',
  description: 'A modular, offline-first HVAC engineering and estimating platform with Air Duct Sizer, standards compliance (SMACNA/NFPA/ASHRAE), and Progressive Web App capabilities',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#ffffff" />
      </head>
      <body className={inter.className}>
        <ThemeProvider defaultTheme="system" storageKey="sizewise-theme">
          <ToasterProvider position="bottom-right" maxToasts={5}>
            <AppShell>
              {children}
            </AppShell>
          </ToasterProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
