# Cloudflare Pages 部署指南

## 问题分析

当前部署遇到的主要问题：
1. `bun.lockb` 锁文件版本不兼容
2. Cloudflare Pages 构建环境无法正确处理 Bun 锁文件
3. 需要配置正确的构建命令和环境

## 解决方案

### 方案 1：修改 package.json 使用 npm

在 Cloudflare Pages 控制台配置以下构建设置：

#### 构建设置
- **构建命令**: `npm install && npm run build`
- **构建输出目录**: `.vercel/output/static`
- **Node.js 版本**: `22.x`

#### 环境变量
```
AUTH_SECRET=your-production-secret-key
AUTH_URL=https://your-domain.pages.dev
SKIP_ENV_VALIDATION=true
```

### 方案 2：使用自定义构建脚本

#### 1. 修改 package.json 添加构建脚本
```json
{
  "scripts": {
    "build:cf": "node build-cf-pages.js"
  }
}
```

#### 2. Cloudflare Pages 构建设置
- **构建命令**: `npm install && npm run build:cf`
- **构建输出目录**: `.vercel/output/static`

### 方案 3：预构建部署

#### 1. 本地构建
```bash
# 使用我们的构建脚本
node build-cf-pages.js
```

#### 2. 部署到 Cloudflare Pages
```bash
# 部署构建好的文件
wrangler pages deploy .vercel/output/static
```

## Cloudflare Pages 控制台配置步骤

### 1. 创建项目
1. 登录 Cloudflare Dashboard
2. 进入 Pages 部分
3. 连接 GitHub 仓库

### 2. 配置构建设置
在 Settings > Builds and deployments 中：

```
Framework preset: Next.js (Static HTML Export)
Build command: npm install && npm run build
Build output directory: .vercel/output/static
Root directory: / (默认)
```

### 3. 配置环境变量
在 Settings > Environment variables 中添加：

```
AUTH_SECRET=your-secure-random-string-here
AUTH_URL=https://your-project.pages.dev
SKIP_ENV_VALIDATION=true
```

### 4. 配置 D1 数据库绑定
在 Settings > Functions > D1 bindings 中：

```
Variable name: DATABASE
D1 database: cf_saas-db
```

## 数据库配置

确保 D1 数据库已创建并包含必要的表：

```sql
-- 检查数据库
wrangler d1 info cf_saas-db

-- 运行迁移
wrangler d1 migrations apply cf_saas-db --remote
```

## 故障排除

### 1. 锁文件问题
如果遇到 `bun.lockb` 错误：
- 删除 `bun.lockb` 文件
- 使用 `npm install` 重新生成 `package-lock.json`
- 提交新的锁文件到仓库

### 2. 构建失败
检查构建日志中的常见错误：
- Node.js 版本不兼容
- 依赖安装失败
- 构建命令错误

### 3. 运行时错误
检查 Functions 配置：
- D1 数据库绑定是否正确
- 环境变量是否设置
- 路由配置是否正确

## 推荐配置

### package.json 调整
```json
{
  "engines": {
    "node": ">=18.0.0"
  },
  "scripts": {
    "build": "next build",
    "build:cf": "node build-cf-pages.js"
  }
}
```

### .gitignore 更新
```
bun.lockb
.vercel
.next
node_modules
```

## 部署验证

部署完成后检查：
1. 主页是否正常加载
2. 静态资源是否正确加载
3. API 路由是否响应
4. 数据库连接是否正常

## 持续部署

设置 GitHub Actions 自动部署：

```yaml
name: Deploy to Cloudflare Pages
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm install
      - name: Build
        run: npm run build:cf
      - name: Deploy to Cloudflare Pages
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: your-project-name
          directory: .vercel/output/static
