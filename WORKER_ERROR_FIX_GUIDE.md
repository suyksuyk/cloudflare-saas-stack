# Cloudflare Pages Worker 错误修复指南

## 🚨 错误描述

```
Error 1101 Ray ID: 991862208c6706a5 • 2025-10-20 12:05:25 UTC
Worker threw exception
```

这个错误表示 Cloudflare Pages Functions 在运行时抛出了异常。

## 🔍 问题分析

### 根本原因
Cloudflare Pages Functions 运行在 V8 isolates 中，不支持 Node.js 的 `process.env` 对象。当 Functions 代码尝试访问 `process.env` 时会导致运行时错误。

### 具体问题
在 `functions/api/auth.js` 中使用了 `process.env` 来访问环境变量：
```javascript
// ❌ 错误的用法
process.env.NEXTAUTH_SECRET = env.NEXTAUTH_SECRET || 'fallback-secret';
```

## ✅ 解决方案

### 1. 使用 context.env 替代 process.env

**修复前：**
```javascript
export async function onRequest(context) {
  const { request, env } = context;
  
  // ❌ 错误：在 Cloudflare Pages Functions 中不可用
  process.env.NEXTAUTH_SECRET = env.NEXTAUTH_SECRET || 'fallback-secret';
  process.env.NEXTAUTH_URL = env.NEXTAUTH_URL || 'https://your-domain.pages.dev';
}
```

**修复后：**
```javascript
export async function onRequest(context) {
  const { request, env } = context;
  
  // ✅ 正确：直接使用 context.env
  const NEXTAUTH_SECRET = env.NEXTAUTH_SECRET || 'fallback-secret';
  const NEXTAUTH_URL = env.NEXTAUTH_URL || 'https://your-domain.pages.dev';
  const GOOGLE_CLIENT_ID = env.GOOGLE_CLIENT_ID;
  const GOOGLE_CLIENT_SECRET = env.GOOGLE_CLIENT_SECRET;
}
```

### 2. 修复的环境变量

所有 `process.env` 引用都已替换为直接使用 `env`：

- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `USE_MOCK_AUTH`

## 🧪 验证修复

运行测试脚本验证修复：
```bash
node test-worker-fix.js
```

预期输出：
```
🧪 测试 Cloudflare Pages Worker 修复...
✅ functions/api/auth.js 环境变量使用: [...]
✅ functions/api/auth.js 语法结构正确
✅ functions/_middleware.js 语法结构正确
✅ 所有 functions 文件语法正确
🎉 Worker 修复验证通过！
```

## 📁 修复的文件

1. **functions/api/auth.js**
   - 移除所有 `process.env` 引用
   - 使用 `context.env` 访问环境变量
   - 保持所有认证功能完整

2. **test-worker-fix.js**
   - 新增验证脚本
   - 检查语法和环境变量使用

## 🚀 部署步骤

1. **提交修复**
   ```bash
   git add .
   git commit -m "Fix Cloudflare Pages Worker error - remove process.env"
   git push origin main
   ```

2. **自动部署**
   - Cloudflare Pages 会自动触发重新部署
   - 等待部署完成

3. **验证部署**
   - 访问你的 Pages 域名
   - 检查是否还有 Worker 错误

## 🔧 环境变量配置

确保在 Cloudflare Pages Dashboard 中设置了正确的环境变量：

```
NEXTAUTH_URL=https://your-domain.pages.dev
NEXTAUTH_SECRET=your-secret-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
USE_MOCK_AUTH=false
```

## 📋 故障排除

### 如果错误仍然存在

1. **检查 Functions 日志**
   - 在 Cloudflare Pages Dashboard 中查看 Workers Logs
   - 查看具体的错误信息

2. **验证环境变量**
   - 确保所有必需的环境变量都已设置
   - 检查变量名称是否正确

3. **本地测试**
   ```bash
   node test-worker-fix.js
   ```

4. **重新部署**
   ```bash
   git commit --allow-empty -m "Trigger redeploy"
   git push origin main
   ```

## 🎉 成功指标

修复成功后，你应该看到：
- ✅ 页面正常加载，无 Worker 错误
- ✅ 认证功能正常工作
- ✅ Google OAuth 登录可以正常使用
- ✅ API 端点响应正常

## 📚 相关文档

- [Cloudflare Pages Functions 文档](https://developers.cloudflare.com/pages/platform/functions/)
- [环境变量使用指南](https://developers.cloudflare.com/pages/platform/functions/environment-variables/)
- [Workers 错误调试](https://developers.cloudflare.com/workers/learning/how-workers-works/#errors-and-exceptions)

---

**总结**: 通过将 `process.env` 替换为 `context.env`，我们解决了 Cloudflare Pages Functions 的运行时错误，确保应用能够正常部署和运行。
