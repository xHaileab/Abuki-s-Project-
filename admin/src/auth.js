/**
 * The admin app holds a single bearer token in localStorage.
 *
 * No real user system — this is an operator tool. The token matches whatever
 * ADMIN_TOKEN the backend has been configured with.
 */

const KEY = 'dream.admin.token';

export function getToken() {
  try {
    return localStorage.getItem(KEY) || '';
  } catch {
    return '';
  }
}

export function setToken(token) {
  if (token) localStorage.setItem(KEY, token);
  else localStorage.removeItem(KEY);
}

export function isAuthed() {
  return Boolean(getToken());
}
