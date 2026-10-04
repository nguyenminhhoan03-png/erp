import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: {
    position: "bottom-right",
  },
  allowedDevOrigins: [
    "192.168.2.8",
    "192.168.*.*",
    "localhost:3000",
    "*.loca.lt",
  ],
};

export default nextConfig;
