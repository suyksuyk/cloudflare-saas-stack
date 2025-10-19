const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 手动构建 Cloudflare Pages 部署文件...');

// 1. 清理旧的构建文件
if (fs.existsSync('.vercel')) {
  fs.rmSync('.vercel', { recursive: true, force: true });
}
if (fs.existsSync('.next')) {
  fs.rmSync('.next', { recursive: true, force: true });
}

// 2. 运行 Next.js 构建
console.log('📦 运行 Next.js 构建...');
execSync('bun run build', { stdio: 'inherit' });

// 3. 创建 .vercel/output/static 目录结构
console.log('📁 创建输出目录结构...');
fs.mkdirSync('.vercel/output/static', { recursive: true });

// 4. 复制静态文件
console.log('📋 复制静态文件...');
function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// 复制 public 目录
if (fs.existsSync('public')) {
  copyDir('public', '.vercel/output/static');
}

// 复制 .next/static 目录
if (fs.existsSync('.next/static')) {
  copyDir('.next/static', '.vercel/output/static/_next/static');
}

// 5. 复制构建的文件
console.log('📄 复制构建文件...');
const buildFiles = [
  '.next/static/chunks',
  '.next/static/media',
  '.next/static/webpack'
];

for (const file of buildFiles) {
  if (fs.existsSync(file)) {
    const destPath = file.replace('.next/static', '.vercel/output/static/_next/static');
    copyDir(file, destPath);
  }
}

// 6. 创建 _routes.json
console.log('🛣️ 创建路由配置...');
const routesConfig = {
  version: 1,
  include: ["/*"],
  exclude: ["/_next/static/*"]
};
fs.writeFileSync('.vercel/output/_routes.json', JSON.stringify(routesConfig, null, 2));

// 7. 创建 worker.js 文件
console.log('⚡ 创建 Worker 文件...');
const workerCode = `
import { getPlatformProxy } from 'wrangler';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // 处理静态文件
    if (url.pathname.startsWith('/_next/static/') || 
        url.pathname.startsWith('/favicon.ico') ||
        url.pathname === '/robots.txt') {
      return env.ASSETS.fetch(request);
    }
    
    // 处理 API 路由
    if (url.pathname.startsWith('/api/')) {
      // 这里会由 Cloudflare Pages Functions 处理
      return new Response('Not Found', { status: 404 });
    }
    
    // 处理页面路由
    try {
      return await env.ASSETS.fetch(request);
    } catch (error) {
      return new Response('Page not found', { status: 404 });
    }
  }
};
`;
fs.writeFileSync('.vercel/output/static/_worker.js', workerCode);

console.log('✅ 构建完成！输出目录：.vercel/output/static');
