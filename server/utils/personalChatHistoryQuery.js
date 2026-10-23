const PERSONAL_CHAT_HISTORY_ATTRIBUTES = [
  'id',
  'message',
  'ai_response',
  'matched_department_id',
  'matched_faq_id',
  'matched_service_id',
  'created_at',
];

const clampInteger = (value, fallback, maximum) => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) return fallback;
  return Math.min(parsed, maximum);
};

const buildPersonalChatHistoryQuery = (userId, requestedLimit, requestedOffset) => ({
  where: { user_id: Number(userId) },
  attributes: PERSONAL_CHAT_HISTORY_ATTRIBUTES,
  order: [['created_at', 'DESC'], ['id', 'DESC']],
  limit: Math.min(clampInteger(requestedLimit, 25, 100), 100) || 25,
  offset: clampInteger(requestedOffset, 0, 10000),
});

module.exports = { PERSONAL_CHAT_HISTORY_ATTRIBUTES, buildPersonalChatHistoryQuery };
