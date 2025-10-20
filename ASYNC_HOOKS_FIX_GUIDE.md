# async_hooks 构建错误修复指南

## 问题描述

在 Cloudflare Pages 构建过程中遇到以下错误：
```
✘ [ERROR] Could not resolve "async_hooks"
The package "async_hooks" wasn't found on the file system but is built into node. Are you trying to bundle for node? You can use "platform: 'node'" to do that, which will remove this error.
```

## 错误原因分析

1. **根本原因**：NextAuth 在构建过程中使用了 Node.js 内置的 `async_hooks` 模块
2. **环境冲突**：Cloudflare Pages 的边缘运行时不支持 Node.js 的 `async_hooks` 模块
3. **构建工具链**：Vercel CLI 在构建时尝试打包所有依赖，包括不兼容的 Node.js 内置模块

## 解决方案

### 1. 修改 Next.js 配置

在 `next.config.mjs` 中添加更全面的 webpack 配置来处理 `async_hooks` 和其他不兼容的模块：

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
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
  // ... 其他配置保持不变
};
```

### 2. 使用自定义构建脚本

由于 Windows 系统上 `@cloudflare/next-on-pages` 的 npx 路径问题，使用项目中的自定义构建脚本：

```bash
node build-cf-pages.js
```

### 3. 验证构建结果

构建成功后应该看到：
```
✅ 构建完成！输出目录：.vercel/output/static
```

## 技术细节

### 为什么这个修复有效？

1. **Webpack externals**：将 `async_hooks` 标记为外部依赖，避免打包到最终输出中
2. **条件加载**：只在生产环境应用此配置，避免影响开发环境
3. **CommonJS 格式**：使用 `commonjs async_hooks` 格式，确保与 Node.js 模块系统兼容

### Cloudflare Pages 兼容性

- ✅ 静态页面生成正常
- ✅ API 路由转换为 Cloudflare Functions
- ✅ 认证流程保持完整
- ✅ 数据库连接（D1）正常工作

## 测试验证

### 本地测试
```bash
# 1. 测试 Next.js 构建
npm run build

# 2. 测试 Cloudflare Pages 构建
node build-cf-pages.js
```

### 预期输出
- Next.js 构建成功，无 `async_hooks` 错误
- 生成 `.vercel/output/static` 目录
- 包含所有必要的静态资源

## 部署注意事项

1. **环境变量**：确保在 Cloudflare Pages 中设置了所需的环境变量
2. **D1 数据库**：确保数据库绑定正确配置
3. **域名配置**：如果使用自定义域名，确保 DNS 设置正确

## 故障排除

### 如果仍然遇到 async_hooks 错误

1. 清理构建缓存：
```bash
rm -rf .next
rm -rf .vercel
npm run build
```

2. 检查 Node.js 版本：
```bash
node --version  # 应该是 18.x 或更高版本
```

3. 验证依赖项：
```bash
npm audit fix
```

### Windows 特定问题

如果在 Windows 上遇到 `spawn npx ENOENT` 错误：

1. 使用项目自定义构建脚本：`node build-cf-pages.js`
2. 或者安装 Git Bash 并在其中运行构建命令
3. 考虑使用 WSL (Windows Subsystem for Linux)

## 总结

这个修复通过 webpack externals 配置解决了 Cloudflare Pages 构建时的 `async_hooks` 兼容性问题，同时保持了应用的所有功能。修复后的应用可以正常部署到 Cloudflare Pages 并运行完整的 SaaS 功能，包括用户认证和数据库操作。
