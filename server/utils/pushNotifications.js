const crypto = require('crypto');
const webPush = require('web-push');

const getVapidKeys = () => ({
  publicKey: String(process.env.VAPID_PUBLIC_KEY || '').trim(),
  privateKey: String(process.env.VAPID_PRIVATE_KEY || '').trim(),
});

const isPushConfigured = () => {
  const { publicKey, privateKey } = getVapidKeys();
  return Boolean(publicKey && privateKey);
};

const hashEndpoint = (endpoint) => crypto.createHash('sha256').update(endpoint).digest('hex');

const sendPushToUser = async (userId, notification) => {
  if (!isPushConfigured()) return;

  const { publicKey, privateKey } = getVapidKeys();
  webPush.setVapidDetails(
    process.env.VAPID_SUBJECT || `mailto:${process.env.MAIL_USER || 'support@assistdesk.local'}`,
    publicKey,
    privateKey
  );

  const { PushSubscription } = require('../models');
  const subscriptions = await PushSubscription.findAll({ where: { user_id: userId } });
  const payload = JSON.stringify({
    title: 'AssistDesk',
    body: 'You have a new support update. Open AssistDesk to view details.',
    url: '/dashboard',
    tag: `assistdesk-notification-${notification.id}`,
  });

  await Promise.all(subscriptions.map(async (savedSubscription) => {
    try {
      await webPush.sendNotification({
        endpoint: savedSubscription.endpoint,
        keys: { p256dh: savedSubscription.p256dh, auth: savedSubscription.auth },
      }, payload, { TTL: 60 * 60 });
    } catch (error) {
      if (error.statusCode === 404 || error.statusCode === 410) {
        await savedSubscription.destroy();
      } else {
        console.error(JSON.stringify({ event: 'push_delivery_failed', user_id: userId, error_name: error.name || 'Error', status_code: error.statusCode || null }));
      }
    }
  }));
};

module.exports = { getVapidKeys, hashEndpoint, isPushConfigured, sendPushToUser };