import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  // Escape hatch for sandboxes where the native SWC binary cannot run
  // (e.g. CI containers). Unset in normal dev/Vercel builds.
  ...(process.env.NEXT_USE_WASM === "1"
    ? { experimental: { useWasmBinary: true } }
    : {}),
};

export default nextConfig;
