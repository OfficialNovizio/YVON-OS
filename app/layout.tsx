import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Shell from '@/components/Shell'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'YVON Dashboard',
  description: 'Business Intelligence Dashboard for YVON — Novizio, Hourbour, and more.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable}`}>
      <body className={`${inter.className}`}>
        <Shell>{children}</Shell>
      </body>
    </html>
  )
}
