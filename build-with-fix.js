#!/usr/bin/env node

/**
 * 专门用于 Cloudflare Pages 的构建脚本
 * 解决 async_hooks 构建错误问题
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 开始 Cloudflare Pages 构建...');

// 设置环境变量
process.env.NODE_ENV = 'production';
process.env.NEXT_TELEMETRY_DISABLED = '1';
process.env.NEXT_BUILD_WORKERS = 'true';
process.env.NEXT_DISABLE_SOURCEMAPS = '1';

// 清理构建目录
console.log('🧹 清理构建缓存...');
const dirsToClean = ['.next', '.vercel', 'out'];
dirsToClean.forEach(dir => {
  const dirPath = path.join(process.cwd(), dir);
  if (fs.existsSync(dirPath)) {
    try {
      fs.rmSync(dirPath, { recursive: true, force: true });
      console.log(`✅ 已清理 ${dir} 目录`);
    } catch (error) {
      console.log(`⚠️  清理 ${dir} 目录失败: ${error.message}`);
    }
  }
});

// 创建临时的 next.config.mjs 文件，包含更强的修复
console.log('📝 应用 enhanced 配置...');
const originalConfigPath = path.join(process.cwd(), 'next.config.mjs');
const backupConfigPath = path.join(process.cwd(), 'next.config.mjs.backup');

if (fs.existsSync(originalConfigPath)) {
  fs.copyFileSync(originalConfigPath, backupConfigPath);
}

// 创建增强的配置文件
const enhancedConfig = `import { setupDevPlatform } from '@cloudflare/next-on-pages/next-dev';

// Here we use the @cloudflare/next-on-pages next-dev module to allow us to use bindings during local development
// (when running the application with \`next dev\`), for more information see:
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
          [module]: \`commonjs \${module}\`
        });
      });
      
      // 在生产环境中添加 IgnorePlugin 来完全忽略 async_hooks
      if (!dev) {
        config.plugins.push(
          new webpack.IgnorePlugin({
            resourceRegExp: /^async_hooks$/
          }),
          new webpack.IgnorePlugin({
            resourceRegExp: /^worker_threads$/
          }),
          new webpack.IgnorePlugin({
            resourceRegExp: /^cluster$/
          }),
          new webpack.IgnorePlugin({
            resourceRegExp: /^child_process$/
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
      
      // 添加额外的 externals 配置
      config.resolve.alias = {
        ...config.resolve.alias,
        'async_hooks': false,
        'worker_threads': false,
        'cluster': false,
        'child_process': false
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
`;

fs.writeFileSync(originalConfigPath, enhancedConfig);
console.log('✅ 已应用增强配置');

try {
  // 运行 Next.js 构建
  console.log('🏗️  运行 Next.js 构建...');
  execSync('npm run build', { 
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_OPTIONS: '--max-old-space-size=4096'
    }
  });
  
  console.log('✅ Next.js 构建成功');
  
  // 运行 Cloudflare Pages 构建
  console.log('⚡️ 运行 Cloudflare Pages 适配...');
  execSync('node build-cf-pages.js', { stdio: 'inherit' });
  
  console.log('🎉 构建完成！');
  
} catch (error) {
  console.error('❌ 构建失败:', error.message);
  process.exit(1);
} finally {
  // 恢复原始配置文件
  if (fs.existsSync(backupConfigPath)) {
    fs.copyFileSync(backupConfigPath, originalConfigPath);
    fs.unlinkSync(backupConfigPath);
    console.log('✅ 已恢复原始配置');
  }
}
