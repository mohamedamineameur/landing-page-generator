import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["sequelize", "pg", "pg-hstore"],
};

export default nextConfig;
