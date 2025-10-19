export async function onRequest(context) {
  const { request, env } = context;
  
  // 这里需要适配 NextAuth 的 Cloudflare Pages Functions 版本
  // 由于复杂性，建议使用 Next.js 的 App Router 与 Cloudflare Pages Functions
  
  return new Response('NextAuth API endpoint', {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
    },
  });
}
