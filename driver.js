addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url);
  const path = url.pathname; // e.g., /api/driver-login, /api/notes

  let responseBody;
  let statusCode = 200;

  // Define the allowed origin for CORS.
  // IMPORTANT: For local development, you might use 'http://localhost:8080' or similar.
  // For your current Cloudflare Pages preview, it's this specific URL.
  // When you switch to your custom domain (e.g., new-driver-earnings.pages.dev without the hash),
  // you MUST update this to that specific domain.
  const allowedOrigin = 'https://6579bcbb.new-driver-earnings.pages.dev';

  // Handle CORS Preflight (OPTIONS requests)
  // This MUST be at the top of your fetch handler.
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': allowedOrigin, // Allow requests from your specific frontend URL
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400', // Cache preflight for 24 hours
      },
    });
  }

  // Define CORS headers for actual requests (GET, POST, etc.)
  const corsHeaders = {
    'Access-Control-Allow-Origin': allowedOrigin, // Allow requests from your specific frontend URL
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  try {
    if (path === '/api/driver-login' && request.method === 'POST') {
      const data = await request.json();
      // Perform driver login verification here
      // Example: if (data.driverId === "test" && data.password === "pass")
      responseBody = { message: 'Driver login placeholder response. success: true' };
    } else if (path === '/api/notes' && request.method === 'GET') {
      // Example: Fetch driver notes from a KV store or other service
      responseBody = { notes: 'Welcome! Please check here for important updates.' };
    } else if (path === '/api/auth/status' && request.method === 'GET') {
      // Simulate admin setup status
      // Set to true to trigger admin setup, false to show login
      const isAdminSetup = false; // <<< Adjust this based on your backend logic
      responseBody = { isAdminSetup: isAdminSetup };
    } else if (path === '/api/admin/setup' && request.method === 'POST') {
      // Handle initial admin setup
      const data = await request.json();
      // Store admin credentials securely (e.g., in KV or another database)
      responseBody = { message: 'Admin setup successful!' };
    } else if (path === '/api/admin/login' && request.method === 'POST') {
      // Handle admin login
      const data = await request.json();
      // Verify admin credentials
      responseBody = { message: 'Admin login successful!' };
    } else {
      statusCode = 404;
      responseBody = { error: 'Endpoint not found or method not allowed', path: path, method: request.method };
    }
  } catch (e) {
    statusCode = 500;
    responseBody = { error: 'Error processing request', message: e.message };
  }

  return new Response(JSON.stringify(responseBody), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: statusCode,
  });
}

// Placeholder for destructive admin function if needed (e.g., clear all data)
async function clearAllDataBackend() {
  // WARNING: This would delete all driver data and admin settings from the backend.
  // Implement with extreme caution and strong authentication/authorization.
  // Example: await MY_KV_NAMESPACE.delete('all_data_key');
  // displayMessage('All backend data cleared. The application will restart for initial setup.', false);
  // authAndLoad(); // Force logout and re-initialize
}
