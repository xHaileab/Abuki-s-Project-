const express = require('express');
const cors = require('cors');
const path = require('node:path');
const crypto = require('node:crypto');

const { readDb, writeDb } = require('./store');

const app = express();
const PORT = Number(process.env.PORT || 4000);

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use('/static', express.static(path.join(__dirname, '..', 'public')));

app.get('/health', (req, res) => {
  res.json({ ok: true, service: 'dream-backend' });
});

app.get('/api/ads', async (req, res, next) => {
  try {
    const db = await readDb();
    const host = `${req.protocol}://${req.get('host')}`;
    const ads = db.ads.map((ad) => ({
      ...ad,
      imageUrl:
        typeof ad.imageUrl === 'string' && ad.imageUrl.startsWith('/')
          ? `${host}${ad.imageUrl}`
          : ad.imageUrl || null,
    }));

    res.json({ data: ads });
  } catch (error) {
    next(error);
  }
});

app.get('/api/products', async (req, res, next) => {
  try {
    const db = await readDb();
    res.json({ data: db.products });
  } catch (error) {
    next(error);
  }
});

app.get('/api/config', async (req, res, next) => {
  try {
    const db = await readDb();
    res.json({ data: db.config });
  } catch (error) {
    next(error);
  }
});

app.post('/api/orders', async (req, res, next) => {
  try {
    const body = req.body;

    if (!body || !Array.isArray(body.items) || body.items.length === 0) {
      return res.status(400).json({ error: 'items must be a non-empty array' });
    }

    const db = await readDb();
    const catalog = new Map(db.products.map((p) => [String(p.id), p]));

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
    if (Number.isFinite(suppliedTotal) && Math.abs(suppliedTotal - computedTotal) > 0.01) {
      return res.status(400).json({
        error: 'Total mismatch',
        expectedTotal: Number(computedTotal.toFixed(2)),
      });
    }

    const order = {
      id: `ORD-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
      status: 'submitted',
      items: normalizedItems,
      total: Number(computedTotal.toFixed(2)),
      createdAt: new Date().toISOString(),
    };

    db.orders.unshift(order);
    await writeDb(db);

    return res.status(201).json({ data: order });
  } catch (error) {
    return next(error);
  }
});

app.get('/api/orders', async (req, res, next) => {
  try {
    const db = await readDb();
    res.json({ data: db.orders });
  } catch (error) {
    next(error);
  }
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Dream backend running at http://localhost:${PORT}`);
});
