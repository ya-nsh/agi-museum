# AGI Museum

An interactive, source-backed museum of the path toward artificial general intelligence, effective accelerationism, alignment, and AI governance. Curated through **September 9, 2026**. L## Experience

- **99 sourced exhibits** across six chronological galleries, from McCulloch and Pitts (1943) to the September 2026 claims.
- **Hero artwork, generated live:** an 80-column IBM punch card folds into a rotating neural sphere with signals travelling along its edges; it bends away from the cursor.
- **Six galleries** on a pinned horizontal walk, each with an essay, a dated constellation of its exhibits, and thread proportions.
- **The permanent collection:** filter by gallery, thread, evidence type or text; grid or list layouts; animated re-ordering.
- **Exhibit dialogs** with a generative accession sigil unique to every object, related exhibits, keyboard ←/→ navigation and copyable links. `#exhibit-07` deep links still open the dialog.
- **A page for every exhibit** at `/exhibit/exhibit-NN`, statically generated with its own metadata.
- **The shape of the archive:** every exhibit as a block in its year.
- **The compute climb:** training compute of 540 notable models from Epoch AI, with fitted growth rates (≈4.3× per year since 2010).
- **The great debate** as an interpretive map of six perspectives by pace and where power sits.
- **Where do you stand?** at `/stand`: eight statements place the visitor on the same debate map, with the path their answers traced, closeness to each perspective, a shareable `#r=…` link and a downloadable result card. Answers never leave the browser.
- **The workshop** at `/workshop`: six hands-on specimens that run in the browser. Wire a McCulloch–Pitts neuron, train a perceptron (and watch it fail on XOR), talk to a reconstruction of ELIZA with its rules exposed, sit in the Chinese Room, watch backpropagation learn, and teach a reward model your taste until over-optimization turns into reward hacking. Each specimen also appears on its exhibit page and says what it simplifies.
- **The time machine** at `/time-machine`: pick any month from 1943 to September 2026 and see only what had happened, the largest training run on record, which debate perspectives had appeared, the newest prediction and how many exhibits were still in the future. Shareable as `#YYYY-MM`.
- **Who’s who** at `/people`, with a page for every person and institution: lifelines of recurring names across the collection, an A–Z index, and who was credited alongside whom. Credits on every exhibit link here.
- **Pendants** at `/pairs`: exhibits from different decades hung side by side, with what changed and what did not. Each pair also hangs on both exhibit pages.
- **The gift shop** at `/shop`: free 2400 × 3200 accession posters for any exhibit, postcards for each gallery and a printable one-page pocket timeline at `/shop/handout`.
- **The visitor passport** at `/passport`: stamps for galleries and wings, kept in the browser, with a header badge, toasts when a stamp is earned and a downloadable ticket stub.
- **On this day:** a home page placard for anniversaries in the collection, or the next one, with a strip of the month's dated exhibits.
- **The reading room:** evidence labels, glossary and curators’ note.
- **`/timeline`:** the complete chronology on a paper-toned reading layout with a scroll-drawn spine, chapter progress and thread highlighting.
- **⌘K / Ctrl+K or `/`** searches the entire collection from any page.
- **Guided tour** in the exhibit dialog (button or Space) autoplays through the chronology; swipe left/right on touch screens; “Surprise me” jumps to a random exhibit.
- **Wayfinding:** scroll-spy header and section index, a sticky filter bar with a plain-language summary, a back-to-top ring, a “now reading” year counter on the timeline, and a curtain transition between pages.
- Smooth scrolling, a custom cursor and a one-per-session intro. The header’s motion switch and the OS reduced-motion setting turn all of it off.

port, and reduced-motion preferences.

## Run

Requires Node.js 22.13 or newer.

```sh
npm ci
npm run dev
```

## Production

```sh
npm run build
```

