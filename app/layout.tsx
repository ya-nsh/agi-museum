import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata={title:'AGI Museum — A history still being written',description:'Explore the history of artificial intelligence, e/acc, alignment, and the race toward AGI. A sourced interactive exhibition, 1950–September 9, 2026.',icons:{icon:'/favicon.svg'}};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
