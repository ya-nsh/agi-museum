import { firstYear, lastYear } from '@/lib/museum';

/**
 * Once per session: the years roll from the first exhibit to today, then the
 * curtain lifts. Entirely CSS (see .preloader in globals.css): it starts at
 * first paint, never waits for JavaScript, and stays hidden unless the head
 * script in app/layout.tsx chose to play it.
 */
export function Preloader() {
  return (
    <div className="preloader" aria-hidden="true" style={{ '--from': firstYear, '--to': lastYear } as React.CSSProperties}>
      <div className="preloader-top mono"><span>AGI MUSEUM</span><span>PERMANENT COLLECTION</span></div>
      <div className="preloader-year" />
      <div className="preloader-bottom">
        <span className="mono">OPENING THE ARCHIVE</span>
        <div className="preloader-bar"><span /></div>
        <span className="mono">{firstYear} — {lastYear}</span>
      </div>
    </div>
  );
}
