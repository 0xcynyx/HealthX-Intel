/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Type-checking still runs at build (we want it). ESLint isn't wired up in
  // this minimal app, so don't let an absent config block `next build`.
  eslint: { ignoreDuringBuilds: true },
  // X profile images are served from twimg CDNs. We render them with plain
  // <img> (no next/image optimizer) to keep the app dependency-free, but list
  // the hosts here too in case next/image is introduced later.
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'pbs.twimg.com' },
      { protocol: 'https', hostname: 'abs.twimg.com' },
    ],
  },
};

export default nextConfig;
