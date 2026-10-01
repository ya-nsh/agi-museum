import type { ComponentType, CSSProperties } from 'react';

// The two pieces of artwork, pre-encoded at several widths in public/ (the
// static export has no image optimizer). The originals stay in public/ for
// credit links and old shares, but pages only ever request these variants.
const ART = {
  gallery: { base: '/intelligence-gallery', widths: [768, 1536], avif: true, width: 1536, height: 1024 },
  turing: { base: '/alan-turing', widths: [400, 675], avif: false, width: 675, height: 919 },
} as const;

/** Where the Turing portrait comes from (public domain). */
export const TURING_CREDIT = 'https://commons.wikimedia.org/wiki/File:Alan_Turing_Aged_16.jpg';

/** The props <Art> hands its image; `S` is the style type (CSS, or motion values). */
type ArtImgProps<S> = {
  className?: string; src: string; srcSet: string; sizes: string; alt: string; width: number; height: number;
  loading: 'eager' | 'lazy'; decoding: 'async'; fetchPriority?: 'high'; style?: S;
};

/**
 * A responsive <picture> for one of the museum's artworks. Below-the-fold art is
 * lazy by default; pass `priority` only for the image that leads a page.
 */
export function Art<S = CSSProperties>({ name, alt, sizes, className, priority = false, img: Img = 'img', style }: {
  name: keyof typeof ART;
  alt: string;
  /** The rendered width, as an <img sizes> value. */
  sizes: string;
  className?: string;
  priority?: boolean;
  /** Swap in an animated image component (e.g. motion.img). */
  img?: 'img' | ComponentType<ArtImgProps<S>>;
  style?: S;
}) {
  const a = ART[name];
  const set = (ext: string) => a.widths.map(w => `${a.base}-${w}.${ext} ${w}w`).join(', ');
  const largest = a.widths[a.widths.length - 1];
  return (
    <picture>
      {a.avif && <source type="image/avif" srcSet={set('avif')} sizes={sizes} />}
      <Img className={className} src={`${a.base}-${largest}.webp`} srcSet={set('webp')} sizes={sizes} alt={alt}
        width={a.width} height={a.height} loading={priority ? 'eager' : 'lazy'} decoding="async"
        fetchPriority={priority ? 'high' : undefined} style={style as CSSProperties & S} />
    </picture>
  );
}
