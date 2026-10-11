const DEVELOPMENT_JWT_SECRET = 'assistdesk-local-development-only-secret';
const REJECTED_PRODUCTION_SECRETS = new Set([
  'assistdesk-secret',
  'change-me',
  'your-secret',
  DEVELOPMENT_JWT_SECRET,
]);

function getJwtSecret(env = process.env) {
  const secret = String(env.JWT_SECRET || '').trim();
  if (!secret) {
    if (env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET must be configured in production with a unique random value of at least 32 characters.');
    }
    return DEVELOPMENT_JWT_SECRET;
  }

  if (env.NODE_ENV === 'production'
    && (Buffer.byteLength(secret, 'utf8') < 32
      || REJECTED_PRODUCTION_SECRETS.has(secret.toLowerCase())
      || /^(change|replace|your|example|placeholder)[-_ ]/i.test(secret))) {
    throw new Error('JWT_SECRET is unsafe for production. Configure a unique random value of at least 32 characters.');
  }

  return secret;
}

function assertSecurityConfig(env = process.env) {
  getJwtSecret(env);
}

function getAllowedOrigins(env = process.env) {
  const origins = [
    env.CLIENT_URL,
    env.FRONTEND_URL,
    'https://assist-desk-ebon.vercel.app',
  ];
  if (env.NODE_ENV !== 'production') {
    origins.push('http://localhost:3005', 'http://localhost:3000');
  }

  return [...new Set(origins.map((value) => {
    if (!value) return null;
    try {
      const parsed = new URL(value);
      if (env.NODE_ENV === 'production' && parsed.protocol !== 'https:') return null;
      return parsed.origin;
    } catch {
      return null;
    }
  }).filter(Boolean))];
}

function getFrontendUrl(env = process.env) {
  const configuredUrl = env.FRONTEND_URL || env.CLIENT_URL || 'https://assist-desk-ebon.vercel.app';
  let parsed;
  try {
    parsed = new URL(configuredUrl);
  } catch {
    throw new Error('Frontend URL must be an absolute HTTP(S) URL.');
  }
  if (!['http:', 'https:'].includes(parsed.protocol)
    || (env.NODE_ENV === 'production' && parsed.protocol !== 'https:')) {
    throw new Error('Production frontend URL must use HTTPS.');
  }
  return parsed.origin;
}

function getTrustProxyHops(env = process.env) {
  const configuredHops = env.TRUST_PROXY_HOPS;
  const hops = configuredHops == null || configuredHops === ''
    ? (env.NODE_ENV === 'production' ? 1 : 0)
    : Number(configuredHops);
  if (!Number.isInteger(hops) || hops < 0 || hops > 3) {
    throw new Error('TRUST_PROXY_HOPS must be an integer from 0 to 3.');
  }
  return hops;
}

module.exports = { assertSecurityConfig, getAllowedOrigins, getFrontendUrl, getJwtSecret, getTrustProxyHops };
