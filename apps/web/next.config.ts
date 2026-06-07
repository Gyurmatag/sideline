import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  webpack: (config, { webpack }) => {
    // better-auth's kysely-adapter lazily `import()`s node/bun/d1 sqlite dialects
    // that statically import kysely migration constants webpack can't follow via
    // `export *`. We pass our own kysely-d1 D1Dialect (the "dialect" branch returns
    // early), so these alternate dialects are never used at runtime — ignore them
    // so webpack doesn't try to bundle their unresolved imports.
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /(node|bun|d1)-sqlite-dialect/,
      })
    );
    return config;
  },
};

export default nextConfig;

// Enables Cloudflare bindings (R2, KV, etc.) inside `next dev`.
initOpenNextCloudflareForDev();
