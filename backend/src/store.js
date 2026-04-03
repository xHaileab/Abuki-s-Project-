const fs = require('node:fs/promises');
const path = require('node:path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_PATH = path.join(DATA_DIR, 'db.json');
const SEED_PATH = path.join(DATA_DIR, 'seed.json');

async function ensureDb() {
  await fs.mkdir(DATA_DIR, { recursive: true });

  try {
    await fs.access(DB_PATH);
  } catch (_) {
    const seed = await fs.readFile(SEED_PATH, 'utf8');
    await fs.writeFile(DB_PATH, seed, 'utf8');
  }
}

async function readDb() {
  await ensureDb();
  const raw = await fs.readFile(DB_PATH, 'utf8');
  const parsed = JSON.parse(raw);

  return {
    ads: Array.isArray(parsed.ads) ? parsed.ads : [],
    products: Array.isArray(parsed.products) ? parsed.products : [],
    config:
      typeof parsed.config === 'object' && parsed.config !== null
        ? parsed.config
        : {
            adminPhone: '',
            paymentInstructions: '',
          },
    orders: Array.isArray(parsed.orders) ? parsed.orders : [],
  };
}

async function writeDb(data) {
  await ensureDb();
  const tempPath = `${DB_PATH}.tmp`;
  await fs.writeFile(tempPath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
  await fs.rename(tempPath, DB_PATH);
}

module.exports = {
  readDb,
  writeDb,
};
