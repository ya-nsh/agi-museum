import type { NextConfig } from 'next';

// A fully static export: every page, exhibit and person is prerendered into out/.
// Images are pre-encoded (WebP/AVIF at several widths) in public/, so the
// runtime image optimizer is not needed.
const nextConfig: NextConfig = { output: 'export', images: { unoptimized: true } };

export default nextConfig;
