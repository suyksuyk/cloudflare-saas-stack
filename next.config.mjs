import { setupDevPlatform } from '@cloudflare/next-on-pages/next-dev';

// Here we use the @cloudflare/next-on-pages next-dev module to allow us to use bindings during local development
// (when running the application with `next dev`), for more information see:
// https://github.com/cloudflare/next-on-pages/blob/main/internal-packages/next-dev/README.md
if (process.env.NODE_ENV === 'development') {
  await setupDevPlatform();
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 禁用 webpack 缓存以避免 Cloudflare Pages 文件大小限制
  webpack: (config, { isServer, dev }) => {
    if (isServer) {
      config.cache = false;
      // 修复 async_hooks 问题 - 在生产环境中排除 Node.js 内置模块
      if (!dev) {
        config.externals = config.externals || [];
        config.externals.push({
          'async_hooks': 'commonjs async_hooks'
        });
      }
    }
    return config;
  },
  // Cloudflare Pages 优化配置
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // 减少构建输出大小
  swcMinify: true,
  // 禁用某些优化以减小文件大小
  experimental: {
    optimizeCss: false,
  },
};

export default nextConfig;
