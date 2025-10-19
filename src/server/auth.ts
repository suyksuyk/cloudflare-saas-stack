import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "./db";
import { users } from "./db/schema";
import { eq } from "drizzle-orm";

// Mock 用户数据
const mockUsers = [
	{
		id: "mock-user-1",
		name: "测试用户",
		email: "test@example.com",
		image: "https://avatars.githubusercontent.com/u/1?v=4",
	},
	{
		id: "mock-user-2", 
		name: "开发者",
		email: "dev@example.com",
		image: "https://avatars.githubusercontent.com/u/2?v=4",
	}
];

// 配置providers数组
const providers: any[] = [
	// Google OAuth Provider - 生产环境配置
	Google({
		clientId: process.env.GOOGLE_CLIENT_ID!,
		clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
		authorization: {
			params: {
				prompt: "consent",
				access_type: "offline",
				response_type: "code",
				scope: "openid email profile",
			},
		},
		// 允许的用户邮箱域名（可选，生产环境可启用）
		// allowlist: process.env.ALLOWED_DOMAINS?.split(",") || [],
	}),
];

// Mock Credentials Provider (仅用于开发测试)
if (process.env.NODE_ENV === "development") {
	providers.push(Credentials({
		name: "mock",
		credentials: {
			email: { label: "邮箱", type: "email" },
			password: { label: "密码", type: "password" },
		},
		async authorize(credentials) {
			// Mock 认证逻辑 - 仅开发环境
			if (credentials?.email) {
				const email = credentials.email as string;
				const mockUser = mockUsers.find(u => u.email === email);
				if (mockUser) {
					return mockUser;
				}
				
				// 如果不是预设用户，创建一个新的 mock 用户
				const newMockUser = {
					id: `mock-${Date.now()}`,
					name: email.split('@')[0],
					email: email,
					image: `https://ui-avatars.com/api/?name=${encodeURIComponent(email)}&background=random`,
				};
				
				// 确保用户存在于数据库中
				await db.insert(users).values({
					id: newMockUser.id,
					name: newMockUser.name,
					email: newMockUser.email,
					emailVerified: new Date(),
					image: newMockUser.image,
				}).onConflictDoNothing();
				
				return newMockUser;
			}
			return null;
		},
	}));
}

export const {
	handlers: { GET, POST },
	signIn,
	signOut,
	auth,
} = NextAuth({
	trustHost: true,
	adapter: DrizzleAdapter(db),
	providers,
	pages: {
		signIn: "/auth/signin",
		error: "/auth/error",
	},
	session: {
		strategy: "database",
		maxAge: 30 * 24 * 60 * 60, // 30 days
		updateAge: 24 * 60 * 60, // 24 hours
	},
	callbacks: {
		async signIn({ user, account, profile }) {
			// 验证用户邮箱域名（如果配置了允许的域名）
			const allowedDomains = process.env.ALLOWED_DOMAINS?.split(",");
			if (allowedDomains && allowedDomains.length > 0 && user.email) {
				const domain = user.email.split("@")[1];
				if (!domain || !allowedDomains.includes(domain)) {
					return false;
				}
			}
			
			return true;
		},
		async session({ session, user }) {
			// 确保session包含用户ID
			if (session.user && user) {
				session.user.id = user.id;
			}
			return session;
		},
		async redirect({ url, baseUrl }) {
			// 安全的重定向处理
			if (url.startsWith("/")) return `${baseUrl}${url}`;
			if (url.startsWith(baseUrl)) return url;
			return baseUrl;
		},
	},
	events: {
		async signIn({ user, account, profile, isNewUser }) {
			// 记录新用户注册事件
			if (isNewUser) {
				console.log(`新用户注册: ${user.email} (${account?.provider})`);
			}
		},
		async signOut(message: { session: any } | { token: any }) {
			// 记录用户登出事件
			if ('session' in message && message.session && 'user' in message.session && message.session.user) {
				console.log(`用户登出: ${(message.session.user as any).email}`);
			}
		},
	},
});
