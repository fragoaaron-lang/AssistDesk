const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { getAllowedOrigins, getJwtSecret } = require('../config/security');

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

test('deployment CSP hashes the campus map script instead of allowing inline scripts', () => {
  const workspace = path.resolve(__dirname, '..');
  const mapHtml = fs.readFileSync(path.join(workspace, '../client/public/campus-map-3d-v3.html'), 'utf8');
  const inlineScript = [...mapHtml.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)]
    .map((match) => match[1])
    .find((script) => script.trim());
  assert.ok(inlineScript, 'campus map has a script requiring an explicit CSP hash');

  const normalizedScript = inlineScript.replace(/\r\n?/g, '\n');
  const digest = crypto.createHash('sha256').update(normalizedScript).digest('base64');
  const cspHash = `'sha256-${digest}'`;
  const vercelConfig = fs.readFileSync(path.join(workspace, '../client/vercel.json'), 'utf8');
  const expressConfig = fs.readFileSync(path.join(workspace, 'server.js'), 'utf8');

  assert.ok(vercelConfig.includes(cspHash), 'Vercel CSP hash must match the inline campus map script');
  assert.ok(expressConfig.includes(cspHash), 'Express CSP hash must match the inline campus map script');
  assert.equal(vercelConfig.includes("script-src 'self' 'unsafe-inline'"), false);
  assert.equal(expressConfig.includes("'script-src-attr': [\"'unsafe-inline'\"]"), false);
});
