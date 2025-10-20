// Cloudflare Pages Middleware for Next.js
// 简化版本，不依赖外部包

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  
  try {
    // Only handle API routes in middleware
    if (url.pathname.startsWith('/api/')) {
      return await handleAPIRoute(request, env);
    }

    // For all other routes, let Cloudflare Pages handle them naturally
    // This allows Next.js pages to be served properly
    return;
    
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
