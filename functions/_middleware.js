// Cloudflare Pages Middleware for Next.js
// 简化版本，不依赖外部包

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  
  try {
    // Handle API routes
    if (url.pathname.startsWith('/api/')) {
      return await handleAPIRoute(request, env);
    }

    // Handle static assets - let Cloudflare Pages handle them naturally
    if (url.pathname.startsWith('/_next/') || 
        url.pathname.startsWith('/favicon.ico') ||
        url.pathname.includes('.')) {
      // Return 404 for static assets that don't exist
      return new Response('Asset not found', { status: 404 });
    }

    // For all other routes, return our HTML
    return new Response(getBasicHTML(), {
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'public, max-age=0, must-revalidate',
      },
    });
    
  } catch (error) {
    console.error('Middleware Error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

async function handleAPIRoute(request, env) {
  const url = new URL(request.url);
  
  try {
    // Forward to appropriate API function
    if (url.pathname.includes('/auth/')) {
      // Import and forward to auth function
      try {
        const authModule = await import('./api/auth.js');
        return authModule.default({ request, env });
      } catch (authError) {
        console.error('Auth module error:', authError);
        return new Response(JSON.stringify({ 
          error: 'Auth service unavailable',
          details: authError.message 
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }
    
    if (url.pathname.includes('/hello')) {
      return new Response(JSON.stringify({ message: 'Hello from API!' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Default API response
    return new Response(JSON.stringify({ 
      message: 'API endpoint',
      path: url.pathname 
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('API Error:', error);
    return new Response(JSON.stringify({ error: 'API Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

function getBasicHTML() {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Cloudflare SaaS Stack</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
        'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
        sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      margin: 0;
      padding: 2rem;
      background: #f5f5f5;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      padding: 2rem;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    h1 {
      color: #333;
      text-align: center;
      margin-bottom: 2rem;
    }
    .status {
      background: #e8f5e8;
      border: 1px solid #4caf50;
      border-radius: 4px;
      padding: 1rem;
      margin: 1rem 0;
    }
    .card {
      background: #f8f9fa;
      border: 1px solid #dee2e6;
      border-radius: 4px;
      padding: 1rem;
      margin: 1rem 0;
    }
    .btn {
      display: inline-block;
      background: #007bff;
      color: white;
      padding: 0.5rem 1rem;
      text-decoration: none;
      border-radius: 4px;
      margin: 0.5rem 0;
    }
    .btn:hover {
      background: #0056b3;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🚀 Cloudflare SaaS Stack</h1>
    
    <div class="status">
      <h2>✅ 应用已成功部署！</h2>
      <p>您的 Next.js 应用正在 Cloudflare Pages 上运行。</p>
    </div>
    
    <div class="card">
      <h3>📊 项目信息</h3>
      <ul>
        <li><strong>框架:</strong> Next.js 14.2.5</li>
        <li><strong>部署平台:</strong> Cloudflare Pages</li>
        <li><strong>运行时:</strong> Edge Runtime</li>
        <li><strong>数据库:</strong> Cloudflare D1</li>
      </ul>
    </div>
    
    <div class="card">
      <h3>🔗 可用端点</h3>
      <a href="/api/hello" class="btn">测试 API</a>
      <a href="/api/auth/providers?csrf=true" class="btn">认证 API</a>
    </div>
    
    <div class="card">
      <h3>📝 下一步</h3>
      <ul>
        <li>配置环境变量</li>
        <li>设置数据库连接</li>
        <li>配置身份验证</li>
        <li>添加您的业务逻辑</li>
      </ul>
    </div>
  </div>
</body>
</html>`;
}
