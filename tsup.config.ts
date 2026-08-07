import path from "path";
import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs"],
  platform: "node",
  target: "node18",
  minify: true,
  clean: true,
  sourcemap: false,
  shims: true,
  esbuildOptions(options) {
    options.alias = {
      "~": path.resolve(__dirname, "src"),
    };
  },
});
