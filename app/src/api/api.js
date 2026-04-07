/**
 * Central API helpers — base URL, auth header, login.
 * Change API_BASE_URL to your backend.
 */

const API_BASE_URL = 'https://your-api.example.com';

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
  const url = `${API_BASE_URL.replace(/\/$/, '')}/${String(path).replace(/^\//, '')}`;
  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...options.headers,
  };
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  const res = await fetch(url, { ...options, headers });
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
    data?.token || data?.access_token || data?.accessToken || null;
  if (token) {
    setAuthToken(token);
  }
  return data;
}

export { API_BASE_URL };
