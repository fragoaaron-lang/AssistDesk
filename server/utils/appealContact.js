const EMAIL_PATTERN = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;
const DEFAULT_APPEAL_CONTACT_EMAIL = 'fragoaaron@gmail.com';

const getAppealContactEmail = (env = process.env) => {
  const candidates = [
    env.APPEAL_CONTACT_EMAIL,
    DEFAULT_APPEAL_CONTACT_EMAIL,
  ];

  for (const candidate of candidates) {
    const value = String(candidate || '').trim();
    const address = value.match(/<([^<>]+)>/)?.[1]?.trim() || value;
    if (EMAIL_PATTERN.test(address)) return address;
  }

  return null;
};

module.exports = { getAppealContactEmail };