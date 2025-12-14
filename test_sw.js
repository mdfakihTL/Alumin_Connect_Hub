// Test service worker logic
const testCases = [
  { url: 'https://alumni-portal-yw7q.onrender.com/api/v1/auth/login', method: 'POST', shouldBypass: true },
  { url: 'https://alumni-portal-yw7q.onrender.com/api/v1/events', method: 'GET', shouldBypass: true },
  { url: 'https://alumni-portal-hazel-tau.vercel.app/api/v1/auth/login', method: 'POST', shouldBypass: true },
  { url: 'https://alumni-portal-hazel-tau.vercel.app/static/logo.png', method: 'GET', shouldBypass: false },
];

testCases.forEach(test => {
  const url = new URL(test.url);
  const shouldBypass = 
    url.pathname.startsWith('/api/') ||
    url.hostname.includes('onrender.com') ||
    url.hostname.includes('alumni-portal-yw7q') ||
    test.method !== 'GET';
  
  const pass = shouldBypass === test.shouldBypass;
  console.log(`${pass ? '✅' : '❌'} ${test.method} ${url.pathname} - ${shouldBypass ? 'BYPASS' : 'CACHE'} (expected: ${test.shouldBypass ? 'BYPASS' : 'CACHE'})`);
});
