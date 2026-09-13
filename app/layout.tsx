import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'R.mix - Viral Growth & Social Platform',
  description: 'Next-generation social network blending video reels, photo sharing, algorithmic discovery, creator monetization, and copyright management.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-zinc-950 text-zinc-100 antialiased font-sans`}>
        {children}
      </body>
    </html>
  );
}
