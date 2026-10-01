'use client';

import { Printer } from 'lucide-react';
import { useEffect } from 'react';
import { passport } from '@/lib/passport';

/** Prints the sheet; printing it (from here or the browser menu) earns the gift shop stamp. */
export function PrintButton() {
  useEffect(() => {
    const onPrint = () => passport.mark('shop');
    addEventListener('beforeprint', onPrint);
    return () => removeEventListener('beforeprint', onPrint);
  }, []);
  return <button className="icon-btn active" onClick={() => print()}><Printer size={15} />Print or save as PDF</button>;
}
