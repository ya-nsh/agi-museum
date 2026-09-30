'use client';

import { motion } from 'motion/react';
import { useEffect, useState } from 'react';

// The landing page has its own intro; only in-app navigations lift a curtain.
// The flag flips after the first mount, so server and hydration renders agree.
let navigated = false;

export default function Template({ children }: { children: React.ReactNode }) {
  const [curtain] = useState(() => typeof window !== 'undefined' && navigated);
  useEffect(() => { navigated = true; }, []);
  return (
    <>
      {curtain && (
        <motion.div className="route-curtain" aria-hidden="true" initial={{ clipPath: 'inset(0 0 0% 0)' }} animate={{ clipPath: 'inset(0 0 100% 0)' }} transition={{ duration: 0.9, delay: 0.1, ease: [0.76, 0, 0.24, 1] }}>
          <motion.span className="serif" initial={{ opacity: 1, y: 0 }} animate={{ opacity: 0, y: -30 }} transition={{ duration: 0.5 }}>AGI <em>Museum</em></motion.span>
        </motion.div>
      )}
      <motion.div initial={curtain ? { opacity: 0 } : false} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.25 }}>
        {children}
      </motion.div>
    </>
  );
}
