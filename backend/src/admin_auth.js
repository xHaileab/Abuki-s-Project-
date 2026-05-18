/**
 * Single-operator admin auth: a shared bearer token compared in constant time.
 *
 * Set ADMIN_TOKEN in the environment. The admin web app sends
 * `Authorization: Bearer <token>` on every /api/admin/* request.
 * If no token is configured, all /api/admin/* requests are rejected with 503
 * so we never accidentally ship an open admin in production.
 */

const crypto = require('node:crypto');

function adminAuth(req, res, next) {
  const expected = process.env.ADMIN_TOKEN || '';
  if (!expected) {
    return res.status(503).json({
      error: 'Admin disabled. Set ADMIN_TOKEN in the backend environment.',
    });
  }

  const header = req.get('authorization') || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) return res.status(401).json({ error: 'Missing bearer token' });

  const presented = match[1];
  const a = Buffer.from(presented);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return res.status(401).json({ error: 'Invalid bearer token' });
  }

  return next();
}

module.exports = { adminAuth };
