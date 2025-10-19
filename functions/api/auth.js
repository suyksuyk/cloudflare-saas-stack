// Cloudflare Pages Functions for NextAuth
// 简化版本，避免动态路由问题

export async function onRequest(context) {
  const { request, env } = context;
  
  try {
    // 设置环境变量
    process.env.AUTH_SECRET = env.AUTH_SECRET || 'mock-secret-for-development-only';
    process.env.AUTH_URL = env.AUTH_URL || 'https://your-domain.pages.dev';
    process.env.USE_MOCK_AUTH = env.USE_MOCK_AUTH || 'true';
    
    // 获取请求方法和URL
    const url = new URL(request.url);
    const method = request.method;
    
    // 处理 NextAuth 的各种端点
    if (url.pathname.includes('/api/auth/')) {
      // CSRF token 请求
      if (url.searchParams.get('csrf') === 'true') {
        return new Response(JSON.stringify({ csrfToken: 'mock-csrf-token' }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        });
      }
      
      // 提供商列表请求
      if (url.searchParams.get('providers') === 'true') {
        return new Response(JSON.stringify({
          mock: {
            id: "mock",
            name: "Mock Provider",
            type: "credentials",
            signinUrl: "/api/auth/signin/mock",
            callbackUrl: "/api/auth/callback/mock"
          }
        }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        });
      }
      
      // 登录请求
      if (method === 'POST' && url.pathname.includes('/signin')) {
        try {
          const body = await request.json();
          
          // Mock 认证逻辑
          if (body.email === 'test@example.com' && body.password === 'password') {
            return new Response(JSON.stringify({
              url: '/?success=true',
              user: {
                id: 'mock-user-1',
                name: '测试用户',
                email: 'test@example.com',
                image: 'https://avatars.githubusercontent.com/u/1?v=4'
              }
            }), {
              status: 200,
              headers: {
                'Content-Type': 'application/json',
                'Set-Cookie': 'next-auth.session-token=mock-session-token; Path=/; HttpOnly; SameSite=Lax'
              },
            });
          }
          
          if (body.email === 'dev@example.com' && body.password === 'password') {
            return new Response(JSON.stringify({
              url: '/?success=true',
              user: {
                id: 'mock-user-2',
                name: '开发者',
                email: 'dev@example.com',
                image: 'https://avatars.githubusercontent.com/u/2?v=4'
              }
            }), {
              status: 200,
              headers: {
                'Content-Type': 'application/json',
                'Set-Cookie': 'next-auth.session-token=mock-session-token; Path=/; HttpOnly; SameSite=Lax'
              },
            });
          }
          
          // 认证失败
          return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
            status: 401,
            headers: {
              'Content-Type': 'application/json',
            },
          });
        } catch (error) {
          return new Response(JSON.stringify({ error: 'Invalid request' }), {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
            },
          });
        }
      }
      
      // 登出请求
      if (method === 'POST' && url.pathname.includes('/signout')) {
        return new Response(JSON.stringify({
          url: '/'
        }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Set-Cookie': 'next-auth.session-token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0'
          },
        });
      }
      
      // Session 请求
      if (url.pathname.includes('/session')) {
        return new Response(JSON.stringify({
          user: null,
          expires: null
        }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        });
      }
    }
    
    // 默认响应
    return new Response('Auth API endpoint', {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
      },
    });
    
  } catch (error) {
    console.error('Auth API Error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}
