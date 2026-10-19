const ACTIVITY_ATTRIBUTES = ['id', 'action', 'entity_type', 'entity_id', 'created_at'];

const clampInteger = (value, fallback, maximum) => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) return fallback;
  return Math.min(parsed, maximum);
};

const buildPersonalActivityQuery = (userId, requestedLimit, requestedOffset) => ({
  where: { actor_user_id: Number(userId) },
  attributes: ACTIVITY_ATTRIBUTES,
  order: [['created_at', 'DESC'], ['id', 'DESC']],
  limit: Math.min(clampInteger(requestedLimit, 50, 100), 100) || 50,
  offset: clampInteger(requestedOffset, 0, 10000),
});

module.exports = { buildPersonalActivityQuery };