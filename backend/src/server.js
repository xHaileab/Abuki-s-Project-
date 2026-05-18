require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('node:path');

const store = require('./store');
const gebeta = require('./gebeta');
const { adminAuth } = require('./admin_auth');

const app = express();
const PORT = Number(process.env.PORT || 4000);

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use('/static', express.static(path.join(__dirname, '..', 'public')));

// ── Health / discovery ──────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'dream-backend',
    adminEnabled: Boolean(process.env.ADMIN_TOKEN),
    gebetaConfigured: gebeta.isConfigured(),
  });
});

// Helper to rewrite relative /static URLs to absolute for clients.
function absolutizeImageUrl(req, url) {
  if (typeof url !== 'string' || !url.startsWith('/')) return url || null;
  return `${req.protocol}://${req.get('host')}${url}`;
}

// ── Public customer endpoints ──────────────────────────────────────────
app.get('/api/ads', (req, res, next) => {
  try {
    const ads = store.listAds().map((ad) => ({
      ...ad,
      imageUrl: absolutizeImageUrl(req, ad.imageUrl),
    }));
    res.json({ data: ads });
  } catch (error) {
    next(error);
  }
});

app.get('/api/products', (req, res, next) => {
  try {
    const products = store.listProducts().map((p) => ({
      ...p,
      imageUrl: absolutizeImageUrl(req, p.imageUrl),
    }));
    res.json({ data: products });
  } catch (error) {
    next(error);
  }
});

app.get('/api/config', (_req, res, next) => {
  try {
    res.json({ data: store.getConfig() });
  } catch (error) {
    next(error);
  }
});

app.post('/api/orders', async (req, res, next) => {
  try {
    const body = req.body || {};

    if (!Array.isArray(body.items) || body.items.length === 0) {
      return res.status(400).json({ error: 'items must be a non-empty array' });
    }

    // Resolve catalog and recompute server-side totals.
    const catalog = new Map(
      store.listProducts().map((p) => [String(p.id), p])
    );

    const normalizedItems = [];
    let computedTotal = 0;

    for (const rawItem of body.items) {
      const productId = String(rawItem.productId || '').trim();
      const quantity = Number(rawItem.quantity);

      if (!productId || !catalog.has(productId)) {
        return res.status(400).json({ error: `Invalid productId: ${productId}` });
      }
      if (!Number.isInteger(quantity) || quantity <= 0) {
        return res.status(400).json({ error: `Invalid quantity for ${productId}` });
      }

      const product = catalog.get(productId);
      const lineTotal = Number(product.price) * quantity;
      computedTotal += lineTotal;

      normalizedItems.push({
        productId,
        name: product.name,
        price: Number(product.price),
        quantity,
      });
    }

    const suppliedTotal = Number(body.total);
    if (
      Number.isFinite(suppliedTotal) &&
      Math.abs(suppliedTotal - computedTotal) > 0.01
    ) {
      return res.status(400).json({
        error: 'Total mismatch',
        expectedTotal: Number(computedTotal.toFixed(2)),
      });
    }

    // Forward-geocode the address if Gebeta is configured. Failure is non-fatal.
    let lat = body.lat ?? null;
    let lon = body.lon ?? null;
    const address = body.address ? String(body.address).trim() : null;
    if (address && (lat === null || lon === null) && gebeta.isConfigured()) {
      const geo = await gebeta.forwardGeocode(address);
      if (geo) {
        lat = geo.lat;
        lon = geo.lon;
      }
    }

    const order = store.createOrder({
      items: normalizedItems,
      total: Number(computedTotal.toFixed(2)),
      customerName: body.customerName || null,
      customerPhone: body.customerPhone || null,
      address,
      addressNote: body.addressNote || null,
      lat,
      lon,
    });

    return res.status(201).json({ data: order });
  } catch (error) {
    return next(error);
  }
});

// Optional public read of orders (existing contract).
app.get('/api/orders', (_req, res, next) => {
  try {
    res.json({ data: store.listOrders() });
  } catch (error) {
    next(error);
  }
});

// ── Admin endpoints ────────────────────────────────────────────────────
const admin = express.Router();
admin.use(adminAuth);

// Products
admin.get('/products', (_req, res) => res.json({ data: store.listProducts() }));
admin.post('/products', (req, res) => {
  const { name, price, imageUrl } = req.body || {};
  if (!name || typeof price !== 'number' || price < 0) {
    return res.status(400).json({ error: 'name and non-negative price required' });
  }
  res.status(201).json({ data: store.createProduct({ name, price, imageUrl }) });
});
admin.patch('/products/:id', (req, res) => {
  const updated = store.updateProduct(req.params.id, req.body || {});
  if (!updated) return res.status(404).json({ error: 'Not found' });
  res.json({ data: updated });
});
admin.delete('/products/:id', (req, res) => {
  const ok = store.deleteProduct(req.params.id);
  if (!ok) return res.status(404).json({ error: 'Not found' });
  res.status(204).end();
});

// Ads
admin.get('/ads', (_req, res) => res.json({ data: store.listAds() }));
admin.post('/ads', (req, res) => {
  const { title, subtitle, tag, imageUrl } = req.body || {};
  if (!title) return res.status(400).json({ error: 'title required' });
  res.status(201).json({ data: store.createAd({ title, subtitle, tag, imageUrl }) });
});
admin.patch('/ads/:id', (req, res) => {
  const updated = store.updateAd(req.params.id, req.body || {});
  if (!updated) return res.status(404).json({ error: 'Not found' });
  res.json({ data: updated });
});
admin.delete('/ads/:id', (req, res) => {
  const ok = store.deleteAd(req.params.id);
  if (!ok) return res.status(404).json({ error: 'Not found' });
  res.status(204).end();
});

// Config
admin.get('/config', (_req, res) => res.json({ data: store.getConfig() }));
admin.put('/config', (req, res) => {
  const patch = req.body || {};
  if (typeof patch !== 'object') return res.status(400).json({ error: 'object body required' });
  res.json({ data: store.updateConfig(patch) });
});

// Orders
admin.get('/orders', (req, res) => {
  const { status } = req.query;
  res.json({ data: store.listOrders({ status: status || null }) });
});
admin.get('/orders/:id', (req, res) => {
  const order = store.getOrder(req.params.id);
  if (!order) return res.status(404).json({ error: 'Not found' });
  res.json({ data: order });
});
admin.patch('/orders/:id', (req, res) => {
  const { status } = req.body || {};
  if (!status || !store.VALID_STATUSES.has(status)) {
    return res.status(400).json({
      error: `status must be one of: ${[...store.VALID_STATUSES].join(', ')}`,
    });
  }
  const updated = store.updateOrderStatus(req.params.id, status);
  if (!updated) return res.status(404).json({ error: 'Not found' });
  res.json({ data: updated });
});

app.use('/api/admin', admin);

// ── 404 + error handlers ───────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

app.use((error, _req, res, _next) => {
  // eslint-disable-next-line no-console
  console.error(error);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Dream backend running at http://localhost:${PORT}`);
  // eslint-disable-next-line no-console
  console.log(
    `Admin: ${process.env.ADMIN_TOKEN ? 'enabled' : 'disabled (set ADMIN_TOKEN)'} · Gebeta: ${
      gebeta.isConfigured() ? 'configured' : 'no API key'
    }`
  );
});
