function randomHex(bytes) {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  return Array.from(buf).map(b => b.toString(16).padStart(2, '0')).join('');
}

function callbackPage(status, token) {
  return new Response(`<!doctype html><html><head><meta charset="utf-8"><title>Authorizing…</title></head><body>
  <p>Authorizing Decap…</p>
  <script>
    const receiveMessage = () => {
      window.opener.postMessage(
        'authorization:github:${status}:${JSON.stringify({ token })}',
        '*'
      );
      window.removeEventListener('message', receiveMessage, false);
    };
    window.addEventListener('message', receiveMessage, false);
    window.opener.postMessage('authorizing:github', '*');
  </script></body></html>`, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

async function handleAuth(url, env) {
  if (!env.GITHUB_OAUTH_ID || !env.GITHUB_OAUTH_SECRET) {
    return new Response('GitHub OAuth secrets are not configured', { status: 500 });
  }
  const provider = url.searchParams.get('provider');
  if (provider && provider !== 'github') return new Response('Invalid provider', { status: 400 });

  const callback = `${url.origin}/callback`;
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: env.GITHUB_OAUTH_ID,
    redirect_uri: callback,
    scope: 'public_repo,user',
    state: randomHex(8)
  });
  return Response.redirect('https://github.com/login/oauth/authorize?' + params.toString(), 302);
}

async function handleCallback(url, env) {
  const provider = url.searchParams.get('provider');
  if (provider && provider !== 'github') return new Response('Invalid provider', { status: 400 });
  const code = url.searchParams.get('code');
  if (!code) return new Response('Missing code', { status: 400 });

  const callback = `${url.origin}/callback`;
  const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: env.GITHUB_OAUTH_ID,
      client_secret: env.GITHUB_OAUTH_SECRET,
      code,
      redirect_uri: callback
    })
  });
  const data = await tokenResponse.json();
  if (!data.access_token) {
    return new Response('GitHub OAuth failed', { status: 401 });
  }
  return callbackPage('success', data.access_token);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/auth') return handleAuth(url, env);
    if (url.pathname === '/callback') return handleCallback(url, env);
    return env.ASSETS.fetch(request);
  }
};
