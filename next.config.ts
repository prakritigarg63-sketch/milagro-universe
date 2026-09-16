import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Dev-only. Next blocks dev chunk requests from any host but the one you
   * started on, so the planner cannot be exercised over the LAN or on a second
   * loopback name. Both entries are loopback or private-network addresses and
   * this key has no effect on a production build.
   */
  allowedDevOrigins: ["127.0.0.1", "192.168.1.36"],

  images: {
    // Google serves profile pictures from this host. Listing it explicitly
    // keeps next/image from becoming an open proxy for arbitrary URLs.
    remotePatterns: [{ protocol: "https", hostname: "lh3.googleusercontent.com" }],
  },
};

export default nextConfig;
