const REMEMBER_ME_TOKEN_EXPIRY = '30d';

const getLoginTokenExpiry = (rememberMe, defaultExpiry) => (
  rememberMe === true ? REMEMBER_ME_TOKEN_EXPIRY : defaultExpiry
);

module.exports = { REMEMBER_ME_TOKEN_EXPIRY, getLoginTokenExpiry };