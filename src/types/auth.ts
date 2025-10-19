import { DefaultSession } from "next-auth";
import { JWT } from "next-auth/jwt";

// 扩展 NextAuth 类型定义
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      emailVerified?: Date | null;
    } & DefaultSession["user"];
  }

  interface User {
    emailVerified?: Date | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    emailVerified?: Date | null;
  }
}

// 认证错误类型
export interface AuthError {
  error: string;
  description?: string;
  code?: string;
  statusCode?: number;
}

// 认证选项
export interface SignInOptions {
  callbackUrl?: string;
  redirect?: boolean;
  provider?: string;
}

export interface SignOutOptions {
  callbackUrl?: string;
}

// 用户信息类型
export interface UserInfo {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  emailVerified?: Date | null;
}

// 认证状态类型
export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

// 认证配置类型
export interface AuthConfig {
  providers: Array<{
    id: string;
    name: string;
    type: string;
    [key: string]: any;
  }>;
  pages: {
    signIn: string;
    error: string;
    newUser?: string;
  };
  session: {
    strategy: "database" | "jwt";
    maxAge: number;
    updateAge: number;
  };
  callbacks: {
    signIn: (params: {
      user: any;
      account: any;
      profile?: any;
      email?: { verificationRequest?: boolean };
      credentials?: any;
    }) => Promise<boolean> | boolean;
    session: (params: {
      session: any;
      token?: JWT;
      user?: any;
    }) => Promise<any> | any;
    redirect: (params: { url: string; baseUrl: string }) => Promise<string> | string;
    jwt?: (params: { token: JWT; user?: any; account?: any; profile?: any; trigger?: "signIn" | " signUp" | "update" }) => Promise<JWT> | JWT;
  };
  events: {
    signIn: (params: {
      user: any;
      account: any;
      profile?: any;
      isNewUser?: boolean;
    }) => Promise<void> | void;
    signOut: (params: { session: any; token?: JWT }) => Promise<void> | void;
    createUser?: (params: { user: any }) => Promise<void> | void;
    linkAccount?: (params: { user: any; account: any; profile?: any }) => Promise<void> | void;
    session?: (params: { session: any; token: JWT }) => Promise<void> | void;
  };
}

// OAuth 提供商配置
export interface OAuthProviderConfig {
  clientId: string;
  clientSecret: string;
  authorization?: {
    params?: Record<string, string>;
  };
  userinfo?: {
    params?: Record<string, string>;
  };
  token?: {
    params?: Record<string, string>;
  };
  allowlist?: string[];
  blocklist?: string[];
}

// Google OAuth 配置
export interface GoogleOAuthConfig extends OAuthProviderConfig {
  clientId: string;
  clientSecret: string;
  authorization?: {
    params: {
      prompt?: string;
      access_type?: string;
      response_type?: string;
      scope?: string;
    };
  };
}

// 认证响应类型
export interface AuthResponse<T = any> {
  success: boolean;
  data?: T;
  error?: AuthError;
}

// 会话信息类型
export interface SessionInfo {
  expires: string;
  user: UserInfo;
}

// 登录结果类型
export interface SignInResult {
  ok: boolean;
  error?: string;
  status?: number;
  url?: string;
}

// 登出结果类型
export interface SignOutResult {
  url?: string;
}

// 认证提供者类型
export type AuthProvider = "google" | "credentials" | "mock";

// 错误代码枚举
export enum AuthErrorCode {
  OAUTH_SIGNIN = "OAuthSignin",
  OAUTH_CALLBACK = "OAuthCallback",
  OAUTH_CREATE_ACCOUNT = "OAuthCreateAccount",
  EMAIL_CREATE_ACCOUNT = "EmailCreateAccount",
  CALLBACK = "Callback",
  OAUTH_ACCOUNT_NOT_LINKED = "OAuthAccountNotLinked",
  SESSION_REQUIRED = "SessionRequired",
  DEFAULT = "Default",
  NETWORK_ERROR = "NetworkError",
  INVALID_CREDENTIALS = "InvalidCredentials",
  ACCESS_DENIED = "AccessDenied",
}

// 错误消息映射
export const AUTH_ERROR_MESSAGES: Record<AuthErrorCode, string> = {
  [AuthErrorCode.OAUTH_SIGNIN]: "OAuth登录失败，请重试",
  [AuthErrorCode.OAUTH_CALLBACK]: "OAuth回调失败，请重试",
  [AuthErrorCode.OAUTH_CREATE_ACCOUNT]: "创建账户失败，请重试",
  [AuthErrorCode.EMAIL_CREATE_ACCOUNT]: "创建账户失败，请重试",
  [AuthErrorCode.CALLBACK]: "回调失败，请重试",
  [AuthErrorCode.OAUTH_ACCOUNT_NOT_LINKED]: "账户已存在但未关联，请使用其他登录方式",
  [AuthErrorCode.SESSION_REQUIRED]: "需要登录才能访问",
  [AuthErrorCode.DEFAULT]: "登录失败，请重试",
  [AuthErrorCode.NETWORK_ERROR]: "网络错误，请检查网络连接",
  [AuthErrorCode.INVALID_CREDENTIALS]: "无效的凭据",
  [AuthErrorCode.ACCESS_DENIED]: "访问被拒绝",
};
