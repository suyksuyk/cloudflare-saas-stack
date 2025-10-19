// Cloudflare Pages Middleware for Next.js
// 处理 Next.js 服务器端渲染

import { getAssetFromKV, mapRequestToAsset } from '@cloudflare/kv-asset-handler';

/**
 * The DEBUG flag will do two things that help during development:
 * 1. we will skip caching on the edge, which makes it easier to
 *    debug.
 * 2. we will return an error message on exception in your Response rather
 *    than the default 404.html page.
 */
const DEBUG = false;

addEventListener('fetch', event => {
  try {
    event.respondWith(handleEvent(event));
  } catch (e) {
    if (DEBUG) {
      return event.respondWith(
        new Response(e.message || e.toString(), {
          status: 500,
        }),
      );
    }
    event.respondWith(new Response('Internal Error', { status: 500 }));
  }
});

async function handleEvent(event) {
  const url = new URL(event.request.url);
  let options = {};

  /**
   * You can add custom logic to how we fetch your assets
   * by configuring the function `mapRequestToAsset`
   */
  // options.mapRequestToAsset = handlePrefix(/^\/docs/);

  try {
    if (DEBUG) {
      // customize caching
      options.cacheControl = {
        bypassCache: true,
      };
    }

    // Handle API routes separately
    if (url.pathname.startsWith('/api/')) {
      return await handleAPIRoute(event.request);
    }

    // Handle static assets
    if (url.pathname.startsWith('/_next/') || 
        url.pathname.startsWith('/favicon.ico') ||
        url.pathname.includes('.')) {
      return await getAssetFromKV(event, options);
    }

    // For all other routes, try to serve static files first
    try {
      return await getAssetFromKV(event, {
        ...options,
        mapRequestToAsset: req => new Request(`${new URL(req.url).origin}/index.html`, req),
      });
    } catch (e) {
      // If no static file found, return a basic HTML response
      return new Response(getBasicHTML(), {
        headers: {
          'Content-Type': 'text/html',
          'Cache-Control': 'public, max-age=0, must-revalidate',
        },
      });
    }
  } catch (e) {
    // if an error is thrown try to serve the asset at 404.html
    if (!DEBUG) {
      try {
        let notFoundResponse = await getAssetFromKV(event, {
          mapRequestToAsset: req => new Request(`${new URL(req.url).origin}/404.html`, req),
        });

        return new Response(notFoundResponse.body, { ...notFoundResponse, status: 404 });
      } catch (e) {}
    }

    return new Response(e.message || e.toString(), { status: 500 });
  }
}

async function handleAPIRoute(request) {
  const url = new URL(request.url);
  
  // Forward to appropriate API function
  if (url.pathname.includes('/auth/')) {
    // Import and forward to auth function
    const authModule = await import('./api/auth.js');
    return authModule.default({ request, env: {} });
  }
  
  // Default API response
  return new Response(JSON.stringify({ message: 'API endpoint' }), {
    headers: { 'Content-Type': 'application/json' },
  });
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
    }
    .status {
      background: #e8f5e8;
      border: 1px solid #4caf50;
      border-radius: 4px;
      padding: 1rem;
      margin: 1rem 0;
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
    <div>
      <h3>下一步：</h3>
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
