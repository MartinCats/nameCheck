import type { NextConfig } from "next";

const lanDevOrigins = [
  "localhost",
  "*.localhost",
  "127.0.0.1",
  "192.168.*.*",
  "10.*.*.*",
  "172.*.*.*",
  ...(process.env.NEXT_ALLOWED_DEV_ORIGINS?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean) ?? []),
];

const nextConfig: NextConfig = {
  allowedDevOrigins: lanDevOrigins,
  experimental: {
    serverActions: {
      allowedOrigins: lanDevOrigins,
    },
  },
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
