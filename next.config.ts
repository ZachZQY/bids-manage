import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // 在生产构建时忽略 ESLint 错误
    ignoreDuringBuilds: true,
  },
  // 添加生产环境配置
  output: 'standalone',
  poweredByHeader: false,
  // 如果您的站点不在域名根路径下，可以取消下面这行的注释并设置正确的基础路径
  // basePath: '',
};

export default nextConfig;
