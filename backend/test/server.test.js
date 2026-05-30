const { after, before, test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const dbPath = path.join(
  os.tmpdir(),
  `dream-api-test-${process.pid}-${Date.now()}.db`
);

process.env.ADMIN_TOKEN = 'test-token';
process.env.CORS_ORIGIN = 'http://allowed.test';
process.env.DREAM_DB_PATH = dbPath;

const { app } = require('../src/server');
const store = require('../src/store');

let server;
let baseUrl;

before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
      baseUrl = `http://127.0.0.1:${server.address().port}`;
      resolve();
    });
  });
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  store.db.close();
  for (const suffix of ['', '-shm', '-wal']) {
    try {
      fs.unlinkSync(`${dbPath}${suffix}`);
    } catch (_) {
      // The sidecar files are not always created on every platform.
    }
  }
});

async function request(pathname, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (options.body !== undefined) headers['content-type'] = 'application/json';
  if (options.token) headers.authorization = `Bearer ${options.token}`;

  const res = await fetch(`${baseUrl}${pathname}`, {
    method: options.method || 'GET',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });
  const text = await res.text();
  const json = text ? JSON.parse(text) : null;
  return { res, json };
}

function validOrder(overrides = {}) {
  return {
    items: [{ productId: 'prd-onion', quantity: 2 }],
    total: 100,
    customerPhone: '+251911111111',
    address: 'Bole, Addis Ababa',
    ...overrides,
  };
}

test('health and public catalog endpoints are available', async () => {
  const health = await request('/health');
  assert.equal(health.res.status, 200);
  assert.equal(health.json.ok, true);
  assert.equal(health.json.adminEnabled, true);
  assert.equal(health.json.corsRestricted, true);

  const products = await request('/api/products');
  assert.equal(products.res.status, 200);
  assert.equal(products.json.data.length, 4);
});

test('configured CORS origin is allowed and other browser origins are not', async () => {
  const allowed = await request('/api/products', {
    headers: { origin: 'http://allowed.test' },
  });
  assert.equal(allowed.res.status, 200);
  assert.equal(
    allowed.res.headers.get('access-control-allow-origin'),
    'http://allowed.test'
  );

  const denied = await request('/api/products', {
    headers: { origin: 'http://evil.test' },
  });
  assert.equal(denied.res.status, 200);
  assert.equal(denied.res.headers.get('access-control-allow-origin'), null);
});

test('order creation requires delivery phone and address', async () => {
  const missingPhone = await request('/api/orders', {
    method: 'POST',
    body: validOrder({ customerPhone: '' }),
  });
  assert.equal(missingPhone.res.status, 400);
  assert.equal(missingPhone.json.error, 'customerPhone required');

  const missingAddress = await request('/api/orders', {
    method: 'POST',
    body: validOrder({ address: '' }),
  });
  assert.equal(missingAddress.res.status, 400);
  assert.equal(missingAddress.json.error, 'address required');
});

test('order creation recomputes trusted totals and item details server-side', async () => {
  const created = await request('/api/orders', {
    method: 'POST',
    body: validOrder({
      items: [{ productId: 'prd-onion', quantity: 2, name: 'Tampered', price: 1 }],
    }),
  });

  assert.equal(created.res.status, 201);
  assert.match(created.json.data.id, /^ORD-/);
  assert.equal(created.json.data.total, 100);
  assert.equal(created.json.data.customerPhone, '+251911111111');
  assert.equal(created.json.data.address, 'Bole, Addis Ababa');
  assert.equal(created.json.data.items[0].name, 'Onion');
  assert.equal(created.json.data.items[0].price, 50);
});

test('order creation rejects client total mismatches and invalid coordinates', async () => {
  const mismatch = await request('/api/orders', {
    method: 'POST',
    body: validOrder({ total: 1 }),
  });
  assert.equal(mismatch.res.status, 400);
  assert.equal(mismatch.json.error, 'Total mismatch');
  assert.equal(mismatch.json.expectedTotal, 100);

  const badCoordinates = await request('/api/orders', {
    method: 'POST',
    body: validOrder({ lat: 200, lon: 38.75 }),
  });
  assert.equal(badCoordinates.res.status, 400);
  assert.equal(badCoordinates.json.error, 'lat/lon must be valid coordinates');
});

