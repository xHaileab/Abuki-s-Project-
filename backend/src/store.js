/**
 * SQLite-backed data store for Dream.
 *
 * Replaces the previous JSON-file store. Schema mirrors the original JSON
 * shape so the public API contract remains stable, but adds:
 *   - Per-row CRUD (lets the admin web app manage products/ads/config)
 *   - Order delivery fields (address, lat, lon) for Gebeta map plotting
 *   - Order status transitions (submitted → confirmed → dispatched → delivered)
 *
 * Concurrency: better-sqlite3 is synchronous, so multiple Express request
 * handlers serialize naturally inside the Node event loop. No file-rewrite
 * race like the previous JSON store had.
 */

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const Database = require('better-sqlite3');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_PATH = process.env.DREAM_DB_PATH || path.join(DATA_DIR, 'dream.db');
const SEED_PATH = path.join(DATA_DIR, 'seed.json');

fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function hasOwn(object, key) {
  return Object.prototype.hasOwnProperty.call(object, key);
}

db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    image_url TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS ads (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    subtitle TEXT,
    tag TEXT,
    image_url TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    status TEXT NOT NULL DEFAULT 'submitted',
    total REAL NOT NULL,
    customer_name TEXT,
    customer_phone TEXT,
    address TEXT,
    address_note TEXT,
    lat REAL,
    lon REAL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    quantity INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS images (
    id TEXT PRIMARY KEY,
    mime TEXT NOT NULL,
    bytes BLOB NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
`);

// One-time seed from seed.json if every table is empty (fresh install).
function seedIfEmpty() {
  const counts = db
    .prepare(
      `SELECT
        (SELECT COUNT(*) FROM products) AS products,
        (SELECT COUNT(*) FROM ads) AS ads,
        (SELECT COUNT(*) FROM config) AS config`
    )
    .get();
  const empty =
    counts.products === 0 && counts.ads === 0 && counts.config === 0;
  if (!empty) return;

  let seed;
  try {
    seed = JSON.parse(fs.readFileSync(SEED_PATH, 'utf8'));
  } catch (_) {
    return;
  }

  const insertProduct = db.prepare(
    `INSERT INTO products (id, name, price, image_url, sort_order)
     VALUES (@id, @name, @price, @imageUrl, @sortOrder)`
  );
  const insertAd = db.prepare(
    `INSERT INTO ads (id, title, subtitle, tag, image_url, sort_order)
     VALUES (@id, @title, @subtitle, @tag, @imageUrl, @sortOrder)`
  );
  const insertConfig = db.prepare(
    `INSERT INTO config (key, value) VALUES (?, ?)`
  );

  const tx = db.transaction(() => {
    (seed.products || []).forEach((p, i) =>
      insertProduct.run({
        id: p.id,
        name: p.name,
        price: Number(p.price),
        imageUrl: p.imageUrl || null,
        sortOrder: i,
      })
    );
    (seed.ads || []).forEach((a, i) =>
      insertAd.run({
        id: a.id,
        title: a.title,
        subtitle: a.subtitle || '',
        tag: a.tag || null,
        imageUrl: a.imageUrl || null,
        sortOrder: i,
      })
    );
    const cfg = seed.config || {};
    Object.entries(cfg).forEach(([k, v]) => insertConfig.run(k, String(v)));
  });

  tx();
}

seedIfEmpty();

// ── Products ────────────────────────────────────────────────────────────
function listProducts() {
  return db
    .prepare(
      `SELECT id, name, price, image_url AS imageUrl, sort_order AS sortOrder
       FROM products ORDER BY sort_order, name`
    )
    .all();
}

function createProduct({ name, price, imageUrl = null }) {
  const id = `prd-${crypto.randomUUID().slice(0, 8)}`;
  const sortOrder =
    db.prepare(`SELECT COALESCE(MAX(sort_order), -1) + 1 AS next FROM products`).get().next;
  db.prepare(
    `INSERT INTO products (id, name, price, image_url, sort_order)
     VALUES (?, ?, ?, ?, ?)`
  ).run(id, name, Number(price), imageUrl, sortOrder);
  return getProduct(id);
}

function getProduct(id) {
  return db
    .prepare(
      `SELECT id, name, price, image_url AS imageUrl, sort_order AS sortOrder
       FROM products WHERE id = ?`
    )
    .get(id);
}

function updateProduct(id, patch) {
  const existing = getProduct(id);
  if (!existing) return null;

  const updates = [];
  const params = [];
  if (hasOwn(patch, 'name')) {
    updates.push('name = ?');
    params.push(patch.name);
  }
  if (hasOwn(patch, 'price')) {
    updates.push('price = ?');
    params.push(Number(patch.price));
  }
  if (hasOwn(patch, 'imageUrl')) {
    updates.push('image_url = ?');
    params.push(patch.imageUrl);
  }

  if (updates.length > 0) {
    params.push(id);
    db.prepare(`UPDATE products SET ${updates.join(', ')} WHERE id = ?`).run(
      ...params
    );
  }

  return getProduct(id);
}

function deleteProduct(id) {
  return db.prepare(`DELETE FROM products WHERE id = ?`).run(id).changes > 0;
}

// ── Ads ─────────────────────────────────────────────────────────────────
function listAds() {
  return db
    .prepare(
      `SELECT id, title, subtitle, tag, image_url AS imageUrl, sort_order AS sortOrder
       FROM ads ORDER BY sort_order, created_at`
    )
    .all();
}

function createAd({ title, subtitle = '', tag = null, imageUrl = null }) {
  const id = `ad-${crypto.randomUUID().slice(0, 8)}`;
  const sortOrder =
    db.prepare(`SELECT COALESCE(MAX(sort_order), -1) + 1 AS next FROM ads`).get().next;
  db.prepare(
    `INSERT INTO ads (id, title, subtitle, tag, image_url, sort_order)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(id, title, subtitle, tag, imageUrl, sortOrder);
  return getAd(id);
}

function getAd(id) {
  return db
    .prepare(
      `SELECT id, title, subtitle, tag, image_url AS imageUrl, sort_order AS sortOrder
       FROM ads WHERE id = ?`
    )
    .get(id);
}

function updateAd(id, patch) {
  const existing = getAd(id);
  if (!existing) return null;

  const updates = [];
  const params = [];
  if (hasOwn(patch, 'title')) {
    updates.push('title = ?');
    params.push(patch.title);
  }
  if (hasOwn(patch, 'subtitle')) {
    updates.push('subtitle = ?');
    params.push(patch.subtitle);
  }
  if (hasOwn(patch, 'tag')) {
    updates.push('tag = ?');
    params.push(patch.tag);
  }
  if (hasOwn(patch, 'imageUrl')) {
    updates.push('image_url = ?');
    params.push(patch.imageUrl);
  }

  if (updates.length > 0) {
    params.push(id);
    db.prepare(`UPDATE ads SET ${updates.join(', ')} WHERE id = ?`).run(
      ...params
    );
  }

  return getAd(id);
}

function deleteAd(id) {
  return db.prepare(`DELETE FROM ads WHERE id = ?`).run(id).changes > 0;
}

// ── Config ──────────────────────────────────────────────────────────────
function getConfig() {
  const rows = db.prepare(`SELECT key, value FROM config`).all();
  const out = {};
  rows.forEach((r) => (out[r.key] = r.value));
  return out;
}

function updateConfig(patch) {
  const stmt = db.prepare(
    `INSERT INTO config (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`
  );
  const tx = db.transaction((entries) => {
    entries.forEach(([k, v]) => stmt.run(k, String(v ?? '')));
  });
  tx(Object.entries(patch));
  return getConfig();
}

// ── Orders ──────────────────────────────────────────────────────────────
function listOrders({ status = null } = {}) {
  const rows = status
    ? db
        .prepare(
          `SELECT * FROM orders WHERE status = ? ORDER BY created_at DESC`
        )
        .all(status)
    : db.prepare(`SELECT * FROM orders ORDER BY created_at DESC`).all();

  const itemsStmt = db.prepare(
    `SELECT product_id AS productId, name, price, quantity
     FROM order_items WHERE order_id = ?`
  );

  return rows.map((r) => ({
    id: r.id,
    status: r.status,
    total: r.total,
    customerName: r.customer_name,
    customerPhone: r.customer_phone,
    address: r.address,
    addressNote: r.address_note,
    lat: r.lat,
    lon: r.lon,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    items: itemsStmt.all(r.id),
  }));
}

function getOrder(id) {
  const r = db.prepare(`SELECT * FROM orders WHERE id = ?`).get(id);
  if (!r) return null;
  const items = db
    .prepare(
      `SELECT product_id AS productId, name, price, quantity
       FROM order_items WHERE order_id = ?`
    )
    .all(id);
  return {
    id: r.id,
    status: r.status,
    total: r.total,
    customerName: r.customer_name,
    customerPhone: r.customer_phone,
    address: r.address,
    addressNote: r.address_note,
    lat: r.lat,
    lon: r.lon,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    items,
  };
}

function createOrder({
  items,
  total,
  customerName = null,
  customerPhone = null,
  address = null,
  addressNote = null,
  lat = null,
  lon = null,
}) {
  const id = `ORD-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  const createdAt = new Date().toISOString();

  const insertOrder = db.prepare(
    `INSERT INTO orders
     (id, status, total, customer_name, customer_phone, address, address_note, lat, lon, created_at, updated_at)
     VALUES (?, 'submitted', ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const insertItem = db.prepare(
    `INSERT INTO order_items (order_id, product_id, name, price, quantity)
     VALUES (?, ?, ?, ?, ?)`
  );

  const tx = db.transaction(() => {
    insertOrder.run(
      id,
      total,
      customerName,
      customerPhone,
      address,
      addressNote,
      lat,
      lon,
      createdAt,
      createdAt
    );
    items.forEach((it) =>
      insertItem.run(id, it.productId, it.name, it.price, it.quantity)
    );
  });
  tx();
  return getOrder(id);
}

// ── Images ──────────────────────────────────────────────────────────────
// Stored as BLOBs and served back via GET /static/uploads/:id. Keeps the
// app infra-free (no object storage to provision) and works identically to
// the Firestore store's image collection.
function saveImage({ mime, base64 }) {
  const id = `img-${crypto.randomUUID().slice(0, 12)}`;
  const bytes = Buffer.from(base64, 'base64');
  db.prepare(
    `INSERT INTO images (id, mime, bytes) VALUES (?, ?, ?)`
  ).run(id, mime, bytes);
  return id;
}

function getImage(id) {
  const row = db.prepare(`SELECT mime, bytes FROM images WHERE id = ?`).get(id);
  if (!row) return null;
  return { mime: row.mime, base64: Buffer.from(row.bytes).toString('base64') };
}

const VALID_STATUSES = new Set([
  'submitted',
  'confirmed',
  'dispatched',
  'delivered',
  'cancelled',
]);

function updateOrderStatus(id, status) {
  if (!VALID_STATUSES.has(status)) {
    throw new Error(`Invalid status: ${status}`);
  }
  const updatedAt = new Date().toISOString();
  const changes = db
    .prepare(`UPDATE orders SET status = ?, updated_at = ? WHERE id = ?`)
    .run(status, updatedAt, id).changes;
  return changes > 0 ? getOrder(id) : null;
}

module.exports = {
  db,
  listProducts,
  createProduct,
  getProduct,
  updateProduct,
  deleteProduct,
  listAds,
  createAd,
  getAd,
  updateAd,
  deleteAd,
  getConfig,
  updateConfig,
  listOrders,
  getOrder,
  createOrder,
  updateOrderStatus,
  saveImage,
  getImage,
  VALID_STATUSES,
};
