import { Platform } from 'react-native';

const TOKEN_KEY = 'kds_auth_token';
const USER_KEY = 'kds_auth_user';
const memoryStore = {};

export async function saveAuthSession(token, user) {
  try {
    memoryStore[TOKEN_KEY] = token;
    memoryStore[USER_KEY] = JSON.stringify(user);
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(TOKEN_KEY, token);
      window.localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
    return true;
  } catch (e) {
    return false;
  }
}

export async function getAuthSession() {
  try {
    let token = memoryStore[TOKEN_KEY];
    let userStr = memoryStore[USER_KEY];
    if (!token && typeof window !== 'undefined' && window.localStorage) {
      token = window.localStorage.getItem(TOKEN_KEY);
      userStr = window.localStorage.getItem(USER_KEY);
    }
    if (token) {
      return { token, user: userStr ? JSON.parse(userStr) : null };
    }
    return null;
  } catch (e) {
    return null;
  }
}

export async function clearAuthSession() {
  delete memoryStore[TOKEN_KEY];
  delete memoryStore[USER_KEY];
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(USER_KEY);
  }
}
