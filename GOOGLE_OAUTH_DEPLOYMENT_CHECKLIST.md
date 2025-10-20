# Google OAuth 部署检查清单

## ✅ 已完成的配置

### 1. 环境变量配置
- [x] `.env.local` 已更新为使用 Google OAuth
- [x] 生成了安全的 `NEXTAUTH_SECRET`
- [x] 设置了正确的 `NEXTAUTH_URL`
- [x] 禁用了 Mock 认证 (`USE_MOCK_AUTH=false`)

### 2. Cloudflare Functions 更新
- [x] 更新了 `functions/api/auth.js` 支持 Google OAuth
- [x] 实现了完整的 OAuth 流程
- [x] 添加了错误处理和重定向逻辑

### 3. 前端组件优化
- [x] 更新了 `SignInButton` 组件
- [x] 添加了 Google OAuth 特定处理逻辑
- [x] 优化了用户体验

---

## 🔄 待完成的步骤

### 4. Google Cloud Console 配置
- [ ] 创建 Google Cloud 项目
- [ ] 启用 Google+ API 或 People API
- [ ] 配置 OAuth 同意屏幕
- [ ] 创建 OAuth 2.0 凭据
- [ ] 获取 Client ID 和 Client Secret

### 5. Cloudflare Pages 环境变量
- [ ] 登录 Cloudflare Dashboard
- [ ] 设置生产环境变量：
  - `USE_MOCK_AUTH=false`
  - `NEXTAUTH_SECRET=生成的安全密钥`
  - `NEXTAUTH_URL=https://cloudflare-saas-stack-9ld.pages.dev`
  - `GOOGLE_CLIENT_ID=从Google获取的Client ID`
  - `GOOGLE_CLIENT_SECRET=从Google获取的Client Secret`

### 6. 部署和测试
- [ ] 本地测试：`npm run dev`
- [ ] 构建项目：`npm run build:cf`
- [ ] 部署到 Cloudflare Pages：`npm run deploy`
- [ ] 验证 Google OAuth 流程

---

## 🔧 快速部署命令

```bash
# 1. 本地测试
npm run dev

# 2. 构建项目
npm run build:cf

# 3. 部署到 Cloudflare Pages
npm run deploy
```

---

## 📋 Google Cloud Console 配置详细步骤

### 1. 访问 Google Cloud Console
```
https://console.cloud.google.com/
```

### 2. 创建项目
1. 点击项目选择器 → "新建项目"
2. 项目名称：`cloudflare-saas-stack`
3. 点击 "创建"

### 3. 启用 API
1. "API 和服务" → "库"
2. 搜索 "People API"
3. 点击 "启用"

### 4. 配置 OAuth 同意屏幕
1. "API 和服务" → "OAuth 同意屏幕"
2. 选择 "外部" → "创建"
3. 填写应用信息：
   - 应用名称：`Cloudflare SaaS Stack`
   - 用户支持电子邮件：你的邮箱
   - 应用首页网址：`https://cloudflare-saas-stack-9ld.pages.dev`
   - 已获授权的网域：`pages.dev`

### 5. 创建凭据
1. "API 和服务" → "凭据"
2. "+ 创建凭据" → "OAuth 客户端 ID"
3. 应用类型：**Web 应用**
4. 名称：`Cloudflare Pages Web Client`
5. 已获授权的 JavaScript 来源：
   - `https://cloudflare-saas-stack-9ld.pages.dev`
   - `http://localhost:3000`
6. 已获授权的重定向 URI：
   - `https://cloudflare-saas-stack-9ld.pages.dev/api/auth/callback/google`
   - `http://localhost:3000/api/auth/callback/google`

---

## 🚨 重要注意事项

### 回调 URL 必须完全匹配
确保在 Google Cloud Console 中设置的重定向 URI 与以下完全一致：
```
https://cloudflare-saas-stack-9ld.pages.dev/api/auth/callback/google
http://localhost:3000/api/auth/callback/google
```

### 环境变量安全
- 不要在代码中硬编码 Client Secret
- 使用 Cloudflare Pages 的环境变量功能
- 定期轮换密钥

### 域名验证
确保 `pages.dev` 域名已添加到已获授权的网域列表中。

---

## 🔍 故障排除

### 常见错误及解决方案

1. **redirect_uri_mismatch**
   - 检查 Google Cloud Console 中的重定向 URI
   - 确保与实际部署的 URL 完全匹配

2. **invalid_client**
   - 验证 Client ID 和 Client Secret
   - 检查环境变量是否正确设置

3. **access_denied**
   - 检查 OAuth 同意屏幕配置
   - 确保应用已通过验证

4. **Cookie 问题**
   - 确保 SameSite 设置正确
   - 检查域名配置

---

## 🎉 成功验证标准

完成所有配置后，用户应该能够：

1. ✅ 看到专业的 Google 登录按钮
2. ✅ 点击后跳转到 Google OAuth 页面
3. ✅ 成功授权后返回应用
4. ✅ 看到登录状态和用户信息
5. ✅ 能够正常登出

---

## 📞 支持和帮助

如果遇到问题，请检查：
1. 浏览器开发者工具的控制台错误
2. Cloudflare Pages 的函数日志
3. Google Cloud Console 的 API 使用情况
4. 网络请求的重定向链

相关文档：
- [NextAuth.js Google Provider](https://next-auth.js.org/providers/google)
- [Google OAuth 2.0 指南](https://developers.google.com/identity/protocols/oauth2)
- [Cloudflare Pages Functions](https://developers.cloudflare.com/pages/platform/functions/)
