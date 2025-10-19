# Google OAuth 完整设置指南

## 📋 概述

本指南详细介绍如何为您的 Cloudflare SaaS 应用设置 Google OAuth 登录功能，包括 Google Cloud Console 配置、环境变量设置和代码实现。

## 🚀 完整设置步骤

### 第一步：创建 Google Cloud 项目

1. **访问 Google Cloud Console**
   ```
   https://console.cloud.google.com/
   ```

2. **创建新项目**
   - 点击顶部项目选择器
   - 点击"新建项目"
   - 输入项目名称（如：`my-saas-app`）
   - 点击"创建"

3. **启用 Google+ API**
   - 在左侧导航栏选择"API 和服务" → "库"
   - 搜索"Google+ API"或"People API"
   - 点击"启用"

### 第二步：配置 OAuth 同意屏幕

1. **配置 OAuth 同意屏幕**
   - 导航到"API 和服务" → "OAuth 同意屏幕"
   - 选择"外部"（除非您是 Google Workspace 用户）
   - 点击"创建"

2. **填写应用信息**
   ```
   应用名称：您的应用名称
   用户支持电子邮件：您的邮箱
   应用首页网址：http://localhost:3000（开发环境）
   应用隐私政策网址：可选
   应用服务条款网址：可选
   已获授权的网域：localhost（开发环境）
   开发者联系信息：您的邮箱
   ```

3. **配置范围（Scopes）**
   - 点击"添加或移除范围"
   - 添加以下范围：
     - `../auth/userinfo.email`
     - `../auth/userinfo.profile`
     - `openid`
   - 点击"更新"

4. **添加测试用户（开发阶段）**
   - 在"测试用户"部分点击"+ ADD USERS"
   - 添加您的测试邮箱地址

### 第三步：创建 OAuth 凭据

1. **创建凭据**
   - 导航到"API 和服务" → "凭据"
   - 点击"+ 创建凭据" → "OAuth 客户端 ID"

2. **配置客户端**
   ```
   应用类型：Web 应用
   名称：Web客户端（可自定义）
   已获授权的 JavaScript 来源：
     - http://localhost:3000（开发环境）
     - https://your-domain.com（生产环境）
   已获授权的重定向 URI：
     - http://localhost:3000/api/auth/callback/google（开发环境）
     - https://your-domain.com/api/auth/callback/google（生产环境）
   ```

3. **获取凭据**
   - 创建完成后，您将获得：
     - **客户端 ID**：类似 `123456789-abcdef.apps.googleusercontent.com`
     - **客户端密钥**：类似 `GOCSPX-abcdef123456`

### 第四步：配置环境变量

1. **创建 `.env` 文件**
   ```bash
   cp .env.example .env
   ```

2. **填入 Google OAuth 配置**
   ```env
   # Google OAuth 配置
   GOOGLE_CLIENT_ID=您的客户端ID
   GOOGLE_CLIENT_SECRET=您的客户端密钥
   
   # NextAuth 配置
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=您的随机密钥
   ```

3. **生成 NEXTAUTH_SECRET**
   ```bash
   # 方法1：使用 OpenSSL
   openssl rand -base64 32
   
   # 方法2：使用 Node.js
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   
   # 方法3：使用在线生成器
   # 访问：https://generate-secret.vercel.app/32
   ```

## 🔧 代码实现详解

### NextAuth 配置分析

```typescript
// src/server/auth.ts
import Google from "next-auth/providers/google";

export const {
  handlers: { GET, POST },
  signIn,
  signOut,
  auth,
} = NextAuth({
  trustHost: true,                    // 信任托管环境（Cloudflare Pages）
  adapter: DrizzleAdapter(db),        // 使用 Drizzle 适配器连接数据库
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      // 可选：限制特定域名
      // allowlist: ["example.com", "company.org"],
    }),
    // ... 其他 providers
  ],
  pages: {
    signIn: "/auth/signin",           // 自定义登录页面
  },
  session: {
    strategy: "jwt",                  // 使用 JWT 策略
  },
});
```

### 数据库表结构说明

```typescript
// src/server/db/schema.ts
export const users = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name"),                 // 用户姓名（从 Google 获取）
  email: text("email").unique(),      // 邮箱地址（从 Google 获取）
  emailVerified: integer("emailVerified", { mode: "timestamp_ms" }),
  image: text("image"),               // 头像 URL（从 Google 获取）
});

export const accounts = sqliteTable("account", {
  userId: text("userId").notNull(),
  type: text("type").notNull(),       // 账户类型（oauth）
  provider: text("provider").notNull(), // 提供商（google）
  providerAccountId: text("providerAccountId").notNull(),
  access_token: text("access_token"), // 访问令牌
  refresh_token: text("refresh_token"), // 刷新令牌
  expires_at: integer("expires_at"),  // 过期时间
  token_type: text("token_type"),     // 令牌类型
  scope: text("scope"),               // 权限范围
  id_token: text("id_token"),         // ID 令牌
});
```

