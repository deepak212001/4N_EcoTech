/**
 * Session JSON cache (optional). Token lives in tokenPersist.js.
 */

import {
  clearPersistedToken,
  readPersistedToken,
  writePersistedToken,
} from './tokenPersist';
import { safeGetItem, safeRemoveItem, safeSetItem } from './safeAsyncStorage';

const KEY_SESSION = '@AppointmentApp.auth.session';

function pickTokenFromSession(session) {
  if (!session || typeof session !== 'object') {
    return null;
  }
  const fromData = session.data && session.data.token;
  const top = session.token;
  const t = fromData || top;
  return typeof t === 'string' && t.length > 0 ? t : null;
}

export async function loadStoredToken() {
  return readPersistedToken();
}

/**
 * @param {object} session - login/register API JSON (ApiResponse shape)
 */
export async function saveAuth(session) {
  const token = pickTokenFromSession(session);
  if (!token) {
    return;
  }
  await writePersistedToken(token);

  try {
    const plain = JSON.parse(JSON.stringify(session));
    if (!plain.data || typeof plain.data !== 'object') {
      plain.data = {};
    }
    plain.data.token = token;
    await safeSetItem(KEY_SESSION, JSON.stringify(plain));
  } catch {
    // session cache optional
  }
}

/** Last known full session (offline / fallback). */
export async function loadCachedSession() {
  try {
    const raw = await safeGetItem(KEY_SESSION);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function cachedTokenMatchesSession(session, token) {
  if (!session || !token) {
    return false;
  }
  return pickTokenFromSession(session) === token;
}

export async function clearStoredAuth() {
  await clearPersistedToken();
  try {
    await safeRemoveItem(KEY_SESSION);
  } catch {
    // ignore
  }
}
