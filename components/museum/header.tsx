'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'motion/react';
import { Search, Stamp, X } from 'lucide-react';
import { earned, stamps, usePassport } from '@/lib/passport';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { useMuseum } from './providers';
import { useActiveSection } from './use-active-section';

const LINKS = [
  { href: '/#galleries', label: 'Galleries' },
  { href: '/#collection', label: 'Collection' },
  { href: '/workshop', label: 'Workshop' },
  { href: '/#debate', label: 'Debate' },
  { href: '/timeline', label: 'Timeline' },
];

// The other wings, listed in the mobile menu and the home page directory.
export const WINGS = [
  { href: '/time-machine', label: 'Time machine' },
  { href: '/people', label: 'Who’s who' },
  { href: '/pairs', label: 'Pendants' },
  { href: '/stand', label: 'Where do you stand?' },
  { href: '/shop', label: 'Gift shop' },
  { href: '/passport', label: 'Your passport' },
];

/** The passport in the header: a stamp icon and how many stamps you hold. */
function PassportBadge({ onClick }: { onClick?: () => void }) {
  const got = earned(usePassport()).length;
  return (
    <Link href="/passport" className="passport-badge" onClick={onClick} aria-label={`Your passport: ${got} of ${stamps.length} stamps`} title="Your passport">
      <Stamp size={15} /><span className="mono">{got}<i>/{stamps.length}</i></span>
    </Link>
  );
}

/** In-page anchors stay plain links so the smooth-scroll handler owns them. */
function NavLink({ href, ...rest }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  return href.startsWith('#') ? <a href={href} {...rest} /> : <Link href={href} {...rest} />;
}

export function Wordmark() {
  return (
    <span className="wordmark">
      <span className="wm-glyph serif" aria-hidden="true">a<em>i</em></span>
      <span className="wm-text mono">AGI <br />MUSEUM</span>
    </span>
  );
}

export function Header({ onSearch, current }: { onSearch: () => void; current?: string }) {
  const { reduced, toggleMotion, lockScroll } = useMuseum();
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);
  const [solid, setSolid] = useState(false);
  const [menu, setMenu] = useState(false);
  const mac = useSyncExternalStore(() => () => {}, () => /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent), () => true);
  const home = usePathname() === '/';
  const href = (h: string) => (home && h.startsWith('/#') ? h.slice(1) : h);
  const spied = useActiveSection(home ? LINKS.filter(l => l.href.startsWith('/#')).map(l => l.href.slice(2)) : []);
  const isCurrent = (l: { href: string; label: string }) => current === l.label || (!!spied && l.href === `/#${spied}`);

  // Let sticky toolbars know whether the header is covering the top of the viewport.
  useEffect(() => { document.documentElement.dataset.header = hidden && !menu ? 'hidden' : 'shown'; }, [hidden, menu]);

  useEffect(() => { if (!menu) return; lockScroll(true); return () => lockScroll(false); }, [menu, lockScroll]);

  useMotionValueEvent(scrollY, 'change', y => {
    const prev = scrollY.getPrevious() ?? 0;
    setSolid(y > 40);
    setHidden(y > 400 && y > prev + 2 ? true : y < prev - 2 ? false : hidden);
  });

  return (
    <>
      <motion.header className={`site-header ${solid ? 'is-solid' : ''}`} animate={{ y: hidden && !menu ? '-110%' : '0%' }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}>
        <Link href="/" className="brand"><Wordmark /><span className="sr-only"> home</span></Link>
        <nav className="main-nav" aria-label="Main navigation">
          {LINKS.map(l => (
            <NavLink key={l.href} href={href(l.href)} className={isCurrent(l) ? 'current' : ''} aria-current={current === l.label ? 'page' : isCurrent(l) ? 'location' : undefined}>
              <span data-text={l.label}>{l.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="header-tools">
          <PassportBadge />
          <button className="search-trigger" onClick={onSearch} aria-label="Search the collection">
            <Search size={15} /><span>Search</span><kbd>{mac ? '⌘' : 'Ctrl'} K</kbd>
          </button>
          <button className="motion-toggle mono" onClick={toggleMotion} aria-pressed={!reduced} title="Toggle animations">
            <span className={`motion-led ${reduced ? '' : 'on'}`} />{reduced ? 'MOTION OFF' : 'MOTION ON'}
          </button>
          <button className="menu-trigger" onClick={() => setMenu(v => !v)} aria-expanded={menu} aria-controls="mobile-menu" aria-label={menu ? 'Close menu' : 'Open menu'}>
            {menu ? <X size={20} /> : <span className="burger"><i /><i /></span>}
          </button>
        </div>
      </motion.header>
      <AnimatePresence>
        {menu && (
          <motion.div id="mobile-menu" className="mobile-menu" initial={{ clipPath: 'inset(0 0 100% 0)' }} animate={{ clipPath: 'inset(0 0 0% 0)' }} exit={{ clipPath: 'inset(0 0 100% 0)' }} transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1] }}>
            <nav aria-label="Mobile navigation">
              {LINKS.map((l, i) => (
                <motion.div key={l.href} initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.25 + i * 0.06, duration: 0.7 }}>
                  <NavLink href={href(l.href)} onClick={() => setMenu(false)}><span className="mono">0{i + 1}</span>{l.label}</NavLink>
                </motion.div>
              ))}
            </nav>
            <motion.nav className="mobile-wings" aria-label="More wings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
              {WINGS.map(w => <Link key={w.href} href={w.href} onClick={() => setMenu(false)}>{w.label}</Link>)}
            </motion.nav>
            <div className="mobile-menu-foot mono">
              <button onClick={() => { setMenu(false); onSearch(); }}><Search size={14} /> SEARCH THE ARCHIVE</button>
              <button onClick={toggleMotion}>{reduced ? 'MOTION OFF' : 'MOTION ON'}</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
