import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
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

export const {
	handlers: { GET, POST },
	signIn,
	signOut,
	auth,
} = NextAuth({
	trustHost: true,
	adapter: DrizzleAdapter(db),
	providers: [
		Credentials({
			name: "mock",
			credentials: {
				email: { label: "邮箱", type: "email" },
				password: { label: "密码", type: "password" },
			},
			async authorize(credentials) {
				// Mock 认证逻辑 - 任何邮箱都可以登录
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
		}),
	],
	pages: {
		signIn: "/auth/signin",
	},
	session: {
		strategy: "jwt",
	},
});
