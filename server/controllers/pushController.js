const { PushSubscription } = require('../models');
const { getVapidKeys, hashEndpoint, isPushConfigured } = require('../utils/pushNotifications');

exports.getPublicKey = (req, res) => {
  if (!isPushConfigured()) {
    return res.status(503).json({ message: 'Mobile notifications are not configured on the server yet.' });
  }
  return res.json({ publicKey: getVapidKeys().publicKey });
};

exports.saveSubscription = async (req, res) => {
  const endpoint = String(req.body?.endpoint || '');
  const p256dh = String(req.body?.keys?.p256dh || '');
  const auth = String(req.body?.keys?.auth || '');

  if (!isPushConfigured()) {
    return res.status(503).json({ message: 'Mobile notifications are not configured on the server yet.' });
  }
  if (!/^https:\/\//i.test(endpoint) || endpoint.length > 4096 || !p256dh || p256dh.length > 255 || !auth || auth.length > 255) {
    return res.status(400).json({ message: 'A valid push subscription is required.' });
  }

  try {
    const endpoint_hash = hashEndpoint(endpoint);
    const [subscription] = await PushSubscription.findOrCreate({
      where: { endpoint_hash },
      defaults: { user_id: req.user.id, endpoint_hash, endpoint, p256dh, auth },
    });
    if (subscription.user_id !== req.user.id || subscription.endpoint !== endpoint) {
      await subscription.update({ user_id: req.user.id, endpoint, p256dh, auth });
    } else if (subscription.p256dh !== p256dh || subscription.auth !== auth) {
      await subscription.update({ p256dh, auth });
    }
    return res.status(201).json({ message: 'Phone notifications enabled.' });
  } catch (error) {
    console.error(JSON.stringify({ event: 'push_subscription_save_failed', user_id: req.user.id, error_name: error.name || 'Error' }));
    return res.status(500).json({ message: 'Unable to enable phone notifications.' });
  }
};

exports.deleteSubscription = async (req, res) => {
  const endpoint = String(req.body?.endpoint || '');
  if (!/^https:\/\//i.test(endpoint) || endpoint.length > 4096) {
    return res.status(400).json({ message: 'A valid push subscription endpoint is required.' });
  }

  try {
    await PushSubscription.destroy({ where: { user_id: req.user.id, endpoint_hash: hashEndpoint(endpoint) } });
    return res.json({ message: 'Phone notifications disabled.' });
  } catch (error) {
    console.error(JSON.stringify({ event: 'push_subscription_delete_failed', user_id: req.user.id, error_name: error.name || 'Error' }));
    return res.status(500).json({ message: 'Unable to disable phone notifications.' });
  }
};