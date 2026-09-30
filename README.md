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

This is a **Next.js 16 App Router** application with React 19 and TypeScript. Motion powers the animations, Lenis the smooth scrolling, Radix the accessible dialogs, and Lucide the icons. Type is set in Newsreader (display), Schibsted Grotesk (text) and IBM Plex Mono (labels). The native Next.js build produces a static export in `out/`. Deploy that directory to a static host, or import the repository into a Next.js-compatible host. No API keys or runtime backend are required.

Some infrastructure files from the Sites starter are retained for compatibility; the application build uses native `next build --webpack`, not Vinext. `npm start` serves the built static export locally on port 3000 (or the `PORT` environment variable).

## Content and editorial policy

Edit `data/events.ts` (the original timeline), `data/science-events.ts` and `data/foundations-events.ts` (exhibits 69–99: foundations, AI winters, and the research behind modern models). Accession numbers are append-only so exhibit links never break. Galleries live in `eras` in `data/events.ts`; debate perspectives in `data/perspectives.ts`; compute data in `data/compute.ts`. Dates may identify a year or month rather than a specific day. Each event distinguishes historical events, research findings, forecasts/philosophy, and company claims. Original-source links travel with the event. The collection is a selection of consequential milestones, not an exhaustive catalog of all AI research. AGI-era rhetoric is not presented as universal scientific consensus. Live sources can change after the collection cutoff.

The dataset preserves the original 51-entry researched timeline, 17 science and mathematics exhibits, and 31 foundations exhibits, including its September 9 concluding exhibit. No analytics, credentials, personal information, or tracking are embedded.

## Image credit

`public/alan-turing.jpg`: Alan Turing, aged 16, circa 1928–1929. Photographer possibly Arthur Reginald Chaffin. Turing Digital Archive / Wikimedia Commons. Public domain. The portrait predates the 1950 exhibit it illustrates.

Source: https://commons.wikimedia.org/wiki/File:Alan_Turing_Aged_16.jpg

## GitHub

Source repository: https://github.com/ya-nsh/agi-museum


## Generated artwork

`public/intelligence-gallery.png` was created using built-in ImageGen as conceptual contemporary museum artwork, not an archival photograph. It appears on the homepage expansion banner and the `/timeline` hero.

Prompt: A luminous pale chartreuse filament crossing a dark architectural gallery, transitioning from tactile ivory punched paper and glass vacuum tubes on the left into an elegant suspended crystalline neural sculpture on the right. Premium contemporary museum installation photograph, cinematic still life; landscape 1536×1024; charcoal black #131411, restrained chartreuse #d5f68b, ivory and silver; dramatic volumetric light; no text, logos, UI or watermark.

Science expansion: primary-source entries cover algorithm discovery, geometry and formal proofs, molecular and genomic prediction, weather, materials, and research agents. The September 8, 2026 Navier–Stokes and Euler announcements are labeled company claims with their scope and verification limits. Existing accession IDs are preserved; both views share the chronologically sorted dataset.

## Compute data

`data/compute.ts` is derived from Epoch AI’s Notable AI Models dataset (https://epoch.ai/data/notable-ai-models), retrieved 30 September 2026: publication date and training compute for every model with a compute estimate. Growth rates shown on the site are least-squares fits over those points. Many recent values are Epoch AI estimates labeled Likely or Speculative.
