import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Load pdfkit as a native Node module so its __dirname-based font
  // metrics resolution works correctly. Without this, the bundler
  // rewrites __dirname to /ROOT and pdfkit can't find its .afm files.
  serverExternalPackages: ["pdfkit"],
};

export default nextConfig;