This is a **Next.js 16 App Router** application with React 19 and TypeScript. Motion powers the animations, Lenis the smooth scrolling, Radix the accessible dialogs, and Lucide the icons. Type is set in Newsreader (display, self-hosted from `app/fonts/` under the SIL Open Font License), Schibsted Grotesk (text) and IBM Plex Mono (labels). `next build --webpack` produces a static export in `out/` (webpack, because Turbopack's output is larger for this app). Deploy that directory to a static host, or import the repository into a Next.js-compatible host. No API keys or runtime backend are required.

`npm start` serves the built export locally on port 3000 (or the `PORT` environment variable) the way a static host would, with gzip and long-lived caching for hashed assets, so it is fine for performance checks.

### Performance notes

- Nothing visible waits for JavaScript. The intro curtain (`.preloader`) and above-the-fold entrances (`.enter`, `RevealLines play`) are CSS animations that start at first paint; an inline head script decides whether the intro plays. Each page's lead paragraph is painted as-is, because it is the largest contentful paint.
- Exhibit, person and pocket-timeline pages are server components with small client islands (`components/museum/site-chrome.tsx`).
- The search dialog and the home page's exhibit dialog are separate chunks, warmed when the browser is idle.
- Images are pre-encoded at two widths as AVIF/WebP and served through `<Art>` (`components/museum/art.tsx`) with `srcset`; only the image that leads a page is fetched eagerly.
- Smooth scrolling only runs `requestAnimationFrame` while a glide is in progress, so idle pages stay idle.

## Content and editorial policy

Edit `data/events.ts` (the original timeline), `data/science-events.ts` and `data/foundations-events.ts` (exhibits 69–99: foundations, AI winters, and the research behind modern models). Accession numbers are append-only so exhibit links never break. Galleries live in `eras` in `data/events.ts`; debate perspectives in `data/perspectives.ts`; compute data in `data/compute.ts`. Dates may identify a year or month rather than a specific day. Each event distinguishes historical events, research findings, forecasts/philosophy, and company claims. Original-source links travel with the event. The collection is a selection of consequential milestones, not an exhaustive catalog of all AI research. AGI-era rhetoric is not presented as universal scientific consensus. Live sources can change after the collection cutoff.

The dataset preserves the original 51-entry researched timeline, 17 science and mathematics exhibits, and 31 foundations exhibits, including its September 9 concluding exhibit. No analytics, credentials, personal information, or tracking are embedded.

## Image credit

`public/alan-turing.jpg`: Alan Turing, aged 16, circa 1928–1929. Photographer possibly Arthur Reginald Chaffin. Turing Digital Archive / Wikimedia Commons. Public domain. The portrait predates the 1950 exhibit it illustrates.

Source: https://commons.wikimedia.org/wiki/File:Alan_Turing_Aged_16.jpg

## GitHub

Source repository: https://github.com/ya-nsh/agi-museum


## Generated artwork

`public/intelligence-gallery.png` was created using built-in ImageGen as conceptual contemporary museum artwork, not an archival photograph. It appears on the homepage expansion banner and the `/timeline` hero, served as `intelligence-gallery-{768,1536}.{avif,webp}`; `public/og.jpg` is a 1200 × 630 crop used for link previews. The originals stay in `public/` for credit and old links. To re-encode after replacing an original:

```sh
sips -s format png --resampleWidth 1536 public/intelligence-gallery.png --out /tmp/g.png
cwebp -q 72 -m 6 /tmp/g.png -o public/intelligence-gallery-1536.webp
avifenc -q 55 -s 4 /tmp/g.png public/intelligence-gallery-1536.avif
```

Prompt: A luminous pale chartreuse filament crossing a dark architectural gallery, transitioning from tactile ivory punched paper and glass vacuum tubes on the left into an elegant suspended crystalline neural sculpture on the right. Premium contemporary museum installation photograph, cinematic still life; landscape 1536×1024; charcoal black #131411, restrained chartreuse #d5f68b, ivory and silver; dramatic volumetric light; no text, logos, UI or watermark.

Science expansion: primary-source entries cover algorithm discovery, geometry and formal proofs, molecular and genomic prediction, weather, materials, and research agents. The September 8, 2026 Navier–Stokes and Euler announcements are labeled company claims with their scope and verification limits. Existing accession IDs are preserved; both views share the chronologically sorted dataset.

## Compute data

`data/compute.ts` is derived from Epoch AI’s Notable AI Models dataset (https://epoch.ai/data/notable-ai-models), retrieved 30 September 2026: publication date and training compute for every model with a compute estimate. Growth rates shown on the site are least-squares fits over those points. Many recent values are Epoch AI estimates labeled Likely or Speculative.
