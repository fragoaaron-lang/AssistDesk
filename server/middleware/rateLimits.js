const { rateLimit } = require('express-rate-limit');
const crypto = require('crypto');
const { getJwtSecret } = require('../config/security');
const logKey = getJwtSecret();

const logRateLimit = (req, scope) => {
  const source = String(req.ip || req.socket?.remoteAddress || 'unknown');
  const sourceHash = crypto.createHmac('sha256', logKey).update(source).digest('hex').slice(0, 20);
  console.warn(JSON.stringify({
    event: 'rate_limit_exceeded',
    scope,
    request_id: req.requestId || null,
    source_hash: sourceHash,
    method: req.method,
    path: req.path,
    user_id: req.user?.id || null,
  }));
};

const createLimiter = ({ windowMs, limit, scope, message = 'Too many requests. Please try again later.' }) => rateLimit({
  windowMs,
  limit,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message },
  handler: (req, res) => {
    logRateLimit(req, scope);
    return res.status(429).json({ message, request_id: req.requestId || null });
  },
});

const loginLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  scope: 'login',
  message: 'Too many sign-in attempts. Please try again later.',
});

const accountRecoveryLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 15,
  scope: 'account_recovery',
  message: 'Too many account recovery requests. Please try again later.',
});

const accountAppealLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  scope: 'account_appeal',
  message: 'Too many appeal submissions. Please try again later.',
});

const staffIdSubmissionLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  scope: 'staff_id_submission',
  message: 'Too many ID submissions. Please try again later.',
});

const registrationLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  limit: 60,
  scope: 'registration',
  message: 'Too many registration requests. Please try again later.',
});

const ticketCreationLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  scope: 'ticket_creation',
  message: 'Too many ticket submissions. Please try again later.',
});

const aiRequestLimiter = createLimiter({
  windowMs: 60 * 1000,
  limit: 60,
  scope: 'ai_request',
  message: 'Assistant request limit reached. Please try again shortly.',
});

const apiRequestLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 5000,
  scope: 'api',
  message: 'API request limit reached. Please try again later.',
});

module.exports = { accountAppealLimiter, accountRecoveryLimiter, aiRequestLimiter, apiRequestLimiter, createLimiter, loginLimiter, registrationLimiter, staffIdSubmissionLimiter, ticketCreationLimiter };
