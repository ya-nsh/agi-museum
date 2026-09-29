'use client';

import { useEffect, useState } from 'react';

/** The id of the section currently crossing the middle of the viewport. */
export function useActiveSection(ids: string[]) {
  const [active, setActive] = useState<string | null>(null);
  const key = ids.join('|');
  useEffect(() => {
    const els = key.split('|').map(id => document.getElementById(id)).filter((el): el is HTMLElement => !!el);
    const visible = new Map<string, boolean>();
    const io = new IntersectionObserver(entries => {
      for (const e of entries) visible.set(e.target.id, e.isIntersecting);
      setActive(els.find(el => visible.get(el.id))?.id ?? null);
    }, { rootMargin: '-45% 0px -54% 0px' });
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, [key]);
  return active;
}
