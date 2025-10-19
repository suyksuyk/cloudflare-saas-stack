import NextAuth from "next-auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "./db";
import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";

// Mock用户数据
const mockUsers = [
  {
    id: "mock-user-1",
    name: "测试用户",
    email: "test@example.com",
    emailVerified: new Date(),
    image: "https://avatars.githubusercontent.com/u/1?v=4",
  },
  {
    id: "mock-user-2", 
    name: "开发者",
    email: "dev@example.com",
    emailVerified: new Date(),
    image: "https://avatars.githubusercontent.com/u/2?v=4",
  }
];

// Mock凭据提供商
const MockProvider = Credentials({
  id: "mock",
  name: "Mock Provider",
  credentials: {
    email: { label: "Email", type: "email" },
    password: { label: "Password", type: "password" }
  },
  async authorize(credentials: Partial<Record<"email" | "password", unknown>>) {
    // 简单的mock验证逻辑
    const email = credentials.email as string;
    const password = credentials.password as string;
    
    if (email === "test@example.com" && password === "password") {
      return mockUsers[0];
    }
    if (email === "dev@example.com" && password === "password") {
      return mockUsers[1];
    }
    return null;
  }
});

const authConfig = NextAuth({
  trustHost: true,
  adapter: DrizzleAdapter(db),
  providers: [MockProvider],
  pages: {
    signIn: "/auth/signin",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user && user.id) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});

// 导出解构的函数
export const {
  handlers: { GET: GET_MOCK, POST: POST_MOCK },
  signIn,
  signOut,
  auth,
} = authConfig;

// 为了向后兼容，也导出带Mock后缀的版本
export const signInMock = signIn;
export const signOutMock = signOut;
export const authMock = auth;

// 导出mock用户数据供开发使用
export { mockUsers };
