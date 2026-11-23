// Disable Turbopack to avoid font module resolution errors
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Turn off the experimental Turbopack bundler (use Webpack instead)
    turbopack: false,
  },
};
module.exports = nextConfig;
