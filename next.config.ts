import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    /**
     * Turbopack's persistent build cache records build-environment variables
     * with their values so it can invalidate when they change, which writes
     * GITHUB_TOKEN to disk in .next/cache/turbopack/*.sst and trips Netlify's
     * secrets scanning. It happens regardless of whether the application reads
     * the variable, so it cannot be avoided in application code.
     *
     * Disabling the filesystem cache stops the directory being written at all.
     * The cost is losing incremental rebuild caching; this project compiles in
     * a few seconds, so that is not a meaningful trade.
     *
     * Enabled by default as of Next 16.2, which is why builds on 16.0 never hit
     * this.
     */
    turbopackFileSystemCacheForBuild: false,
  },
};

export default nextConfig;
