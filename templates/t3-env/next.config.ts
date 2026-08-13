import { existsSync } from "node:fs";

import "./src/env";

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  ...(existsSync("Dockerfile") ? { output: "standalone" as const } : {}),
  transpilePackages: ["@t3-oss/env-nextjs", "@t3-oss/env-core"],
};

export default nextConfig;
