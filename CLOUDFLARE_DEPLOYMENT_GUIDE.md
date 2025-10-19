# Cloudflare Pages 自动部署指南

## 🎉 项目已修复并推送到 GitHub！

所有导入错误已解决，代码已成功推送到 GitHub 仓库。现在可以按照以下步骤在 Cloudflare 上自动部署。

## 📋 部署前检查清单

- ✅ 导入错误已修复
- ✅ wrangler.toml 配置已更新
- ✅ package-lock.json 已生成
- ✅ 代码已推送到 GitHub

## 🚀 Cloudflare Pages 部署步骤

### 1. 登录 Cloudflare Dashboard
1. 访问 [https://dash.cloudflare.com](https://dash.cloudflare.com)
2. 使用你的账号登录

### 2. 创建 Pages 项目
1. 在左侧菜单点击 **"Pages"**
2. 点击 **"Create a project"** 按钮
3. 选择 **"Connect to Git"**

### 3. 连接 GitHub 仓库
1. 选择 **"GitHub"** 图标
2. 授权 Cloudflare 访问你的 GitHub 账号
3. 从列表中选择 `cloudflare-saas-stack` 仓库
4. 点击 **"Begin setup"**

### 4. 配置构建设置

#### 基本设置
```
构建命令: npm run build
构建输出目录: .next
根目录: / (保持默认)
Node.js 版本: 18.x 或更高
```

#### 环境变量设置
在 **"Environment variables"** 部分添加：

```
NODE_ENV=production
USE_MOCK_AUTH=true
AUTH_SECRET=your-production-secret-here-change-this
AUTH_URL=https://your-domain.pages.dev
```

**重要提示：**
- `AUTH_SECRET` 必须是一个随机字符串，可以使用 `openssl rand -base64 32` 生成
- `AUTH_URL` 先使用 Cloudflare 提供的默认域名，部署后再更新为自定义域名

### 5. 数据库配置
项目已配置 Cloudflare D1 数据库：
- 数据库名称：`cf_saas-db`
- 数据库 ID：`6b67bd2f-0a58-43fd-9721-479f33b10968`

如果需要重新创建数据库：
1. 在 Cloudflare Dashboard 中创建新的 D1 数据库
2. 更新 `wrangler.toml` 中的数据库 ID
3. 运行迁移：`npx wrangler d1 migrations apply cf_saas-db --remote`

### 6. 部署项目
1. 点击 **"Save and Deploy"**
2. 等待构建完成（通常需要 2-5 分钟）
3. 部署成功后会获得一个 `.pages.dev` 域名

## 🔧 部署后配置

### 1. 更新 AUTH_URL
部署完成后，需要更新环境变量中的 `AUTH_URL`：
1. 进入 Pages 项目设置
2. 找到 **"Environment variables"**
3. 将 `AUTH_URL` 更新为实际的域名

### 2. 运行数据库迁移
如果数据库是新的，需要运行迁移：
```bash
npx wrangler d1 migrations apply cf_saas-db --remote
```

### 3. 测试功能
- 访问部署的域名
- 测试 Mock 登录功能
- 验证数据库连接

## 🎯 Mock 认证使用说明

项目当前使用 Mock 认证模式，测试凭据：

### 测试用户
- **邮箱**: `test@example.com`
- **密码**: `password`
- **角色**: 测试用户

### 开发者用户
- **邮箱**: `dev@example.com`
- **密码**: `password`
- **角色**: 开发者

## 🔄 自动部署流程

设置完成后，每次推送代码到 GitHub 主分支时：
1. Cloudflare 会自动拉取最新代码
2. 安装依赖并构建项目
3. 部署到全球 CDN
4. 更新域名指向新版本

## 🛠️ 生产环境配置

当准备切换到生产环境时：

### 1. 关闭 Mock 模式
```
USE_MOCK_AUTH=false
```

### 2. 配置 OAuth
```
AUTH_GOOGLE_ID=your-google-client-id
AUTH_GOOGLE_SECRET=your-google-client-secret
```

### 3. 更新回调 URL
在 Google OAuth 设置中添加：
```
https://your-domain.com/api/auth/callback/google
```

## 📊 监控和日志

### 查看部署日志
1. 进入 Pages 项目
2. 点击 **"Deployments"**
3. 选择部署记录查看详细日志

### 性能监控
1. 使用 **"Analytics"** 查看访问统计
2. 使用 **"Real User Analytics"** 监控性能

## 🚨 常见问题解决

### 构建失败
- 检查 Node.js 版本是否正确
- 确认所有环境变量已设置
- 查看构建日志中的错误信息

### 数据库连接失败
- 确认 D1 数据库已创建
- 检查数据库 ID 配置
- 运行数据库迁移

### 认证问题
- 确保 AUTH_SECRET 已设置
- 检查 AUTH_URL 配置
- 确认 OAuth 回调 URL 正确

## 🎉 完成！

按照以上步骤，你的项目就能在 Cloudflare 上成功运行了！享受全球 CDN 加速和边缘计算的优势吧！

---

**需要帮助？**
- 查看 [Cloudflare Pages 文档](https://developers.cloudflare.com/pages/)
- 检查项目仓库的 Issues
- 联系 Cloudflare 支持
