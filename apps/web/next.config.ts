import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default nextConfig;

// Enables Cloudflare bindings (R2, KV, etc.) inside `next dev`.
initOpenNextCloudflareForDev();
