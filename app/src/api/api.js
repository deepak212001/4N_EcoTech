/**
 * Central API helpers — auth header, login, requests.
 * Dev base URL: `src/config/apiBaseUrl.js`
 */

import {
  readPersistedToken,
  writePersistedToken,
} from '../auth/tokenPersist';

/** Server: app.use("/api/auth", ...) → base ends with /api */
// const API_BASE_URL = 'http://192.168.1.2:8000/api'
// http://10.0.2.2:8000/api/v1
const API_BASE_URL = 'https://4-n-eco-tech-three.vercel.app/api';
// https://4-n-eco-tech-three.vercel.app/
let authToken = null;

export function setAuthToken(token) {
  authToken = token;
}

export function getAuthToken() {
  return authToken;
}

export function clearAuthToken() {
  authToken = null;
}

/**
 * @param {string} path - e.g. '/auth/login' (leading slash optional)
 * @param {RequestInit} [options]
 */
export async function apiRequest(path, options = {}) {
  let token = authToken;
  if (!token) {
    const fromDisk = await readPersistedToken();
    if (fromDisk) {
      authToken = fromDisk;
      token = fromDisk;
    }
  }
  const url = `${API_BASE_URL.replace(/\/$/, '')}/${String(path).replace(/^\//, '')}`;
  const method = options.method || 'GET';
  if (__DEV__) {
    // Metro logs — confirm URL + that a request was attempted
    console.log('[API]', method, url, token ? '(auth)' : '(no token)');
  }
  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...options.headers,
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let res;
  try {
    res = await fetch(url, { ...options, headers });
  } catch (e) {
    const msg = e && e.message ? String(e.message) : String(e);
    const hint =
      msg === 'Network request failed' || /network|failed to connect/i.test(msg)
        ? ` (${msg}). Check Wi‑Fi, PC IP in app/src/config/apiBaseUrl.js, and that the server is on the same port.`
        : `: ${msg}`;
    throw new Error(`Cannot reach API${hint}`);
  }
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    const err = new Error(
      (data && data.message) || res.statusText || 'Request failed',
    );
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

/**
 * @param {{ email: string; password: string }} body
 */
export async function login(body) {
  const data = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: body.email.trim(),
      password: body.password,
    }),
  });
  const token =
    data?.token ||
    data?.data?.token ||
    data?.access_token ||
    data?.accessToken ||
    null;
  if (token) {
    setAuthToken(token);
    await writePersistedToken(token);
  }
  return data;
}

/**
 * @param {{ name: string; email: string; password: string }} body
 */
export async function register(body) {
  const data = await apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: body.name.trim(),
      email: body.email.trim(),
      password: body.password,
    }),
  });
  const token =
    data?.token ||
    data?.data?.token ||
    data?.access_token ||
    data?.accessToken ||
    null;
  if (token) {
    setAuthToken(token);
    await writePersistedToken(token);
  }
  return data;
}

/** GET /api/auth/me — patient JWT only */
export async function getCurrentUser() {
  return apiRequest('/auth/me', { method: 'GET' });
}

/** GET /api/providers/auth/me — provider JWT */
export async function getProviderMe() {
  return apiRequest('/providers/auth/me', { method: 'GET' });
}

/** GET /api/providers/auth/appointments — who booked with this provider */
export async function listProviderBookings() {
  return apiRequest('/providers/auth/appointments', { method: 'GET' });
}

/**
 * PUT /api/providers/auth/slots — set full availability schedule
 * @param {Array<{ date: string; slots: string[] }>} availableSlots
 */
export async function updateProviderSlots(availableSlots) {
  return apiRequest('/providers/auth/slots', {
    method: 'PUT',
    body: JSON.stringify({ availableSlots }),
  });
}

/**
 * @param {{ email: string; password: string }} body
 */
export async function providerLogin(body) {
  const data = await apiRequest('/providers/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: body.email.trim(),
      password: body.password,
    }),
  });
  const token =
    data?.token ||
    data?.data?.token ||
    data?.access_token ||
    data?.accessToken ||
    null;
  if (token) {
    setAuthToken(token);
    await writePersistedToken(token);
  }
  return data;
}

/**
 * @param {{ name: string; email: string; password: string; category: string; imageBase64?: string }} body
 */
export async function providerRegister(body) {
  const payload = {
    name: body.name.trim(),
    email: body.email.trim(),
    password: body.password,
    category: body.category.trim(),
  };
  if (body.imageBase64 && typeof body.imageBase64 === 'string') {
    payload.imageBase64 = body.imageBase64;
  }
  const data = await apiRequest('/providers/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  const token =
    data?.token ||
    data?.data?.token ||
    data?.access_token ||
    data?.accessToken ||
    null;
  if (token) {
    setAuthToken(token);
    await writePersistedToken(token);
  }
  return data;
}

/** GET /api/appointments — requires Bearer token */
export async function listMyAppointments() {
  return apiRequest('/appointments', { method: 'GET' });
}

/** DELETE /api/appointments/:id */
export async function cancelAppointment(id) {
  const safeId = encodeURIComponent(String(id));
  return apiRequest(`/appointments/${safeId}`, { method: 'DELETE' });
}

/** GET /api/providers */
export async function listProviders() {
  return apiRequest('/providers', { method: 'GET' });
}

/** GET /api/providers/:id — details + available slots (booked filtered server-side) */
export async function getProviderById(id) {
  const safeId = encodeURIComponent(String(id));
  return apiRequest(`/providers/${safeId}`, { method: 'GET' });
}

/**
 * POST /api/appointments — requires Bearer token
 * @param {{ providerId: string; date: string; time: string }} body
 */
export async function bookAppointment(body) {
  return apiRequest('/appointments', {
    method: 'POST',
    body: JSON.stringify({
      providerId: String(body.providerId),
      date: String(body.date),
      time: String(body.time),
    }),
  });
}

export { API_BASE_URL };