test('order listing is admin-only', async () => {
  const publicList = await request('/api/orders');
  assert.equal(publicList.res.status, 401);

  const invalidToken = await request('/api/orders', { token: 'wrong-token' });
  assert.equal(invalidToken.res.status, 401);

  const adminList = await request('/api/orders', { token: 'test-token' });
  assert.equal(adminList.res.status, 200);
  assert.ok(Array.isArray(adminList.json.data));
});

test('admin product writes validate fields and allow clearing optional image URL', async () => {
  const invalid = await request('/api/admin/products', {
    method: 'POST',
    token: 'test-token',
    body: { name: 'Coffee', price: 25, imageUrl: 'javascript:alert(1)' },
  });
  assert.equal(invalid.res.status, 400);
  assert.equal(
    invalid.json.error,
    'imageUrl must be an http(s) URL or /static/... path'
  );

  const created = await request('/api/admin/products', {
    method: 'POST',
    token: 'test-token',
    body: {
      name: 'Coffee',
      price: '25.555',
      imageUrl: 'https://example.com/coffee.png',
    },
  });
  assert.equal(created.res.status, 201);
  assert.equal(created.json.data.price, 25.55);
  assert.equal(created.json.data.imageUrl, 'https://example.com/coffee.png');

  const cleared = await request(`/api/admin/products/${created.json.data.id}`, {
    method: 'PATCH',
    token: 'test-token',
    body: { imageUrl: null },
  });
  assert.equal(cleared.res.status, 200);
  assert.equal(cleared.json.data.imageUrl, null);
});

test('admin config accepts Telebirr payment settings', async () => {
  const invalid = await request('/api/admin/config', {
    method: 'PUT',
    token: 'test-token',
    body: {
      telebirrQrImageUrl: 'javascript:alert(1)',
    },
  });
  assert.equal(invalid.res.status, 400);
  assert.equal(
    invalid.json.error,
    'telebirrQrImageUrl must be an http(s) URL or /static/... path'
  );

  const saved = await request('/api/admin/config', {
    method: 'PUT',
    token: 'test-token',
    body: {
      telebirrMerchantName: 'Dream Direct Orders',
      telebirrPhone: '+251911223344',
      telebirrQrImageUrl: '/static/images/telebirr-qr.png',
    },
  });
  assert.equal(saved.res.status, 200);
  assert.equal(saved.json.data.telebirrMerchantName, 'Dream Direct Orders');
  assert.equal(saved.json.data.telebirrPhone, '+251911223344');
  assert.equal(saved.json.data.telebirrQrImageUrl, '/static/images/telebirr-qr.png');

  const publicConfig = await request('/api/config');
  assert.equal(
    publicConfig.json.data.telebirrQrImageUrl,
    `${baseUrl}/static/images/telebirr-qr.png`
  );
});

test('admin order status updates enforce the business workflow', async () => {
  const created = await request('/api/orders', {
    method: 'POST',
    body: validOrder({ customerPhone: '+251922222222' }),
  });
  const id = created.json.data.id;

  const invalidFirstStep = await request(`/api/admin/orders/${id}`, {
    method: 'PATCH',
    token: 'test-token',
    body: { status: 'dispatched' },
  });
  assert.equal(invalidFirstStep.res.status, 409);

  const confirmed = await request(`/api/admin/orders/${id}`, {
    method: 'PATCH',
    token: 'test-token',
    body: { status: 'confirmed' },
  });
  assert.equal(confirmed.res.status, 200);
  assert.equal(confirmed.json.data.status, 'confirmed');

  const invalidSkip = await request(`/api/admin/orders/${id}`, {
    method: 'PATCH',
    token: 'test-token',
    body: { status: 'delivered' },
  });
  assert.equal(invalidSkip.res.status, 409);

  const dispatched = await request(`/api/admin/orders/${id}`, {
    method: 'PATCH',
    token: 'test-token',
    body: { status: 'dispatched' },
  });
  assert.equal(dispatched.res.status, 200);
  assert.equal(dispatched.json.data.status, 'dispatched');

  const delivered = await request(`/api/admin/orders/${id}`, {
    method: 'PATCH',
    token: 'test-token',
    body: { status: 'delivered' },
  });
  assert.equal(delivered.res.status, 200);
  assert.equal(delivered.json.data.status, 'delivered');

  const cancelDelivered = await request(`/api/admin/orders/${id}`, {
    method: 'PATCH',
    token: 'test-token',
    body: { status: 'cancelled' },
  });
  assert.equal(cancelDelivered.res.status, 409);
});
