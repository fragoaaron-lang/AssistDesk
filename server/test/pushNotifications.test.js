const test = require('node:test');
const assert = require('node:assert/strict');
const { getVapidKeys, hashEndpoint, isPushConfigured } = require('../utils/pushNotifications');

test('push endpoint hashes are stable SHA-256 identifiers', () => {
  const endpoint = 'https://push.example.test/subscription/abc';
  const hash = hashEndpoint(endpoint);

  assert.equal(hash, hashEndpoint(endpoint));
  assert.match(hash, /^[a-f0-9]{64}$/);
  assert.notEqual(hash, hashEndpoint(`${endpoint}/different`));
});

test('push delivery is disabled unless both VAPID keys are configured', () => {
  const previousPublicKey = process.env.VAPID_PUBLIC_KEY;
  const previousPrivateKey = process.env.VAPID_PRIVATE_KEY;

  try {
    delete process.env.VAPID_PUBLIC_KEY;
    delete process.env.VAPID_PRIVATE_KEY;
    assert.equal(isPushConfigured(), false);

    process.env.VAPID_PUBLIC_KEY = 'public-key';
    assert.equal(isPushConfigured(), false);

    process.env.VAPID_PRIVATE_KEY = 'private-key';
    assert.equal(isPushConfigured(), true);
    assert.deepEqual(getVapidKeys(), { publicKey: 'public-key', privateKey: 'private-key' });
  } finally {
    if (previousPublicKey === undefined) delete process.env.VAPID_PUBLIC_KEY;
    else process.env.VAPID_PUBLIC_KEY = previousPublicKey;
    if (previousPrivateKey === undefined) delete process.env.VAPID_PRIVATE_KEY;
    else process.env.VAPID_PRIVATE_KEY = previousPrivateKey;
  }
});