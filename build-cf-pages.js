const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Cloudflare Pages 构建脚本...');

// 1. 清理旧的构建文件
if (fs.existsSync('.vercel')) {
  fs.rmSync('.vercel', { recursive: true, force: true });
}
if (fs.existsSync('.next')) {
  fs.rmSync('.next', { recursive: true, force: true });
}

// 2. 重新生成 lockfile
console.log('📦 重新生成依赖锁文件...');
try {
  execSync('rm -f bun.lockb', { stdio: 'inherit' });
  execSync('bun install', { stdio: 'inherit' });
} catch (error) {
  console.log('⚠️ 依赖安装失败，尝试使用 npm...');
  execSync('npm install', { stdio: 'inherit' });
}

// 3. 运行 Next.js 构建
console.log('🏗️ 运行 Next.js 构建...');
try {
  execSync('bun run build', { stdio: 'inherit' });
} catch (error) {
  console.log('⚠️ bun 构建失败，尝试使用 npm...');
  execSync('npm run build', { stdio: 'inherit' });
}

// 4. 创建 .vercel/output/static 目录结构
console.log('📁 创建输出目录结构...');
fs.mkdirSync('.vercel/output/static', { recursive: true });

// 5. 复制静态文件
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

// 6. 复制构建的文件
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

// 7. 创建 _routes.json
console.log('🛣️ 创建路由配置...');
const routesConfig = {
  version: 1,
  include: ["/*"],
  exclude: ["/_next/static/*"]
};
fs.writeFileSync('.vercel/output/_routes.json', JSON.stringify(routesConfig, null, 2));

console.log('✅ 构建完成！输出目录：.vercel/output/static');
