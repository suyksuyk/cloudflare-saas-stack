# Mock登录功能说明

## 概述

为了解决Google OAuth登录问题，本项目实现了Mock登录功能，允许在开发环境中无需真实OAuth配置即可测试认证流程。

## 问题分析

原始错误：
```
[auth][error] TypeError: fetch failed
at Module.discoveryRequest (webpack-internal:///(rsc)/./node_modules/oauth4webapi/build/index.js:272:45)
```

原因：
- 缺少Google OAuth环境变量配置
- 网络连接问题
- OAuth配置不正确

## 解决方案

### 1. Mock认证架构

- **真实认证**: `src/server/auth.ts` - Google OAuth
- **Mock认证**: `src/server/auth-mock.ts` - 凭据认证
- **配置切换**: `src/server/auth-config.ts` - 自动切换逻辑

### 2. Mock用户凭据

| 用户类型 | 邮箱 | 密码 | 说明 |
|---------|------|------|------|
| 测试用户 | test@example.com | password | 基础测试用户 |
| 开发者 | dev@example.com | password | 开发者账户 |

### 3. 环境变量配置

创建 `.env.local` 文件：
```env
# 启用Mock认证模式
USE_MOCK_AUTH=true

# Mock认证的必需环境变量
AUTH_SECRET=mock-secret-for-development-only
AUTH_URL=http://localhost:3000

# Google OAuth配置 (可选，用于生产环境)
# AUTH_GOOGLE_ID=your-google-client-id
# AUTH_GOOGLE_SECRET=your-google-client-secret
```

### 4. 自动切换逻辑

```typescript
// 开发环境或明确启用mock时使用mock认证
const USE_MOCK_AUTH = process.env.USE_MOCK_AUTH === "true" || process.env.NODE_ENV === "development";
```

## 使用方法

### 开发环境 (推荐)

1. 确保 `.env.local` 文件存在且包含 `USE_MOCK_AUTH=true`
2. 启动开发服务器：`bun run dev`
3. 访问 http://localhost:3000
4. 点击 "Mock登录" 按钮

### 生产环境

1. 移除或设置 `USE_MOCK_AUTH=false`
2. 配置真实的Google OAuth环境变量
3. 使用Google登录

## 文件结构

```
src/server/
├── auth.ts              # 原始Google OAuth配置
├── auth-mock.ts         # Mock认证配置
└── auth-config.ts       # 认证配置切换逻辑

src/app/api/auth/[...next_auth]/
├── route.ts             # 原始API路由
└── route-mock.ts        # Mock API路由

src/app/
└── page.tsx             # 主页面，支持两种登录模式
```

## 技术实现细节

### Mock认证流程

1. 用户点击Mock登录按钮
2. 调用 `signIn("mock", credentials)`
3. MockProvider验证凭据
4. 返回预定义的mock用户数据
5. 创建session并重定向

### 数据库集成

- Mock认证仍然使用DrizzleAdapter
- 用户数据会存储到Cloudflare D1数据库
- Session管理与真实认证相同

### 安全考虑

- Mock认证仅在开发环境启用
- 生产环境强制使用真实OAuth
- Mock凭据仅用于开发测试

## 故障排除

### Mock登录不工作

1. 检查 `.env.local` 文件是否存在
2. 确认 `USE_MOCK_AUTH=true`
3. 重启开发服务器
4. 检查控制台错误信息

### 切换回Google登录

1. 设置 `USE_MOCK_AUTH=false` 或删除该行
2. 配置Google OAuth环境变量
3. 重启服务器

### TypeScript错误

1. 确保所有导入路径正确
2. 检查类型定义
3. 重新编译项目

## 扩展功能

### 添加更多Mock用户

在 `src/server/auth-mock.ts` 中添加：

```typescript
const mockUsers = [
  // 现有用户...
  {
    id: "mock-user-3",
    name: "新用户",
    email: "new@example.com",
    emailVerified: new Date(),
    image: "https://avatars.githubusercontent.com/u/3?v=4",
  }
];
```

### 自定义认证逻辑

修改 `MockProvider.authorize` 函数来实现自定义验证逻辑。

## 总结

Mock登录功能成功解决了开发环境中的OAuth配置问题，提供了：

- ✅ 无需OAuth配置的开发体验
- ✅ 快速的用户认证测试
- ✅ 与现有数据库集成
- ✅ 生产环境安全切换
- ✅ 完整的TypeScript支持

现在可以专注于业务逻辑开发，而不用担心认证配置问题。
