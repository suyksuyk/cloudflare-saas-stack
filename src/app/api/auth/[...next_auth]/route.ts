export { GET, POST } from "@/server/auth";
export const runtime = "edge";

// 注意：路由使用 [...next_auth] 以符合 Cloudflare Pages 要求
// Cloudflare Pages 只允许字母数字和下划线字符作为动态路由参数名
