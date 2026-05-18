/**
 * Thin wrapper around Gebeta Maps endpoints used by the backend.
 *
 * Docs: https://docs.gebeta.app/
 * Auth: API key passed as `apiKey` query parameter on every call.
 *
 * We forward-geocode customer-provided delivery addresses at order-create
 * time so the admin map has lat/lon to plot. If geocoding fails for any
 * reason we accept the order anyway and just leave lat/lon null — the order
 * still goes through, just without map plotting.
 */

const API_KEY = process.env.GEBETA_API_KEY || '';
const FORWARD_URL = 'https://mapapi.gebeta.app/api/v1/route/geocoding';
const REVERSE_URL = 'https://mapapi.gebeta.app/api/v1/route/revgeocoding';

function isConfigured() {
  return Boolean(API_KEY);
}

async function forwardGeocode(addressText) {
  if (!API_KEY || !addressText) return null;
  const url = `${FORWARD_URL}?name=${encodeURIComponent(addressText)}&apiKey=${encodeURIComponent(API_KEY)}`;
  try {
    const res = await fetch(url, { method: 'GET' });
    if (!res.ok) return null;
    const body = await res.json();
    // Gebeta returns { data: [{ name, latitude, longitude, ... }] } based on
    // observed shape. Tolerate variants.
    const list = Array.isArray(body?.data) ? body.data : body?.results || [];
    const first = list[0];
    if (!first) return null;
    const lat = Number(first.latitude ?? first.lat);
    const lon = Number(first.longitude ?? first.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
    return { lat, lon, label: first.name || addressText };
  } catch (_) {
    return null;
  }
}

async function reverseGeocode(lat, lon) {
  if (!API_KEY) return null;
  const url = `${REVERSE_URL}?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&apiKey=${encodeURIComponent(API_KEY)}`;
  try {
    const res = await fetch(url, { method: 'GET' });
    if (!res.ok) return null;
    const body = await res.json();
    const list = Array.isArray(body?.data) ? body.data : body?.results || [];
    return list[0]?.name || null;
  } catch (_) {
    return null;
  }
}

module.exports = { isConfigured, forwardGeocode, reverseGeocode };
