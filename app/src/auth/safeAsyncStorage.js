/**
 * If AsyncStorage native module is missing, falls back to in-memory Map
 * (app works; persistence across restarts needs a proper native rebuild).
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const memory = new Map();

export async function safeSetItem(key, value) {
  try {
    await AsyncStorage.setItem(key, value);
  } catch {
    memory.set(key, value);
  }
}

export async function safeGetItem(key) {
  try {
    const v = await AsyncStorage.getItem(key);
    if (v != null) {
      return v;
    }
  } catch {
    // use memory below
  }
  const m = memory.get(key);
  return m != null ? String(m) : null;
}

export async function safeRemoveItem(key) {
  try {
    await AsyncStorage.removeItem(key);
  } catch {
    // ignore
  }
  memory.delete(key);
}

export async function safeMultiRemove(keys) {
  try {
    await AsyncStorage.multiRemove(keys);
  } catch {
    // ignore
  }
  keys.forEach(k => memory.delete(k));
}
