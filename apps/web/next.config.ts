import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  devIndicators: false,
  ...(process.env.GULO_BROWSER_TEST === "1"
    ? {
        distDir: ".next-e2e",
        typescript: { tsconfigPath: "tsconfig.e2e.json" },
      }
    : {}),
};

export default nextConfig;
