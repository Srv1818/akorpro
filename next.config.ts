import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/tum-sarkilar", destination: "/gitar-akorlari", permanent: true },
      { source: "/sarkilar", destination: "/gitar-akorlari", permanent: true },
    ];
  },
};

export default nextConfig;
