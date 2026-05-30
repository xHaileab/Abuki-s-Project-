require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('node:path');

const store =
  process.env.DREAM_STORE === 'firestore'
    ? require('./store_firestore')
    : require('./store');
const gebeta = require('./gebeta');
const { adminAuth } = require('./admin_auth');

const app = express();
const PORT = Number(process.env.PORT || 4000);

const MAX_ORDER_ITEMS = 50;
const MAX_ITEM_QUANTITY = 999;
// Decoded image cap — kept under Firestore's ~1 MiB per-doc limit once
// base64-encoded. The admin compresses client-side so this is a safety net.
const MAX_UPLOAD_BYTES = 700 * 1024;
const ALLOWED_IMAGE_MIME = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
]);
const CONFIG_KEYS = new Set([
  'adminPhone',
  'paymentInstructions',
  'telebirrMerchantName',
  'telebirrPhone',
  'telebirrQrImageUrl',
]);
const ORDER_STATUS_TRANSITIONS = {
  submitted: new Set(['confirmed', 'cancelled']),
  confirmed: new Set(['dispatched', 'cancelled']),
  dispatched: new Set(['delivered', 'cancelled']),
  delivered: new Set(),
  cancelled: new Set(),
};

function parseAllowedOrigins(value = '') {
  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

const allowedOrigins = parseAllowedOrigins(process.env.CORS_ORIGIN || '');
if (allowedOrigins.length > 0) {
  const allowed = new Set(allowedOrigins);
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || allowed.has(origin)) return callback(null, true);
        return callback(null, false);
      },
    })
  );
} else {
  app.use(cors());
}

app.use(express.json({ limit: '1mb' }));
// Serve admin-uploaded images straight from the datastore. Registered before
// express.static so dynamic IDs take precedence over any on-disk files.
app.get('/static/uploads/:id', async (req, res, next) => {
  try {
    const image = await store.getImage(req.params.id);
    if (!image) return res.status(404).json({ error: 'Not found' });
    res.set('Content-Type', image.mime);
    res.set('Cache-Control', 'public, max-age=31536000, immutable');
    return res.send(Buffer.from(image.base64, 'base64'));
  } catch (error) {
    return next(error);
  }
});
app.use('/static', express.static(path.join(__dirname, '..', 'public')));

app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'dream-backend',
    adminEnabled: Boolean(process.env.ADMIN_TOKEN),
    gebetaConfigured: gebeta.isConfigured(),
    corsRestricted: allowedOrigins.length > 0,
  });
});

function absolutizeImageUrl(req, url) {
  if (typeof url !== 'string' || !url.startsWith('/')) return url || null;
  return `${req.protocol}://${req.get('host')}${url}`;
}

function hasOwn(object, key) {
  return Object.prototype.hasOwnProperty.call(object, key);
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function validationError(message) {
  return { error: message };
}

function normalizeText(value, field, { required = false, max = 160 } = {}) {
  if (value === undefined || value === null) {
    if (required) return validationError(`${field} required`);
    return { value: undefined };
  }
  if (typeof value !== 'string') {
    return validationError(`${field} must be a string`);
  }
  const trimmed = value.trim();
  if (required && !trimmed) return validationError(`${field} required`);
  if (trimmed.length > max) {
    return validationError(`${field} must be ${max} characters or fewer`);
  }
  return { value: trimmed || null };
}

function normalizePrice(value, { required = false } = {}) {
  if (value === undefined || value === null) {
    if (required) return validationError('price required');
    return { value: undefined };
  }
  if (typeof value === 'string' && !value.trim()) {
    return validationError('price must be a non-negative number');
  }
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) {
    return validationError('price must be a non-negative number');
  }
  return { value: Number(number.toFixed(2)) };
}

function normalizeImageUrl(value, field = 'imageUrl') {
  if (value === undefined) return { value: undefined };
  if (value === null) return { value: null };
  if (typeof value !== 'string') return validationError(`${field} must be a string`);

  const trimmed = value.trim();
  if (!trimmed) return { value: null };
  if (trimmed.length > 2048) {
    return validationError(`${field} must be 2048 characters or fewer`);
  }
  if (trimmed.startsWith('/static/')) return { value: trimmed };

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return { value: trimmed };
    }
  } catch (_) {
    // Fall through to a clear validation message.
  }

  return validationError(`${field} must be an http(s) URL or /static/... path`);
}

