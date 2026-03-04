import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'SalesWhisper — AI Sales Coaching',
  description: 'Real-time AI coaching during your sales calls. Close more deals.',
  icons: { icon: '/favicon.ico' },
  openGraph: {
    title: 'SalesWhisper',
    description: 'AI that coaches you during every call, not after.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body style={{ margin: 0, padding: 0, fontFamily: 'Inter, -apple-system, sans-serif' }}>
        {children}
      </body>
    </html>
  )
}