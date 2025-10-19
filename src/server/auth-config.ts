import { auth, signIn, signOut } from "./auth";
import { auth as authMock, signIn as signInMock, signOut as signOutMock } from "./auth-mock";

// 检查是否为开发模式或启用mock模式
const USE_MOCK_AUTH = process.env.USE_MOCK_AUTH === "true" || process.env.NODE_ENV === "development";

// 导出对应的认证函数
export const authFunc = USE_MOCK_AUTH ? authMock : auth;
export const signInFunc = USE_MOCK_AUTH ? signInMock : signIn;
export const signOutFunc = USE_MOCK_AUTH ? signOutMock : signOut;

// 导出配置信息
export { USE_MOCK_AUTH };

// Mock用户信息
export const mockCredentials = {
  testUser: {
    email: "test@example.com",
    password: "password"
  },
  devUser: {
    email: "dev@example.com", 
    password: "password"
  }
};
