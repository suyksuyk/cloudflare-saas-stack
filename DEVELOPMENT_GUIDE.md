# 🚀 Cloudflare SaaS Stack 二次开发指南

## 📚 目录
1. [环境变量设置指南](#环境变量设置指南)
2. [数据库连接配置](#数据库连接配置)
3. [身份验证扩展](#身份验证扩展)
4. [业务逻辑添加指南](#业务逻辑添加指南)
5. [部署流程说明](#部署流程说明)
6. [常见问题解决](#常见问题解决)

## 🔧 环境变量设置指南

### 1. 本地开发环境

#### 创建 `.dev.vars` 文件
```bash
# 在项目根目录创建 .dev.vars 文件
# 注意：这个文件不会被 Git 跟踪，适合本地开发
```

#### 必需的环境变量
```bash
# .dev.vars
AUTH_SECRET=your-auth-secret-here
AUTH_URL=http://localhost:3000
USE_MOCK_AUTH=true  # 开发环境启用 Mock 认证

# Cloudflare D1 配置 (本地会自动创建)
CLOUDFLARE_D1_ACCOUNT_ID=your-account-id
DATABASE=your-database-id
CLOUDFLARE_D1_API_TOKEN=your-api-token
```

#### 生成 AUTH_SECRET
```bash
# 方法 1: 使用 OpenSSL
openssl rand -base64 32

# 方法 2: 使用 NextAuth 内置命令
bunx auth secret

# 方法 3: 使用 Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 2. 生产环境配置

#### Cloudflare Pages 环境变量
在 Cloudflare Dashboard 中设置：

1. 进入 Pages 项目设置
2. 找到 "Environment variables" 部分
3. 添加以下变量：

```bash
# 生产环境必需变量
AUTH_SECRET=your-production-auth-secret
AUTH_URL=https://your-domain.pages.dev
USE_MOCK_AUTH=false  # 生产环境禁用 Mock

# Google OAuth (如果使用)
AUTH_GOOGLE_ID=your-google-client-id
AUTH_GOOGLE_SECRET=your-google-client-secret

# Cloudflare D1
CLOUDFLARE_D1_ACCOUNT_ID=your-account-id
DATABASE=your-database-id
CLOUDFLARE_D1_API_TOKEN=your-api-token
```

### 3. 环境变量类型定义

#### 添加新的环境变量
1. 修改 `src/env.mjs`：
```typescript
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    AUTH_SECRET: z.string(),
    AUTH_URL: z.string().optional(),
    // 添加新的服务端变量
    STRIPE_SECRET_KEY: z.string().optional(),
    RESEND_API_KEY: z.string().optional(),
  },
  client: {
    // 添加新的客户端变量 (必须以 NEXT_PUBLIC_ 开头)
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  },
  runtimeEnv: {
    AUTH_SECRET: process.env.AUTH_SECRET,
    AUTH_URL: process.env.AUTH_URL,
    // 添加新的运行时环境变量
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  },
});
```

## 🗄️ 数据库连接配置

### 1. 本地数据库设置

#### 自动初始化
```bash
# 运行 setup 脚本会自动创建本地数据库
bun run setup
```

#### 手动创建 D1 数据库
```bash
# 创建新的 D1 数据库
bunx wrangler d1 create my-app-db

# 记录返回的 database_id，更新 wrangler.toml
```

### 2. 数据库迁移

#### 创建新的数据表
1. 修改 `src/server/db/schema.ts`：
```typescript
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

// 添加新的数据表
export const posts = sqliteTable("post", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  content: text("content"),
  authorId: text("authorId").notNull().references(() => users.id),
  createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).notNull(),
});
```

2. 生成迁移文件：
```bash
bun run db:generate
```

3. 应用迁移：
```bash
# 开发环境
bun run db:migrate:dev

# 生产环境
bun run db:migrate:prod
```

### 3. 数据库操作示例

#### 基础 CRUD 操作
```typescript
// src/server/db/queries/posts.ts
import { db } from "./index";
import { posts, users } from "./schema";
import { eq, desc } from "drizzle-orm";

// 创建文章
export async function createPost(data: {
  title: string;
  content: string;
  authorId: string;
}) {
  const [post] = await db.insert(posts).values({
    ...data,
    createdAt: new Date(),
    updatedAt: new Date(),
  }).returning();
  return post;
}

// 获取文章列表
export async function getPosts() {
  return await db
    .select({
      id: posts.id,
      title: posts.title,
      content: posts.content,
      createdAt: posts.createdAt,
      author: {
        name: users.name,
        email: users.email,
        image: users.image,
      },
    })
    .from(posts)
    .leftJoin(users, eq(posts.authorId, users.id))
    .orderBy(desc(posts.createdAt));
}

// 获取单篇文章
export async function getPost(id: string) {
  const [post] = await db
    .select()
    .from(posts)
    .where(eq(posts.id, id))
    .limit(1);
  return post;
}

// 更新文章
export async function updatePost(id: string, data: Partial<{
  title: string;
  content: string;
}>) {
  const [post] = await db
    .update(posts)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(posts.id, id))
    .returning();
  return post;
}

