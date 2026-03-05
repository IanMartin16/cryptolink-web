import type { NextConfig } from "next";

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/v1/:path*",
        destination: "https://cryptolink-production.up.railway.app/v1/:path*",
      },
    ];
  },  
};

module.exports = nextConfig;
