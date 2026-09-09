# AGI Museum

An interactive, source-backed museum of the path toward artificial general intelligence, effective accelerationism, alignment, and AI governance. Curated through **September 9, 2026**.

## Experience

- Five chronological galleries with 51 sourced exhibits.
- Dedicated `/timeline` page: all 51 entries in a continuous vertical column, complete context and sources, sticky chapter navigation, scroll reveals and reading progress.
- Homepage “Expand the timeline” link with original ImageGen artwork.
- Search across the whole archive and filter by technology, ideas, institutions, or governance.
- Animated exhibit transitions, horizontal galleries, guided playback, timeline scrubber, and previous/next navigation.
- Detailed exhibits with people, significance, evidence classification, and original sources.
- Six interactive perspectives on the acceleration debate.
- Shareable exhibit URL fragments, accessible dialogs, keyboard navigation, touch support, and reduced-motion preferences.

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

This is a **Next.js 16 App Router** application with React 19, TypeScript, Tailwind CSS 4, Lucide icons, and Radix dialog/slider primitives. The native Next.js build produces a static export in `out/`. Deploy that directory to a static host, or import the repository into a Next.js-compatible host. No API keys or runtime backend are required.

Some infrastructure files from the Sites starter are retained for compatibility; the application build uses native `next build --webpack`, not Vinext. `npm start` serves the built static export locally on port 3000 (or the `PORT` environment variable).

## Content and editorial policy

Edit `data/events.ts`. Dates may identify a year or month rather than a specific day. Each event distinguishes historical events, research findings, forecasts/philosophy, and company claims. Original-source links travel with the event. The collection is a selection of consequential milestones, not an exhaustive catalog of all AI research. AGI-era rhetoric is not presented as universal scientific consensus. Live sources can change after the collection cutoff.

The dataset preserves the complete 51-entry researched timeline, including its September 9 concluding exhibit. No analytics, credentials, personal information, or tracking are embedded.

## Image credit

`public/alan-turing.jpg`: Alan Turing, aged 16, circa 1928–1929. Photographer possibly Arthur Reginald Chaffin. Turing Digital Archive / Wikimedia Commons. Public domain. The portrait predates the 1950 exhibit it illustrates.

Source: https://commons.wikimedia.org/wiki/File:Alan_Turing_Aged_16.jpg

## GitHub

Source repository: https://github.com/ya-nsh/agi-museum


## Generated artwork

`public/intelligence-gallery.png` was created using built-in ImageGen as conceptual contemporary museum artwork, not an archival photograph. It appears on the homepage expansion banner and the `/timeline` hero.

Prompt: A luminous pale chartreuse filament crossing a dark architectural gallery, transitioning from tactile ivory punched paper and glass vacuum tubes on the left into an elegant suspended crystalline neural sculpture on the right. Premium contemporary museum installation photograph, cinematic still life; landscape 1536×1024; charcoal black #131411, restrained chartreuse #d5f68b, ivory and silver; dramatic volumetric light; no text, logos, UI or watermark.
