import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { IBM_Plex_Mono, Newsreader, Schibsted_Grotesk } from 'next/font/google';
import { Providers } from '@/components/museum/providers';
import { Cursor } from '@/components/museum/cursor';
import { ScrollTop } from '@/components/museum/section-nav';
import { PassportWatcher } from '@/components/museum/passport/watcher';
import { events } from '@/data/events';
import './globals.css';

const serif = Newsreader({ subsets: ['latin'], style: ['normal', 'italic'], axes: ['opsz'], variable: '--font-serif', display: 'swap' });
const sans = Schibsted_Grotesk({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });
const mono = IBM_Plex_Mono({ subsets: ['latin'], variable: '--font-mono', display: 'swap', weight: ['400', '500'] });

const description = `An interactive, source-backed museum of the road to artificial general intelligence: ${events.length} exhibits from 1943 to September 2026, spanning breakthroughs, ideas, institutions and governance.`;

export const metadata: Metadata = {
  metadataBase: new URL('https://agi-museum.vercel.app'),
  title: { default: 'AGI Museum — The making of intelligence', template: '%s — AGI Museum' },
  description,
  icons: { icon: '/favicon.svg' },
  openGraph: { title: 'AGI Museum — The making of intelligence', description, images: [{ url: '/intelligence-gallery.png', width: 1536, height: 1024 }], type: 'website', siteName: 'AGI Museum' },
  twitter: { card: 'summary_large_image', title: 'AGI Museum', description, images: ['/intelligence-gallery.png'] },
};

export const viewport: Viewport = { themeColor: '#0b0b0a', colorScheme: 'dark' };

// Runs before paint: skip the intro on repeat visits or when motion is reduced.
const introScript = `try{var d=document.documentElement;if(sessionStorage.getItem('agi-intro')||localStorage.getItem('agi-museum-motion')==='off'||matchMedia('(prefers-reduced-motion: reduce)').matches)d.dataset.intro='seen'}catch(e){}`;

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <Script id="intro-state" strategy="beforeInteractive">{introScript}</Script>
        <noscript><style>{'.preloader{display:none}.line-inner{transform:none!important}'}</style></noscript>
      </head>
      <body>
        <Providers>
          {children}
          <ScrollTop />
          <PassportWatcher />
          <Cursor />
        </Providers>
        <div className="grain" aria-hidden="true" />
      </body>
    </html>
  );
}