function parseImageDataUrl(value) {
  if (typeof value !== 'string' || !value) {
    return validationError('dataUrl required');
  }
  const match = /^data:([a-z]+\/[a-z0-9.+-]+);base64,([A-Za-z0-9+/=]+)$/i.exec(
    value.trim()
  );
  if (!match) return validationError('dataUrl must be a base64 data URL');

  const mime = match[1].toLowerCase();
  if (!ALLOWED_IMAGE_MIME.has(mime)) {
    return validationError('Only PNG, JPEG, WebP, or GIF images are allowed');
  }

  const base64 = match[2];
  const bytes = Buffer.byteLength(base64, 'base64');
  if (bytes === 0) return validationError('Image is empty');
  if (bytes > MAX_UPLOAD_BYTES) {
    return validationError(
      'Image is too large; please choose a smaller image'
    );
  }
  return { data: { mime, base64 } };
}

function normalizeCoordinatePair(latValue, lonValue) {
  const latProvided = latValue !== undefined && latValue !== null && latValue !== '';
  const lonProvided = lonValue !== undefined && lonValue !== null && lonValue !== '';

  if (!latProvided && !lonProvided) return { lat: null, lon: null };
  if (!latProvided || !lonProvided) {
    return validationError('lat and lon must be provided together');
  }

  const lat = Number(latValue);
  const lon = Number(lonValue);
  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lon) ||
    lat < -90 ||
    lat > 90 ||
    lon < -180 ||
    lon > 180
  ) {
    return validationError('lat/lon must be valid coordinates');
  }

  return { lat, lon };
}

function rejectUnknownFields(body, allowedFields) {
  const unknown = Object.keys(body).filter((key) => !allowedFields.has(key));
  if (unknown.length > 0) {
    return validationError(`Unsupported field: ${unknown[0]}`);
  }
  return null;
}

function normalizeProductCreate(body) {
  if (!isPlainObject(body)) return validationError('object body required');

  const unknown = rejectUnknownFields(body, new Set(['name', 'price', 'imageUrl']));
  if (unknown) return unknown;

  const name = normalizeText(body.name, 'name', { required: true, max: 120 });
  if (name.error) return name;
  const price = normalizePrice(body.price, { required: true });
  if (price.error) return price;
  const imageUrl = normalizeImageUrl(body.imageUrl);
  if (imageUrl.error) return imageUrl;

  return {
    data: {
      name: name.value,
      price: price.value,
      imageUrl: imageUrl.value ?? null,
    },
  };
}

function normalizeProductPatch(body) {
  if (!isPlainObject(body)) return validationError('object body required');

  const unknown = rejectUnknownFields(body, new Set(['name', 'price', 'imageUrl']));
  if (unknown) return unknown;

  const patch = {};
  if (hasOwn(body, 'name')) {
    const name = normalizeText(body.name, 'name', { required: true, max: 120 });
    if (name.error) return name;
    patch.name = name.value;
  }
  if (hasOwn(body, 'price')) {
    const price = normalizePrice(body.price, { required: true });
    if (price.error) return price;
    patch.price = price.value;
  }
  if (hasOwn(body, 'imageUrl')) {
    const imageUrl = normalizeImageUrl(body.imageUrl);
    if (imageUrl.error) return imageUrl;
    patch.imageUrl = imageUrl.value;
  }
  if (Object.keys(patch).length === 0) {
    return validationError('At least one supported field required');
  }
  return { data: patch };
}

function normalizeAdCreate(body) {
  if (!isPlainObject(body)) return validationError('object body required');

  const unknown = rejectUnknownFields(
    body,
    new Set(['title', 'subtitle', 'tag', 'imageUrl'])
  );
  if (unknown) return unknown;

  const title = normalizeText(body.title, 'title', { required: true, max: 140 });
  if (title.error) return title;
  const subtitle = normalizeText(body.subtitle, 'subtitle', { max: 240 });
  if (subtitle.error) return subtitle;
  const tag = normalizeText(body.tag, 'tag', { max: 40 });
  if (tag.error) return tag;
  const imageUrl = normalizeImageUrl(body.imageUrl);
  if (imageUrl.error) return imageUrl;

  return {
    data: {
      title: title.value,
      subtitle: subtitle.value ?? '',
      tag: tag.value ?? null,
      imageUrl: imageUrl.value ?? null,
    },
  };
}

