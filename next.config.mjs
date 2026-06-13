import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack(config) {
    config.module.rules.push({
      test: /src[\\/]app[\\/]page\.tsx$/,
      enforce: "pre",
      use: [path.join(__dirname, "src/build/pr27-ui-replacements.cjs")]
    });

    return config;
  }
};

export default nextConfig;
