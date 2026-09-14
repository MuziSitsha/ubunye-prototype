import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keeps the dev-only "N" indicator badge off screen during live walkthroughs run via
  // `npm run dev` — it isn't part of the app and doesn't appear in a production build,
  // but it overlaps the bottom nav / sticky CTAs during a demo, so switch it off outright.
  devIndicators: false,
};

export default nextConfig;