function normalizeAdPatch(body) {
  if (!isPlainObject(body)) return validationError('object body required');

  const unknown = rejectUnknownFields(
    body,
    new Set(['title', 'subtitle', 'tag', 'imageUrl'])
  );
  if (unknown) return unknown;

  const patch = {};
  if (hasOwn(body, 'title')) {
    const title = normalizeText(body.title, 'title', { required: true, max: 140 });
    if (title.error) return title;
    patch.title = title.value;
  }
  if (hasOwn(body, 'subtitle')) {
    const subtitle = normalizeText(body.subtitle, 'subtitle', { max: 240 });
    if (subtitle.error) return subtitle;
    patch.subtitle = subtitle.value ?? '';
  }
  if (hasOwn(body, 'tag')) {
    const tag = normalizeText(body.tag, 'tag', { max: 40 });
    if (tag.error) return tag;
    patch.tag = tag.value;
  }
  if (hasOwn(body, 'imageUrl')) {
    const imageUrl = normalizeImageUrl(body.imageUrl);
    if (imageUrl.error) return imageUrl;
    patch.imageUrl = imageUrl.value;
  }
  if (Object.keys(patch).length === 0) {
    return validationError('At least one supported field required');
  }
  return { data: patch };
}

function normalizeConfigPatch(body) {
  if (!isPlainObject(body)) return validationError('object body required');

  const unknown = rejectUnknownFields(body, CONFIG_KEYS);
  if (unknown) return unknown;

  const patch = {};
  if (hasOwn(body, 'adminPhone')) {
    const adminPhone = normalizeText(body.adminPhone, 'adminPhone', {
      required: true,
      max: 40,
    });
    if (adminPhone.error) return adminPhone;
    patch.adminPhone = adminPhone.value;
  }
  if (hasOwn(body, 'paymentInstructions')) {
    const instructions = normalizeText(body.paymentInstructions, 'paymentInstructions', {
      required: true,
      max: 1000,
    });
    if (instructions.error) return instructions;
    patch.paymentInstructions = instructions.value;
  }
  if (hasOwn(body, 'telebirrMerchantName')) {
    const merchantName = normalizeText(body.telebirrMerchantName, 'telebirrMerchantName', {
      max: 120,
    });
    if (merchantName.error) return merchantName;
    patch.telebirrMerchantName = merchantName.value ?? '';
  }
  if (hasOwn(body, 'telebirrPhone')) {
    const telebirrPhone = normalizeText(body.telebirrPhone, 'telebirrPhone', {
      max: 40,
    });
    if (telebirrPhone.error) return telebirrPhone;
    patch.telebirrPhone = telebirrPhone.value ?? '';
  }
  if (hasOwn(body, 'telebirrQrImageUrl')) {
    const qrImage = normalizeImageUrl(body.telebirrQrImageUrl, 'telebirrQrImageUrl');
    if (qrImage.error) return qrImage;
    patch.telebirrQrImageUrl = qrImage.value ?? '';
  }
  if (Object.keys(patch).length === 0) {
    return validationError('At least one config field required');
  }
  return { data: patch };
}

function canTransitionStatus(from, to) {
  if (from === to) return true;
  return ORDER_STATUS_TRANSITIONS[from]?.has(to) || false;
}

// Public customer endpoints.
app.get('/api/ads', async (req, res, next) => {
  try {
    const ads = (await store.listAds()).map((ad) => ({
      ...ad,
      imageUrl: absolutizeImageUrl(req, ad.imageUrl),
    }));
    res.json({ data: ads });
  } catch (error) {
    next(error);
  }
});

app.get('/api/products', async (req, res, next) => {
  try {
    const products = (await store.listProducts()).map((p) => ({
      ...p,
      imageUrl: absolutizeImageUrl(req, p.imageUrl),
    }));
    res.json({ data: products });
  } catch (error) {
    next(error);
  }
});

app.get('/api/config', async (req, res, next) => {
  try {
    const config = await store.getConfig();
    res.json({
      data: {
        ...config,
        telebirrQrImageUrl: absolutizeImageUrl(req, config.telebirrQrImageUrl),
      },
    });
  } catch (error) {
    next(error);
  }
});

