'use client';

import { motion } from 'motion/react';
import { useEffect, useState } from 'react';

// The landing page has its own intro; only in-app navigations lift a curtain.
// The flag flips after the first mount, so server and hydration renders agree.
// The new page renders straight away underneath, so the curtain only ever
// covers it for as long as it takes to lift. Reduced motion (data-motion, kept
// by <Providers>) skips it; the template also wraps Next's global error page,
// which renders outside the providers, so it reads the attribute directly.
let navigated = false;

export default function Template({ children }: { children: React.ReactNode }) {
  const [curtain] = useState(() => typeof window !== 'undefined' && navigated && document.documentElement.dataset.motion !== 'reduced');
  useEffect(() => { navigated = true; }, []);
  return (
    <>
      {curtain && (
        <motion.div className="route-curtain" aria-hidden="true" initial={{ clipPath: 'inset(0 0 0% 0)' }} animate={{ clipPath: 'inset(0 0 100% 0)' }} transition={{ duration: 0.6, ease: [0.76, 0, 0.24, 1] }}>
          <motion.span className="serif" initial={{ opacity: 1, y: 0 }} animate={{ opacity: 0, y: -30 }} transition={{ duration: 0.35 }}>AGI <em>Museum</em></motion.span>
        </motion.div>
      )}
      {children}
    </>
  );
}