## 🎯 工作流程详解

### 1. 用户点击 Google 登录

```
用户点击 → 前端调用 signIn("google") → 重定向到 Google OAuth
```

### 2. Google OAuth 流程

```
Google 认证 → 用户授权 → 返回授权码 → 重定向到回调地址
```

### 3. 后端处理回调

```
/api/auth/callback/google → 交换授权码获取令牌 → 获取用户信息 → 存储到数据库
```

### 4. 创建会话

```
存储用户信息 → 创建 JWT Token → 设置会话 Cookie → 重定向到应用
```

## 🛠️ 前端集成示例

### 登录按钮组件

```typescript
// src/components/auth/signin-button.tsx
"use client";

import { signIn } from "next-auth/react";

export function SignInButton() {
  return (
    <button
      onClick={() => signIn("google")}
      className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg hover:bg-gray-50"
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
      使用 Google 登录
    </button>
  );
}
```

### 用户信息显示

```typescript
// src/components/auth/user-info.tsx
"use client";

import { useSession, signOut } from "next-auth/react";

export function UserInfo() {
  const { data: session } = useSession();

  if (!session) return null;

  return (
    <div className="flex items-center gap-3">
      <img 
        src={session.user?.image || ""} 
        alt={session.user?.name || ""}
        className="w-8 h-8 rounded-full"
      />
      <span className="text-sm">{session.user?.name}</span>
      <button
        onClick={() => signOut()}
        className="text-sm text-gray-600 hover:text-gray-900"
      >
        退出
      </button>
    </div>
  );
}
```

## 🚨 常见问题和解决方案

### 1. 重定向 URI 不匹配

**问题**：`redirect_uri_mismatch` 错误

**解决方案**：
- 检查 Google Console 中的重定向 URI
- 确保与 `NEXTAUTH_URL` 一致
- 开发环境：`http://localhost:3000/api/auth/callback/google`
- 生产环境：`https://your-domain.com/api/auth/callback/google`

### 2. 客户端 ID 或密钥无效

**问题**：`invalid_client` 错误

**解决方案**：
- 检查 `.env` 文件中的值是否正确
- 确保没有多余的空格或换行符
- 重新生成客户端密钥

### 3. CORS 错误

**问题**：跨域请求被阻止

**解决方案**：
- 在 Google Console 中添加正确的 JavaScript 来源
- 检查 `NEXTAUTH_URL` 配置

### 4. 数据库连接失败

**问题**：用户信息无法保存

**解决方案**：
- 检查 D1 数据库配置
- 确保迁移已应用：`bun run db:migrate:dev`
- 检查环境变量配置

## 🔒 安全注意事项

### 1. 环境变量安全

```bash
# 永远不要提交 .env 文件
echo ".env" >> .gitignore

# 生产环境使用 Cloudflare Pages 环境变量
# 而不是 .env 文件
```

### 2. 域名验证

```typescript
// 限制特定域名用户登录
Google({
  clientId: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  allowlist: ["yourcompany.com"], // 只允许公司邮箱
}),
```

### 3. 会话安全

```typescript
// 生产环境配置
session: {
  strategy: "jwt",
  maxAge: 24 * 60 * 60, // 24小时
},
```

## 🚀 部署配置

### Cloudflare Pages 环境变量

1. **在 Cloudflare Dashboard 中设置**
   - 进入您的 Pages 项目
   - 点击"Settings" → "Environment variables"
   - 添加以下变量：
     ```
     GOOGLE_CLIENT_ID: 您的客户端ID
     GOOGLE_CLIENT_SECRET: 您的客户端密钥
     NEXTAUTH_URL: https://your-domain.com
     NEXTAUTH_SECRET: 您的生产密钥
     ```

### 生产环境重定向 URI

1. **更新 Google Console**
   ```
   已获授权的 JavaScript 来源：
   - https://your-domain.com
   
   已获授权的重定向 URI：
   - https://your-domain.com/api/auth/callback/google
   ```

## 📊 测试验证

### 1. 本地测试

```bash
# 启动开发服务器
bun run dev

# 访问登录页面
http://localhost:3000/auth/signin

# 测试 Google 登录流程
```

### 2. 生产测试

```bash
# 部署到 Cloudflare Pages
bun run deploy

# 测试生产环境登录
https://your-domain.com/auth/signin
```

### 3. 数据库验证

```bash
# 查看用户数据
bun run db:studio:dev

# 检查 users 和 accounts 表
```

## 🎯 总结

通过本指南，您应该能够：

1. ✅ 创建和配置 Google Cloud 项目
2. ✅ 设置 OAuth 同意屏幕和凭据
3. ✅ 配置环境变量和 NextAuth
4. ✅ 实现 Google 登录功能
5. ✅ 处理常见问题和安全配置
6. ✅ 部署到生产环境

记住：Google OAuth 需要精确的 URL 配置，任何不匹配都会导致认证失败。确保开发环境和生产环境的配置都正确无误。
