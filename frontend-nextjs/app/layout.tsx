import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

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
      <body className={inter.className}>{children}</body>
    </html>
  )
}
