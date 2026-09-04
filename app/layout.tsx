import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });

export const metadata: Metadata = {
  title: "R.mix – Premium Social Experience Platform",
  description: "Experience the next level of social connection on R.mix. Share high-fidelity reels, stories, full-length videos, and broadcast live streams directly to your audience.",
  alternates: {
    canonical: "https://r-mix.vercel.app/",
  },
  openGraph: {
    title: "R.mix – Premium Social Experience Platform",
    description: "Experience the next level of social connection on R.mix. Share high-fidelity reels, stories, full-length videos, and broadcast live streams directly to your audience.",
    url: "https://r-mix.vercel.app/",
    type: "website",
    siteName: "R.mix",
  },
  twitter: {
    card: "summary_large_image",
    title: "R.mix – Premium Social Experience Platform",
    description: "Experience the next level of social connection on R.mix. Share high-fidelity reels, stories, full-length videos, and broadcast live streams directly to your audience.",
  },
  other: {
    "google-adsense-account": "ca-pub-8344189408835852",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8344189408835852" crossOrigin="anonymous"></script>
        <meta name="google-site-verification" content="1NCwlfSEj1DHfA91luhxp-yMnxRXb07l9K4JWPGGu-c" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "R.mix",
              "url": "https://r-mix.vercel.app/",
              "description": "Experience the next level of social connection on R.mix. Share high-fidelity reels, stories, full-length videos, and broadcast live streams directly to your audience.",
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://r-mix.vercel.app/?q={search_term_string}",
                "query-input": "required name=search_term_string"
              }
            })
          }}
        />
      </head>
      <body className={`${inter.variable} ${playfair.variable} font-sans antialiased bg-zinc-950 text-zinc-50`}>
        {children}
      </body>
    </html>
  );
}

