/**
 * Tiny fetch wrapper. Sends the admin bearer token from localStorage, parses
 * JSON, and throws on non-2xx with a readable message.
 */

import { getToken, setToken } from './auth.js';

const BASE = import.meta.env.VITE_BACKEND_URL || '';

async function request(method, path, body) {
  const url = `${BASE}${path}`;
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    setToken('');
    throw new Error('Authentication failed. Re-enter your admin token.');
  }

  if (res.status === 204) return null;

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const msg = data?.error || `Request failed (${res.status})`;
    throw new Error(msg);
  }

  return data?.data ?? data;
}

export const api = {
  // Health
  health: () => request('GET', '/health'),

  // Products
  listProducts: () => request('GET', '/api/admin/products'),
  createProduct: (p) => request('POST', '/api/admin/products', p),
  updateProduct: (id, p) => request('PATCH', `/api/admin/products/${id}`, p),
  deleteProduct: (id) => request('DELETE', `/api/admin/products/${id}`),

  // Ads
  listAds: () => request('GET', '/api/admin/ads'),
  createAd: (a) => request('POST', '/api/admin/ads', a),
  updateAd: (id, a) => request('PATCH', `/api/admin/ads/${id}`, a),
  deleteAd: (id) => request('DELETE', `/api/admin/ads/${id}`),

  // Config
  getConfig: () => request('GET', '/api/admin/config'),
  updateConfig: (patch) => request('PUT', '/api/admin/config', patch),

  // Orders
  listOrders: (status) =>
    request('GET', `/api/admin/orders${status ? `?status=${status}` : ''}`),
  getOrder: (id) => request('GET', `/api/admin/orders/${id}`),
  updateOrderStatus: (id, status) =>
    request('PATCH', `/api/admin/orders/${id}`, { status }),

  // Uploads — returns { id, url, imageUrl }
  uploadImage: (dataUrl) => request('POST', '/api/admin/uploads', { dataUrl }),
};

/** Resolve a stored image URL (often relative like /static/uploads/..)
 *  to something the browser can load in any environment. */
export function resolveImageUrl(value) {
  if (!value) return '';
  if (value.startsWith('/')) return `${BASE}${value}`;
  return value;
}
