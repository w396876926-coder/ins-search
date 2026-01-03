import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 1. 让 Vercel 忽略 TypeScript 类型错误
  typescript: {
    ignoreBuildErrors: true,
  },
  // 2. 让 Vercel 忽略代码格式检查
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;