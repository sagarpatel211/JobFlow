import './globals.css'
import { DM_Sans } from 'next/font/google'

const dmSans = DM_Sans({ subsets: ['latin'] })

export const metadata = {
  title: 'JobFlow - Automate Your Job Search',
  description: 'Track, apply, and land your dream job with ease using JobFlow.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={dmSans.className}>{children}</body>
    </html>
  )
}