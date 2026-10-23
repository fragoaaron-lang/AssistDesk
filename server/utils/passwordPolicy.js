const REGISTRATION_PASSWORD_POLICY = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,128}$/;
const REGISTRATION_PASSWORD_ERROR = 'Password must be at least 8 characters long, include an uppercase letter, lowercase letter, number, and special character, and use no more than 72 UTF-8 bytes.';

const validateRegistrationPassword = (password) => {
  if (typeof password !== 'string'
    || Buffer.byteLength(password, 'utf8') > 72
    || !REGISTRATION_PASSWORD_POLICY.test(password)) {
    return REGISTRATION_PASSWORD_ERROR;
  }
  return null;
};

module.exports = { REGISTRATION_PASSWORD_ERROR, validateRegistrationPassword };
