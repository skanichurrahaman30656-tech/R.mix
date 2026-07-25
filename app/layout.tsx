import type {Metadata} from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'R.mix',
  description: 'Instagram-style social media platform',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased bg-white" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
