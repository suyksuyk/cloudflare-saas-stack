export { GET_MOCK as GET, POST_MOCK as POST } from "@/server/auth-mock";
export const runtime = "edge";

// 注意：路由已从 [...nextauth] 更新为 [...next_auth] 以符合 Cloudflare Pages 要求
// Cloudflare Pages 只允许字母数字和下划线字符作为动态路由参数名