app.post('/api/orders', async (req, res, next) => {
  try {
    const body = isPlainObject(req.body) ? req.body : {};

    if (!Array.isArray(body.items) || body.items.length === 0) {
      return res.status(400).json({ error: 'items must be a non-empty array' });
    }
    if (body.items.length > MAX_ORDER_ITEMS) {
      return res.status(400).json({ error: `items cannot exceed ${MAX_ORDER_ITEMS}` });
    }

    const customerPhone = normalizeText(body.customerPhone, 'customerPhone', {
      required: true,
      max: 40,
    });
    if (customerPhone.error) return res.status(400).json(customerPhone);

    const address = normalizeText(body.address, 'address', {
      required: true,
      max: 240,
    });
    if (address.error) return res.status(400).json(address);

    const customerName = normalizeText(body.customerName, 'customerName', {
      max: 120,
    });
    if (customerName.error) return res.status(400).json(customerName);

    const addressNote = normalizeText(body.addressNote, 'addressNote', {
      max: 300,
    });
    if (addressNote.error) return res.status(400).json(addressNote);

    const coordinates = normalizeCoordinatePair(body.lat, body.lon);
    if (coordinates.error) return res.status(400).json(coordinates);

    const catalog = new Map(
      (await store.listProducts()).map((p) => [String(p.id), p])
    );

    const normalizedItems = [];
    let computedTotal = 0;

    for (const rawItem of body.items) {
      if (!isPlainObject(rawItem)) {
        return res.status(400).json({ error: 'Each item must be an object' });
      }

      const productId = String(rawItem.productId || '').trim();
      const quantity = Number(rawItem.quantity);

      if (!productId || !catalog.has(productId)) {
        return res.status(400).json({ error: `Invalid productId: ${productId}` });
      }
      if (
        !Number.isInteger(quantity) ||
        quantity <= 0 ||
        quantity > MAX_ITEM_QUANTITY
      ) {
        return res.status(400).json({
          error: `Invalid quantity for ${productId}; max ${MAX_ITEM_QUANTITY}`,
        });
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

    let { lat, lon } = coordinates;
    if (address.value && (lat === null || lon === null) && gebeta.isConfigured()) {
      const geo = await gebeta.forwardGeocode(address.value);
      if (geo) {
        lat = geo.lat;
        lon = geo.lon;
      }
    }

    const order = await store.createOrder({
      items: normalizedItems,
      total: Number(computedTotal.toFixed(2)),
      customerName: customerName.value ?? null,
      customerPhone: customerPhone.value,
      address: address.value,
      addressNote: addressNote.value ?? null,
      lat,
      lon,
    });

    return res.status(201).json({ data: order });
  } catch (error) {
    return next(error);
  }
});

// Legacy admin-readable alias. Kept for old curl workflows, but protected.
app.get('/api/orders', adminAuth, async (_req, res, next) => {
  try {
    res.json({ data: await store.listOrders() });
  } catch (error) {
    next(error);
  }
});

const admin = express.Router();
admin.use(adminAuth);

admin.get('/products', async (_req, res, next) => {
  try {
    res.json({ data: await store.listProducts() });
  } catch (error) {
    next(error);
  }
});
admin.post('/products', async (req, res, next) => {
  const normalized = normalizeProductCreate(req.body);
  if (normalized.error) return res.status(400).json(normalized);
  try {
    return res
      .status(201)
      .json({ data: await store.createProduct(normalized.data) });
  } catch (error) {
    return next(error);
  }
});
admin.patch('/products/:id', async (req, res, next) => {
  const normalized = normalizeProductPatch(req.body);
  if (normalized.error) return res.status(400).json(normalized);

  try {
    const updated = await store.updateProduct(req.params.id, normalized.data);
    if (!updated) return res.status(404).json({ error: 'Not found' });
    return res.json({ data: updated });
  } catch (error) {
    return next(error);
  }
});
admin.delete('/products/:id', async (req, res, next) => {
  try {
    const ok = await store.deleteProduct(req.params.id);
    if (!ok) return res.status(404).json({ error: 'Not found' });
    return res.status(204).end();
  } catch (error) {
    return next(error);
  }
});

admin.get('/ads', async (_req, res, next) => {
  try {
    res.json({ data: await store.listAds() });
  } catch (error) {
    next(error);
  }
});
admin.post('/ads', async (req, res, next) => {
  const normalized = normalizeAdCreate(req.body);
  if (normalized.error) return res.status(400).json(normalized);
  try {
    return res.status(201).json({ data: await store.createAd(normalized.data) });
  } catch (error) {
    return next(error);
  }
});
admin.patch('/ads/:id', async (req, res, next) => {
  const normalized = normalizeAdPatch(req.body);
  if (normalized.error) return res.status(400).json(normalized);

  try {
    const updated = await store.updateAd(req.params.id, normalized.data);
    if (!updated) return res.status(404).json({ error: 'Not found' });
    return res.json({ data: updated });
  } catch (error) {
    return next(error);
  }
});
admin.delete('/ads/:id', async (req, res, next) => {
  try {
    const ok = await store.deleteAd(req.params.id);
    if (!ok) return res.status(404).json({ error: 'Not found' });
    return res.status(204).end();
  } catch (error) {
    return next(error);
  }
});

admin.get('/config', async (_req, res, next) => {
  try {
    res.json({ data: await store.getConfig() });
  } catch (error) {
    next(error);
  }
});
admin.put('/config', async (req, res, next) => {
  const normalized = normalizeConfigPatch(req.body);
  if (normalized.error) return res.status(400).json(normalized);
  try {
    return res.json({ data: await store.updateConfig(normalized.data) });
  } catch (error) {
    return next(error);
  }
});

admin.get('/orders', async (req, res, next) => {
  const status = req.query.status ? String(req.query.status) : null;
  if (status && !store.VALID_STATUSES.has(status)) {
    return res.status(400).json({
      error: `status must be one of: ${[...store.VALID_STATUSES].join(', ')}`,
    });
  }
  try {
    return res.json({ data: await store.listOrders({ status }) });
  } catch (error) {
    return next(error);
  }
});
admin.get('/orders/:id', async (req, res, next) => {
  try {
    const order = await store.getOrder(req.params.id);
    if (!order) return res.status(404).json({ error: 'Not found' });
    return res.json({ data: order });
  } catch (error) {
    return next(error);
  }
});
admin.patch('/orders/:id', async (req, res, next) => {
  const { status } = req.body || {};
  if (!status || !store.VALID_STATUSES.has(status)) {
    return res.status(400).json({
      error: `status must be one of: ${[...store.VALID_STATUSES].join(', ')}`,
    });
  }

  try {
    const order = await store.getOrder(req.params.id);
    if (!order) return res.status(404).json({ error: 'Not found' });
    if (!canTransitionStatus(order.status, status)) {
      return res.status(409).json({
        error: `Cannot transition order from ${order.status} to ${status}`,
      });
    }
    if (order.status === status) return res.json({ data: order });

    const updated = await store.updateOrderStatus(req.params.id, status);
    return res.json({ data: updated });
  } catch (error) {
    return next(error);
  }
});

admin.post('/uploads', async (req, res, next) => {
  const parsed = parseImageDataUrl(
    isPlainObject(req.body) ? req.body.dataUrl : null
  );
  if (parsed.error) return res.status(400).json(parsed);
  try {
    const id = await store.saveImage(parsed.data);
    const url = `/static/uploads/${id}`;
    return res
      .status(201)
      .json({ data: { id, url, imageUrl: absolutizeImageUrl(req, url) } });
  } catch (error) {
    return next(error);
  }
});

app.use('/api/admin', admin);

app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

app.use((error, _req, res, _next) => {
  if (error?.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }
  if (error?.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Upload too large' });
  }

  // eslint-disable-next-line no-console
  console.error(error);
  return res.status(500).json({ error: 'Internal server error' });
});

function start(port = PORT) {
  return app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Dream backend running at http://localhost:${port}`);
    // eslint-disable-next-line no-console
    console.log(
      `Admin: ${process.env.ADMIN_TOKEN ? 'enabled' : 'disabled (set ADMIN_TOKEN)'} | Gebeta: ${
        gebeta.isConfigured() ? 'configured' : 'no API key'
      }`
    );
  });
}

if (require.main === module) {
  start();
}

module.exports = {
  app,
  start,
  parseAllowedOrigins,
  canTransitionStatus,
};
