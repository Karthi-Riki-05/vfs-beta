import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',

  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      config.watchOptions = {
        poll: 1000,           // Check for changes every second
        aggregateTimeout: 300, // Wait a bit after a change before rebuilding
      };
    }
    return config;
  },

  // Note: If you want to use Turbopack in the future,
  // adding an empty turbopack config silences the runtime error when a custom
  // webpack config is present while Turbopack is enabled by default.
  turbopack: {},
};

export default nextConfig;