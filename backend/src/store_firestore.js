const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const { initializeApp, getApps, getApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const SEED_PATH = path.join(__dirname, '..', 'data', 'seed.json');

if (getApps().length === 0) {
  initializeApp();
}

const app = getApp();
const db = process.env.FIRESTORE_DATABASE_ID
  ? getFirestore(app, process.env.FIRESTORE_DATABASE_ID)
  : getFirestore(app);

const VALID_STATUSES = new Set([
  'submitted',
  'confirmed',
  'dispatched',
  'delivered',
  'cancelled',
]);

let seedPromise = null;

function nowIso() {
  return new Date().toISOString();
}

function sortByNumberThenText(numberKey, textKey) {
  return (a, b) => {
    const byNumber = Number(a[numberKey] || 0) - Number(b[numberKey] || 0);
    if (byNumber !== 0) return byNumber;
    return String(a[textKey] || '').localeCompare(String(b[textKey] || ''));
  };
}

function sortOrdersNewestFirst(a, b) {
  return String(b.createdAt || '').localeCompare(String(a.createdAt || ''));
}

function cleanPatch(patch) {
  return Object.fromEntries(
    Object.entries(patch).filter(([, value]) => value !== undefined)
  );
}

function readSeed() {
  try {
    return JSON.parse(fs.readFileSync(SEED_PATH, 'utf8'));
  } catch (_) {
    return {};
  }
}

async function seedIfEmpty() {
  if (seedPromise) return seedPromise;

  seedPromise = (async () => {
    const [products, ads, config] = await Promise.all([
      db.collection('products').limit(1).get(),
      db.collection('ads').limit(1).get(),
      db.collection('config').doc('default').get(),
    ]);

    if (!products.empty || !ads.empty || config.exists) return;

    const seed = readSeed();
    const batch = db.batch();

    (seed.products || []).forEach((product, index) => {
      batch.set(db.collection('products').doc(product.id), {
        name: product.name,
        price: Number(product.price),
        imageUrl: product.imageUrl || null,
        sortOrder: index,
        createdAt: nowIso(),
      });
    });

    (seed.ads || []).forEach((ad, index) => {
      batch.set(db.collection('ads').doc(ad.id), {
        title: ad.title,
        subtitle: ad.subtitle || '',
        tag: ad.tag || null,
        imageUrl: ad.imageUrl || null,
        sortOrder: index,
        createdAt: nowIso(),
      });
    });

    batch.set(db.collection('config').doc('default'), seed.config || {});
    await batch.commit();
  })();

  return seedPromise;
}

function productFromDoc(doc) {
  const data = doc.data() || {};
  return {
    id: doc.id,
    name: data.name,
    price: Number(data.price),
    imageUrl: data.imageUrl ?? null,
    sortOrder: Number(data.sortOrder || 0),
  };
}

function adFromDoc(doc) {
  const data = doc.data() || {};
  return {
    id: doc.id,
    title: data.title,
    subtitle: data.subtitle || '',
    tag: data.tag ?? null,
    imageUrl: data.imageUrl ?? null,
    sortOrder: Number(data.sortOrder || 0),
  };
}

function orderFromDoc(doc) {
  const data = doc.data() || {};
  return {
    id: doc.id,
    status: data.status,
    total: Number(data.total || 0),
    customerName: data.customerName ?? null,
    customerPhone: data.customerPhone ?? null,
    address: data.address ?? null,
    addressNote: data.addressNote ?? null,
    lat: data.lat ?? null,
    lon: data.lon ?? null,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    items: data.items || [],
  };
}

async function listProducts() {
  await seedIfEmpty();
  const snapshot = await db.collection('products').get();
  return snapshot.docs.map(productFromDoc).sort(sortByNumberThenText('sortOrder', 'name'));
}

async function getProduct(id) {
  await seedIfEmpty();
  const doc = await db.collection('products').doc(id).get();
  return doc.exists ? productFromDoc(doc) : null;
}

async function createProduct({ name, price, imageUrl = null }) {
  await seedIfEmpty();
  const products = await listProducts();
  const sortOrder =
    products.reduce((max, product) => Math.max(max, product.sortOrder), -1) + 1;
  const id = `prd-${crypto.randomUUID().slice(0, 8)}`;
  await db.collection('products').doc(id).set({
    name,
    price: Number(price),
    imageUrl,
    sortOrder,
    createdAt: nowIso(),
  });
  return getProduct(id);
}

async function updateProduct(id, patch) {
  await seedIfEmpty();
  const ref = db.collection('products').doc(id);
  const existing = await ref.get();
  if (!existing.exists) return null;
  await ref.update(cleanPatch(patch));
  return getProduct(id);
}

async function deleteProduct(id) {
  await seedIfEmpty();
  const ref = db.collection('products').doc(id);
  const existing = await ref.get();
  if (!existing.exists) return false;
  await ref.delete();
  return true;
}

async function listAds() {
  await seedIfEmpty();
  const snapshot = await db.collection('ads').get();
  return snapshot.docs.map(adFromDoc).sort(sortByNumberThenText('sortOrder', 'title'));
}

async function getAd(id) {
  await seedIfEmpty();
  const doc = await db.collection('ads').doc(id).get();
  return doc.exists ? adFromDoc(doc) : null;
}

async function createAd({ title, subtitle = '', tag = null, imageUrl = null }) {
  await seedIfEmpty();
  const ads = await listAds();
  const sortOrder = ads.reduce((max, ad) => Math.max(max, ad.sortOrder), -1) + 1;
  const id = `ad-${crypto.randomUUID().slice(0, 8)}`;
  await db.collection('ads').doc(id).set({
    title,
    subtitle,
    tag,
    imageUrl,
    sortOrder,
    createdAt: nowIso(),
  });
  return getAd(id);
}

async function updateAd(id, patch) {
  await seedIfEmpty();
  const ref = db.collection('ads').doc(id);
  const existing = await ref.get();
  if (!existing.exists) return null;
  await ref.update(cleanPatch(patch));
  return getAd(id);
}

async function deleteAd(id) {
  await seedIfEmpty();
  const ref = db.collection('ads').doc(id);
  const existing = await ref.get();
  if (!existing.exists) return false;
  await ref.delete();
  return true;
}

async function getConfig() {
  await seedIfEmpty();
  const doc = await db.collection('config').doc('default').get();
  return doc.exists ? doc.data() || {} : {};
}

async function updateConfig(patch) {
  await seedIfEmpty();
  await db.collection('config').doc('default').set(cleanPatch(patch), { merge: true });
  return getConfig();
}

async function listOrders({ status = null } = {}) {
  await seedIfEmpty();
  const snapshot = await db.collection('orders').get();
  return snapshot.docs
    .map(orderFromDoc)
    .filter((order) => !status || order.status === status)
    .sort(sortOrdersNewestFirst);
}

async function getOrder(id) {
  await seedIfEmpty();
  const doc = await db.collection('orders').doc(id).get();
  return doc.exists ? orderFromDoc(doc) : null;
}

async function createOrder({
  items,
  total,
  customerName = null,
  customerPhone = null,
  address = null,
  addressNote = null,
  lat = null,
  lon = null,
}) {
  await seedIfEmpty();
  const id = `ORD-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  const createdAt = nowIso();
  await db.collection('orders').doc(id).set({
    status: 'submitted',
    total: Number(total),
    customerName,
    customerPhone,
    address,
    addressNote,
    lat,
    lon,
    createdAt,
    updatedAt: createdAt,
    items,
  });
  return getOrder(id);
}

async function updateOrderStatus(id, status) {
  if (!VALID_STATUSES.has(status)) {
    throw new Error(`Invalid status: ${status}`);
  }
  const ref = db.collection('orders').doc(id);
  const existing = await ref.get();
  if (!existing.exists) return null;
  await ref.update({ status, updatedAt: nowIso() });
  return getOrder(id);
}

// ── Images ──────────────────────────────────────────────────────────────
// Base64 bytes live in an `images` collection and are served via
// GET /static/uploads/:id. Client-side compression keeps each image well
// under Firestore's ~1 MiB per-document limit.
async function saveImage({ mime, base64 }) {
  const id = `img-${crypto.randomUUID().slice(0, 12)}`;
  await db.collection('images').doc(id).set({
    mime,
    data: base64,
    createdAt: nowIso(),
  });
  return id;
}

async function getImage(id) {
  const doc = await db.collection('images').doc(id).get();
  if (!doc.exists) return null;
  const data = doc.data() || {};
  return { mime: data.mime, base64: data.data };
}

module.exports = {
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