// 删除文章
export async function deletePost(id: string) {
  await db.delete(posts).where(eq(posts.id, id));
}
```

### 4. 数据库连接优化

#### 连接池配置
```typescript
// src/server/db/index.ts
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

// 生产环境可以启用日志
const isDev = process.env.NODE_ENV === "development";

export const db = drizzle(process.env.DATABASE, {
  schema,
  logger: isDev, // 开发环境启用 SQL 日志
});
```

## 🔐 身份验证扩展

### 1. 添加新的 OAuth 提供商

#### 配置 GitHub OAuth
1. 修改 `src/server/auth.ts`：
```typescript
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";

export const {
  handlers: { GET, POST },
  signIn,
  signOut,
  auth,
} = NextAuth({
  trustHost: true,
  adapter: DrizzleAdapter(db),
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
    }),
    // ... 其他提供商
  ],
  // ... 其他配置
});
```

2. 添加环境变量：
```bash
# .dev.vars
AUTH_GITHUB_ID=your-github-client-id
AUTH_GITHUB_SECRET=your-github-client-secret
```

### 2. 自定义认证逻辑

#### 添加角色权限系统
1. 扩展用户表：
```typescript
// src/server/db/schema.ts
export const users = sqliteTable("user", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: integer("emailVerified", { mode: "timestamp_ms" }),
  image: text("image"),
  // 添加角色字段
  role: text("role", { enum: ["user", "admin", "moderator"] }).default("user"),
  // 添加订阅状态
  subscriptionStatus: text("subscriptionStatus", { 
    enum: ["free", "premium", "enterprise"] 
  }).default("free"),
});
```

2. 创建权限检查中间件：
```typescript
// src/server/auth/permissions.ts
import { auth } from "./auth";

export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    throw new Error("Admin access required");
  }
  return session;
}

export async function requirePremium() {
  const session = await auth();
  if (!session?.user || 
      !["premium", "enterprise"].includes(session.user.subscriptionStatus)) {
    throw new Error("Premium subscription required");
  }
  return session;
}
```

3. 在 API 路由中使用：
```typescript
// src/app/api/admin/users/route.ts
import { requireAdmin } from "@/server/auth/permissions";
import { db } from "@/server/db";
import { users } from "@/server/db/schema";

export async function GET() {
  try {
    const session = await requireAdmin();
    
    const allUsers = await db.select().from(users);
    return Response.json({ users: allUsers });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 403 });
  }
}
```

### 3. 自定义会话处理

#### 扩展会话数据
```typescript
// src/server/auth.ts
export const {
  handlers: { GET, POST },
  signIn,
  signOut,
  auth,
} = NextAuth({
  // ... 其他配置
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.subscriptionStatus = user.subscriptionStatus;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.subscriptionStatus = token.subscriptionStatus as string;
      }
      return session;
    },
  },
});
```

## 📈 业务逻辑添加指南

### 1. 创建新的 API 路由

#### RESTful API 示例
```typescript
// src/app/api/posts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/server/auth/permissions";
import { createPost, getPosts } from "@/server/db/queries/posts";
import { z } from "zod";

const createPostSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(5000),
});

// GET /api/posts - 获取文章列表
export async function GET() {
  try {
    const posts = await getPosts();
    return NextResponse.json({ posts });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 }
    );
  }
}

// POST /api/posts - 创建文章
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const validatedData = createPostSchema.parse(body);
    
    const post = await createPost({
      ...validatedData,
      authorId: session.user.id,
    });
    
    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 }
    );
  }
}
```

#### 动态路由 API
```typescript
// src/app/api/posts/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getPost, updatePost, deletePost } from "@/server/db/queries/posts";
import { requireAuth } from "@/server/auth/permissions";

// GET /api/posts/[id] - 获取单篇文章
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const post = await getPost(params.id);
    if (!post) {
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ post });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch post" },
      { status: 500 }
    );
  }
}

// PUT /api/posts/[id] - 更新文章
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    
    const existingPost = await getPost(params.id);
    if (!existingPost) {
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 }
      );
    }
    
    // 检查权限：只有作者可以编辑
    if (existingPost.authorId !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }
    
    const updatedPost = await updatePost(params.id, body);
    return NextResponse.json({ post: updatedPost });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update post" },
      { status: 500 }
    );
  }
}

// DELETE /api/posts/[id] - 删除文章
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth();
    
    const existingPost = await getPost(params.id);
    if (!existingPost) {
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 }
      );
    }
    
    // 检查权限：只有作者可以删除
    if (existingPost.authorId !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }
    
    await deletePost(params.id);
    return NextResponse.json({ message: "Post deleted successfully" });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete post" },
      { status: 500 }
    );
  }
}
```

### 2. 创建新的页面

#### 文章列表页面
```typescript
// src/app/posts/page.tsx
import { Button } from "@/components/ui/button";
import { auth } from "@/server/auth-config";
import { getPosts } from "@/server/db/queries/posts";
import Link from "next/link";

export default async function PostsPage() {
  const session = await auth();
  const posts = await getPosts();

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">文章列表</h1>
        {session?.user && (
          <Link href="/posts/create">
            <Button>创建文章</Button>
          </Link>
        )}
      </div>

      <div className="grid gap-6">
        {posts.map((post) => (
          <div key={post.id} className="border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-2">{post.title}</h2>
            <p className="text-gray-600 mb-4">{post.content}</p>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <img
                  src={post.author.image || "/default-avatar.png"}
                  alt={post.author.name}
                  className="w-6 h-6 rounded-full"
                />
                <span className="text-sm text-gray-500">
                  {post.author.name}
                </span>
              </div>
              <span className="text-sm text-gray-500">
                {new Date(post.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        ))}
      </div>

      {posts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">暂无文章</p>
        </div>
      )}
    </div>
  );
}
```

#### 创建文章页面
```typescript
// src/app/posts/create/page.tsx
import { Button } from "@/components/ui/button";
import { auth } from "@/server/auth-config";
import { redirect } from "next/navigation";
import CreatePostForm from "@/components/posts/create-post-form";

export default async function CreatePostPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">创建文章</h1>
      <CreatePostForm authorId={session.user.id} />
    </div>
  );
}
```

### 3. 创建客户端组件

#### 表单组件
```typescript
// src/components/posts/create-post-form.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface CreatePostFormProps {
  authorId: string;
}

export default function CreatePostForm({ authorId }: CreatePostFormProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          content,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create post");
      }

      router.push("/posts");
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="title" className="block text-sm font-medium mb-2">
          标题
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border rounded-md px-3 py-2"
          required
        />
      </div>

      <div>
        <label htmlFor="content" className="block text-sm font-medium mb-2">
          内容
        </label>
        <textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={10}
          className="w-full border rounded-md px-3 py-2"
          required
        />
      </div>

      {error && (
        <div className="text-red-600 text-sm">{error}</div>
      )}

      <Button type="submit" disabled={isLoading}>
        {isLoading ? "创建中..." : "创建文章"}
      </Button>
    </form>
  );
}
```

## 🚀 部署流程说明

### 1. 本地开发部署

#### 启动开发服务器
```bash
# 安装依赖
bun install

