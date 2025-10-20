// Cloudflare Pages Functions for NextAuth with Google OAuth Support

export async function onRequest(context) {
  const { request, env } = context;
  
  try {
    // 使用环境变量，不依赖 process.env
    const NEXTAUTH_SECRET = env.NEXTAUTH_SECRET || 'fallback-secret';
    const NEXTAUTH_URL = env.NEXTAUTH_URL || 'https://cloudflare-saas-stack-9ld.pages.dev';
    const GOOGLE_CLIENT_ID = env.GOOGLE_CLIENT_ID;
    const GOOGLE_CLIENT_SECRET = env.GOOGLE_CLIENT_SECRET;
    const USE_MOCK_AUTH = env.USE_MOCK_AUTH || 'false';
    
    // 获取请求方法和URL
    const url = new URL(request.url);
    const method = request.method;
    
    // 处理 NextAuth 的各种端点
    if (url.pathname.includes('/api/auth/')) {
      // CSRF token 请求
      if (url.searchParams.get('csrf') === 'true') {
        return new Response(JSON.stringify({ csrfToken: 'mock-csrf-token' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      
      // 提供商列表请求
      if (url.searchParams.get('providers') === 'true') {
        return new Response(JSON.stringify({
          google: {
            id: "google",
            name: "Google",
            type: "oauth",
            signinUrl: "/api/auth/signin/google",
            callbackUrl: "/api/auth/callback/google"
          }
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      
      // Google OAuth 登录请求
      if (method === 'GET' && url.pathname.includes('/signin/google')) {
        const redirectUri = `${NEXTAUTH_URL}/api/auth/callback/google`;
        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
          `client_id=${GOOGLE_CLIENT_ID}&` +
          `redirect_uri=${encodeURIComponent(redirectUri)}&` +
          `response_type=code&` +
          `scope=openid email profile&` +
          `prompt=consent&` +
          `access_type=offline`;
        
        return Response.redirect(authUrl, 302);
      }
      
      // Google OAuth 回调处理
      if (method === 'GET' && url.pathname.includes('/callback/google')) {
        const code = url.searchParams.get('code');
        const error = url.searchParams.get('error');
        
        if (error) {
          return Response.redirect(`${NEXTAUTH_URL}/auth/error?error=${error}`, 302);
        }
        
        if (code) {
          try {
            // 交换授权码获取访问令牌
            const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: new URLSearchParams({
                client_id: GOOGLE_CLIENT_ID,
                client_secret: GOOGLE_CLIENT_SECRET,
                code: code,
                grant_type: 'authorization_code',
                redirect_uri: `${NEXTAUTH_URL}/api/auth/callback/google`,
              }),
            });
            
            const tokenData = await tokenResponse.json();
            
            if (tokenData.error) {
              throw new Error(tokenData.error_description || 'Token exchange failed');
            }
            
            // 获取用户信息
            const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
              headers: {
                'Authorization': `Bearer ${tokenData.access_token}`,
              },
            });
            
            const userData = await userResponse.json();
            
            // 创建会话并重定向
            const sessionData = {
              user: {
                id: userData.id,
                name: userData.name,
                email: userData.email,
                image: userData.picture,
              },
              expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
            };
            
            return new Response(null, {
              status: 302,
              headers: {
                'Location': `${NEXTAUTH_URL}/`,
                'Set-Cookie': `next-auth.session-token=${btoa(JSON.stringify(sessionData))}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${30 * 24 * 60 * 60}`,
              },
            });
            
          } catch (error) {
            console.error('Google OAuth callback error:', error);
            return Response.redirect(`${NEXTAUTH_URL}/auth/error?error=OAuthCallback`, 302);
          }
        }
      }
      
      // 登出请求
      if (method === 'POST' && url.pathname.includes('/signout')) {
        return new Response(JSON.stringify({ url: '/' }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Set-Cookie': 'next-auth.session-token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0'
          },
        });
      }
      
      // Session 请求
      if (url.pathname.includes('/session')) {
        const cookieHeader = request.headers.get('cookie');
        let sessionData = { user: null, expires: null };
        
        if (cookieHeader) {
          const sessionCookie = cookieHeader.split(';').find(c => c.trim().startsWith('next-auth.session-token='));
          if (sessionCookie) {
            try {
              const token = sessionCookie.split('=')[1];
              sessionData = JSON.parse(atob(token));
            } catch (error) {
              // 忽略解析错误
            }
          }
        }
        
        return new Response(JSON.stringify(sessionData), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }
    
    return new Response('Auth API endpoint', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
    
  } catch (error) {
    console.error('Auth API Error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
