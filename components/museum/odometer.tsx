/** Digits that roll into place, like a mechanical counter. */
export function Odometer({ value, className }: { value: number | string; className?: string }) {
  const chars = String(value).split('');
  return (
    <span className={`odometer ${className ?? ''}`} aria-label={String(value)} role="img">
      {chars.map((c, i) => /\d/.test(c) ? (
        <span className="odo-digit" key={chars.length - i} aria-hidden="true">
          <span className="odo-strip" style={{ transform: `translateY(${-Number(c) * 10}%)` }}>
            {'0123456789'.split('').map(d => <span key={d}>{d}</span>)}
          </span>
        </span>
      ) : <span key={chars.length - i} aria-hidden="true">{c}</span>)}
    </span>
  );
}
