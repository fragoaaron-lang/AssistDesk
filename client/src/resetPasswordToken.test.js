import {
  clearResetPasswordToken,
  getResetPasswordToken,
  persistResetPasswordToken,
  RESET_TOKEN_STORAGE_KEY,
} from './resetPasswordToken';

function createStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) || null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
  };
}

test('reset token from the email URL is saved in tab storage and survives a page reload', () => {
  const storage = createStorage();
  const urlParams = new URLSearchParams('token=one-time-reset-token');
  const token = getResetPasswordToken(urlParams, storage);

  persistResetPasswordToken(token, storage);
  expect(storage.getItem(RESET_TOKEN_STORAGE_KEY)).toBe('one-time-reset-token');
  expect(getResetPasswordToken(new URLSearchParams(), storage)).toBe('one-time-reset-token');
});

test('a newly opened reset link replaces an older tab token', () => {
  const storage = createStorage();
  persistResetPasswordToken('older-token', storage);

  expect(getResetPasswordToken(new URLSearchParams('token=new-token'), storage)).toBe('new-token');
  persistResetPasswordToken(getResetPasswordToken(new URLSearchParams('token=new-token'), storage), storage);
  expect(getResetPasswordToken(new URLSearchParams(), storage)).toBe('new-token');
});

test('reset token is cleared after successful reset or confirmed invalidation', () => {
  const storage = createStorage();
  persistResetPasswordToken('one-time-reset-token', storage);
  clearResetPasswordToken(storage);

  expect(getResetPasswordToken(new URLSearchParams(), storage)).toBe('');
});
