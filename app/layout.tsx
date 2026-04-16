import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'Intervyou | AI Interview Partner',
  description: 'Practice interviews in multiple languages with real-time AI feedback.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable}`}>
      <body className="font-sans antialiased bg-zinc-50 text-zinc-900" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
