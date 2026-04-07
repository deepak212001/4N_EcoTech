/**
 * Disk token storage only — no imports from api.js (avoids circular deps).
 */

import {
  safeGetItem,
  safeMultiRemove,
  safeRemoveItem,
  safeSetItem,
} from './safeAsyncStorage';

const KEY_TOKEN = '@AppointmentApp.auth.token';
const KEY_LEGACY = '@AppointmentApp.auth.v1';

export async function writePersistedToken(token) {
  if (typeof token !== 'string' || token.length === 0) {
    return;
  }
  await safeSetItem(KEY_TOKEN, token);
}

export async function readPersistedToken() {
  let t = await safeGetItem(KEY_TOKEN);
  if (t && t.length > 0) {
    return t;
  }
  const legacy = await safeGetItem(KEY_LEGACY);
  if (!legacy) {
    return null;
  }
  try {
    const parsed = JSON.parse(legacy);
    const tok = parsed?.token;
    if (typeof tok === 'string' && tok.length > 0) {
      await safeSetItem(KEY_TOKEN, tok);
      await safeRemoveItem(KEY_LEGACY);
      return tok;
    }
  } catch {
    return null;
  }
  return null;
}

export async function clearPersistedToken() {
  await safeMultiRemove([KEY_TOKEN, KEY_LEGACY]);
}
