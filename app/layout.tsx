import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import { Analytics } from '@vercel/analytics/next';
import { IBM_Plex_Mono, Schibsted_Grotesk } from 'next/font/google';
import { Providers } from '@/components/museum/providers';
import { Cursor } from '@/components/museum/cursor';
import { ScrollTop } from '@/components/museum/section-nav';
import { PassportWatcher } from '@/components/museum/passport/watcher';
import { SITE_DESCRIPTION, SITE_TITLE, SITE_URL, OG_IMAGE } from '@/lib/seo';
import './globals.css';

// Newsreader is self-hosted at its one weight (400) with the optical-size axis
// kept, so display sizes keep their high-contrast cut. Google's variable file
// also carries the full weight axis: 279 KB for the two styles against 120 KB here.
// Latin Extended lives in its own family, fetched only if such a glyph appears.
const serif = localFont({
  src: [
    { path: './fonts/newsreader-normal-latin.woff2', weight: '400', style: 'normal' },
    { path: './fonts/newsreader-italic-latin.woff2', weight: '400', style: 'italic' },
  ],
  variable: '--font-serif',
  display: 'swap',
  fallback: ['Georgia', 'Times New Roman', 'serif'],
  // Size the fallback against a serif, so the swap to Newsreader barely moves
  // the text (next/font/local measures against Arial by default).
  adjustFontFallback: 'Times New Roman',
});
const serifExt = localFont({
  src: [
    { path: './fonts/newsreader-normal-latin-ext.woff2', weight: '400', style: 'normal' },
    { path: './fonts/newsreader-italic-latin-ext.woff2', weight: '400', style: 'italic' },
  ],
  variable: '--font-serif-ext',
  display: 'swap',
  preload: false,
  adjustFontFallback: false,
  declarations: [{ prop: 'unicode-range', value: 'U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF' }],
});
const sans = Schibsted_Grotesk({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });
// Monospace faces share one advance width (0.6em), so a system monospace is
// already a near-exact stand-in while Plex loads. The default fallback is Arial
// scaled to match, which still sets the text ~17% wider and wraps the hero
// kicker on phones, shifting everything below it when the real font arrives.
const mono = IBM_Plex_Mono({
  subsets: ['latin'], variable: '--font-mono', display: 'swap', weight: ['400', '500'],
  adjustFontFallback: false, fallback: ['Menlo', 'Consolas', 'Courier New', 'monospace'],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_TITLE, template: '%s — AGI Museum' },
  description: SITE_DESCRIPTION,
  icons: { icon: '/favicon.svg' },
  alternates: { canonical: '/' },
  openGraph: { title: SITE_TITLE, description: SITE_DESCRIPTION, url: '/', images: [OG_IMAGE], type: 'website', siteName: 'AGI Museum', locale: 'en_US' },
  twitter: { card: 'summary_large_image', title: SITE_TITLE, description: SITE_DESCRIPTION, images: [OG_IMAGE] },
};

export const viewport: Viewport = { themeColor: '#0b0b0a', colorScheme: 'dark' };

// A plain inline script, so it runs before first paint (next/script's
// beforeInteractive is queued until the Next.js runtime boots).
// - Applies the visitor's motion preference before anything animates.
// - Plays the CSS intro curtain once per session, only when the visit starts on
//   the home page; data-intro-done hides it again if the home page is revisited
//   in-app, since the attribute outlives client-side navigation.
const headScript = `try{var d=document.documentElement,s=sessionStorage,r=localStorage.getItem('agi-museum-motion')==='off'||matchMedia('(prefers-reduced-motion: reduce)').matches;if(r)d.dataset.motion='reduced';if(!r&&location.pathname==='/'&&!s.getItem('agi-intro')){s.setItem('agi-intro','1');d.dataset.intro='play';d.addEventListener('animationend',function f(e){if(e.animationName==='preloader-exit'){d.setAttribute('data-intro-done','');d.removeEventListener('animationend',f)}})}else d.dataset.intro='seen'}catch(e){}`;

// Without JavaScript, nothing waits for an animation that will never run.
const noscriptStyle = '.line-inner{transform:none!important}[style*="opacity:0"]{opacity:1!important;transform:none!important}';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${serifExt.variable} ${sans.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: headScript }} />
        <noscript><style>{noscriptStyle}</style></noscript>
      </head>
      <body>
        <Providers>
          {children}
          <ScrollTop />
          <PassportWatcher />
          <Cursor />
        </Providers>
        <div className="grain" aria-hidden="true" />
        {/* Vercel Web Analytics: cookieless page views, including in-app navigations. */}
        <Analytics />
      </body>
    </html>
  );
}
