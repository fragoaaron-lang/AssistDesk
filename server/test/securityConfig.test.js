const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { getAllowedOrigins, getFrontendUrl, getJwtSecret, getTrustProxyHops } = require('../config/security');

test('production requires a unique, sufficiently long JWT secret', () => {
  assert.throws(() => getJwtSecret({ NODE_ENV: 'production' }), /must be configured in production/);
  assert.throws(() => getJwtSecret({ NODE_ENV: 'production', JWT_SECRET: 'assistdesk-secret' }), /unsafe for production/);
  assert.throws(() => getJwtSecret({ NODE_ENV: 'production', JWT_SECRET: 'short-secret' }), /unsafe for production/);
  assert.equal(getJwtSecret({ NODE_ENV: 'production', JWT_SECRET: 'a-unique-random-production-secret-with-adequate-length' }), 'a-unique-random-production-secret-with-adequate-length');
});

test('development has a local-only fallback JWT secret', () => {
  assert.match(getJwtSecret({ NODE_ENV: 'development' }), /local-development-only/);
});

test('production origins are normalized and exclude localhost', () => {
  const origins = getAllowedOrigins({
    NODE_ENV: 'production',
    CLIENT_URL: 'https://portal.example.test/path',
    FRONTEND_URL: 'https://portal.example.test',
  });
  assert.deepEqual(origins, ['https://portal.example.test', 'https://assist-desk-ebon.vercel.app']);
  assert.equal(origins.some((origin) => origin.includes('localhost')), false);
});

test('production rejects explicitly configured insecure HTTP origins', () => {
  const origins = getAllowedOrigins({
    NODE_ENV: 'production',
    CLIENT_URL: 'http://localhost:3000',
    FRONTEND_URL: 'http://portal.example.test',
  });
  assert.deepEqual(origins, ['https://assist-desk-ebon.vercel.app']);
});

test('development origins include local frontend ports', () => {
  const origins = getAllowedOrigins({ NODE_ENV: 'development' });
  assert.ok(origins.includes('http://localhost:3000'));
  assert.ok(origins.includes('http://localhost:3005'));
});

test('frontend reset links require HTTPS in production and discard paths', () => {
  assert.equal(getFrontendUrl({ NODE_ENV: 'production', FRONTEND_URL: 'https://portal.example.test/subpath' }), 'https://portal.example.test');
  assert.throws(() => getFrontendUrl({ NODE_ENV: 'production', FRONTEND_URL: 'http://portal.example.test' }), /must use HTTPS/);
});

test('trusted proxy configuration is bounded and environment-aware', () => {
  assert.equal(getTrustProxyHops({ NODE_ENV: 'development' }), 0);
  assert.equal(getTrustProxyHops({ NODE_ENV: 'production' }), 1);
  assert.equal(getTrustProxyHops({ NODE_ENV: 'production', TRUST_PROXY_HOPS: '2' }), 2);
  assert.throws(() => getTrustProxyHops({ NODE_ENV: 'production', TRUST_PROXY_HOPS: '4' }), /integer from 0 to 3/);
});

test('campus map initializes from a same-origin script allowed by deployment CSP', () => {
  const workspace = path.resolve(__dirname, '..');
  const mapHtml = fs.readFileSync(path.join(workspace, '../client/public/campus-map-3d-v3.html'), 'utf8');
  const mapScript = '/campus-map-3d-v3.js';
  const vercelConfig = fs.readFileSync(path.join(workspace, '../client/vercel.json'), 'utf8');
  const expressConfig = fs.readFileSync(path.join(workspace, 'server.js'), 'utf8');
  const mapScriptPath = path.join(workspace, '../client/public', mapScript.slice(1));
  const externalScripts = [...mapHtml.matchAll(/<script\b([^>]*)\bsrc="([^"]+)"([^>]*)><\/script>/gi)];
  const inlineScripts = [...mapHtml.matchAll(/<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)];

  assert.ok(fs.existsSync(mapScriptPath), 'same-origin campus map script must be deployed with the HTML');
  assert.ok(externalScripts.some(([, , src]) => src === mapScript), 'map HTML must load the same-origin initializer');
  assert.equal(inlineScripts.length, 0, 'map HTML must not depend on inline scripts blocked by CSP');
  assert.ok(vercelConfig.includes("script-src 'self'"), 'Vercel CSP must allow same-origin scripts');
  assert.ok(expressConfig.includes("'script-src': [\"'self'\""), 'Express CSP must allow same-origin scripts');
  assert.equal(vercelConfig.includes("script-src 'self' 'unsafe-inline'"), false);
  assert.equal(expressConfig.includes("'script-src-attr': [\"'unsafe-inline'\"]"), false);
  assert.ok(externalScripts.length > 0);
  externalScripts.filter(([, , src]) => src.startsWith('https://cdn.jsdelivr.net')).forEach(([, , before, after]) => {
    assert.match(`${before} ${after}`, /integrity="sha384-[A-Za-z0-9+/=]+"/);
    assert.match(`${before} ${after}`, /crossorigin="anonymous"/);
  });
});
