# Wrangler.toml 配置修复说明

## 问题描述

在 Cloudflare Pages 部署时遇到以下错误：
```
✘ [ERROR] Running configuration file validation for Pages:
- Configuration file for Pages projects does not support "build"
```

## 问题原因

Cloudflare Pages 项目不支持在 `wrangler.toml` 文件中设置 `[build]` 配置部分。构建命令必须在 Cloudflare Pages Dashboard 中设置。

## 修复方案

### 1. 移除不支持的配置

从 `wrangler.toml` 中移除以下不支持的配置：
```toml
[build]
command = "node build-with-fix.js"
```

### 2. 正确的 wrangler.toml 配置

```toml
name = "cloudflare-saas-stack"
compatibility_date = "2024-09-23"
compatibility_flags = [ "nodejs_compat" ]
pages_build_output_dir = ".next"

[placement]
mode = "smart"

[[d1_databases]]
binding = "DATABASE"
database_name = "cf_saas-db"
database_id = "bba6a9f4-2357-4474-9150-bea37ac24654"
migrations_dir = "./drizzle"
```

### 3. 在 Cloudflare Pages Dashboard 中设置构建命令

1. 登录 Cloudflare Dashboard
2. 进入你的 Pages 项目
3. 点击 "Settings" → "Build & deployments"
4. 在 "Build configuration" 中设置：
   - **Build command**: `node build-with-fix.js`
   - **Build output directory**: `.next`
   - **Root directory**: `/` (留空)

## 为什么这样修复？

1. **Cloudflare Pages 限制**: Pages 项目有特定的配置限制，不支持在 wrangler.toml 中设置构建命令
2. **Dashboard 配置**: 构建命令必须在 Dashboard 中设置，这样可以更灵活地管理构建过程
3. **构建脚本**: 我们的 `build-with-fix.js` 脚本包含了所有必要的修复逻辑，可以在 Dashboard 中直接调用

## 验证修复

运行以下命令验证配置正确：
```bash
node build-with-fix.js
```

如果构建成功，说明修复生效。

## 部署步骤

1. 确保代码已提交到 Git 仓库
2. 在 Cloudflare Pages Dashboard 中连接仓库
3. 设置构建命令为 `node build-with-fix.js`
4. 设置必要的环境变量
5. 点击 "Save and Deploy"

## 注意事项

- 不要在 wrangler.toml 中添加 `[build]` 配置
- 构建命令必须在 Dashboard 中设置
- 确保构建脚本 `build-with-fix.js` 在仓库根目录
- 设置正确的 Node.js 版本（推荐 18.x）

这个修复确保了 Cloudflare Pages 能够正确识别配置并成功构建项目。
