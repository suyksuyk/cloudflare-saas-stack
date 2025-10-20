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
  webpack: (config, { isServer, dev, webpack }) => {
    if (isServer) {
      config.cache = false;
      
      // 精确的 async_hooks 修复 - 只处理有问题的模块
      config.externals = config.externals || [];
      
      // 只排除在 Cloudflare Pages 中不支持的模块
      const unsupportedModules = [
        'async_hooks',
        'worker_threads',
        'cluster',
        'child_process'
      ];
      
      unsupportedModules.forEach(module => {
        config.externals.push({
          [module]: `commonjs ${module}`
        });
      });
      
      // 在生产环境中添加 IgnorePlugin 来完全忽略 async_hooks
      if (!dev) {
        config.plugins.push(
          new webpack.IgnorePlugin({
            resourceRegExp: /^async_hooks$/
          })
        );
      }
      
      // 添加 resolve 配置来处理模块解析
      config.resolve = config.resolve || {};
      config.resolve.fallback = {
        ...config.resolve.fallback,
        async_hooks: false,
        worker_threads: false,
        cluster: false,
        child_process: false
      };
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
  // 添加环境变量来控制构建行为
  env: {
    NEXT_BUILD_WORKERS: 'true',
    NEXT_DISABLE_SOURCEMAPS: 'true'
  },
};

export default nextConfig;
