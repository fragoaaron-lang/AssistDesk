export const RESET_TOKEN_STORAGE_KEY = 'assistdesk_password_reset_token';

export const getResetPasswordToken = (searchParams, storage = window.sessionStorage) => (
  searchParams.get('token') || storage.getItem(RESET_TOKEN_STORAGE_KEY) || ''
);

export const persistResetPasswordToken = (token, storage = window.sessionStorage) => {
  if (token) storage.setItem(RESET_TOKEN_STORAGE_KEY, token);
};

export const clearResetPasswordToken = (storage = window.sessionStorage) => {
  storage.removeItem(RESET_TOKEN_STORAGE_KEY);
};