# 初始化项目
bun run setup

# 启动开发服务器
bun run dev
```

#### 本地预览 Cloudflare Pages
```bash
# 构建项目
bun run pages:build

# 本地预览
bun run preview
```

### 2. 生产环境部署

#### 自动部署 (推荐)
1. 连接 Git 仓库到 Cloudflare Pages
2. 配置构建命令：`bun run pages:build`
3. 配置输出目录：`.next`
4. 设置环境变量
5. 推送代码自动触发部署

#### 手动部署
```bash
# 构建项目
bun run pages:build

# 部署到 Cloudflare Pages
bun run deploy
```

### 3. 数据库迁移部署

#### 生产环境数据库迁移
```bash
# 生成迁移文件
bun run db:generate

# 应用到生产数据库
bun run db:migrate:prod
```

### 4. 域名配置

#### 自定义域名设置
1. 在 Cloudflare Pages 项目中添加自定义域名
2. 配置 DNS 记录
3. 更新环境变量 `AUTH_URL`
4. 重新部署应用

## 🔧 常见问题解决

### 1. 环境变量问题

#### 问题：环境变量未生效
```bash
# 解决方案
1. 检查 .dev.vars 文件是否存在
2. 重启开发服务器
3. 检查环境变量名称是否正确
4. 确认 src/env.mjs 中已定义
```

#### 问题：生产环境变量缺失
```bash
# 解决方案
1. 检查 Cloudflare Pages 环境变量设置
2. 确认变量名称完全匹配
3. 重新部署应用
4. 检查 wrangler.toml 配置
```

### 2. 数据库连接问题

#### 问题：本地数据库连接失败
```bash
# 解决方案
1. 运行 bun run setup 重新初始化
2. 检查 .wrangler 目录是否存在
3. 删除 .wrangler 目录重新创建
4. 确认 wrangler.toml 配置正确
```

#### 问题：生产数据库迁移失败
```bash
# 解决方案
1. 检查 CLOUDFLARE_D1_API_TOKEN 权限
2. 确认 database_id 正确
3. 检查迁移文件语法
4. 手动执行 SQL 迁移
```

### 3. 认证问题

#### 问题：Mock 认证不工作
```bash
# 解决方案
1. 确认 USE_MOCK_AUTH=true
2. 检查 auth-config.ts 配置
3. 重启开发服务器
4. 清除浏览器缓存
```

#### 问题：OAuth 登录失败
```bash
# 解决方案
1. 检查 OAuth 应用配置
2. 确认回调 URL 正确
3. 检查客户端 ID 和密钥
4. 确认 AUTH_URL 配置正确
```

### 4. 构建部署问题

#### 问题：构建失败
```bash
# 解决方案
1. 检查 TypeScript 错误
2. 确认依赖版本兼容
3. 清除 node_modules 重新安装
4. 检查 Edge Runtime 兼容性
```

#### 问题：部署后功能异常
```bash
# 解决方案
1. 检查生产环境变量
2. 查看部署日志
3. 确认数据库迁移完成
4. 检查 API 路由配置
```

### 5. 性能优化

#### 问题：页面加载慢
```bash
# 解决方案
1. 启用 Edge Runtime
2. 优化图片资源
3. 使用 Cloudflare 缓存
4. 减少包体积
```

#### 问题：数据库查询慢
```bash
# 解决方案
1. 添加数据库索引
2. 优化查询语句
3. 使用分页查询
4. 启用查询缓存
```

## 📚 扩展资源

### 官方文档
- [Next.js 文档](https://nextjs.org/docs)
- [Cloudflare Pages 文档](https://developers.cloudflare.com/pages/)
- [Drizzle ORM 文档](https://orm.drizzle.team/)
- [NextAuth.js 文档](https://next-auth.js.org/)

### 社区资源
- [Cloudflare Discord](https://discord.gg/cloudflaredev)
- [Next.js GitHub](https://github.com/vercel/next.js)
- [Drizzle ORM GitHub](https://github.com/drizzle-team/drizzle-orm)

这个开发指南提供了完整的二次开发流程，帮助您快速扩展和定制 SaaS 应用功能。
