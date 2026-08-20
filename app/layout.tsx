import type { Metadata, Viewport } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })

export const metadata: Metadata = {
  title: 'Olist Order Process Intelligence',
  description:
    'Process mining over 95,082 delivered Olist orders: which stage causes late deliveries, and what lateness costs in customer satisfaction.',
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#ffffff',
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`light bg-background ${geist.variable}`}>
      <body className="antialiased font-sans">{children}</body>
    </html>
  )
}
