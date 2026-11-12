import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/SISTEMA-DE-REGISTRO-DE-EQUIPOS",
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;