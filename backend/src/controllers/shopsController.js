const { getDb } = require('../firebase');

/**
 * GET /shops
 * Returns all shops (without secrets)
 */
async function listShops(req, res, next) {
  try {
    const db = getDb();
    const snap = await db.collection('shops').get();

    const shops = snap.docs.map((doc) => {
      const { secret, ...safe } = doc.data(); // strip secret from response
      return { id: doc.id, ...safe };
    });

    return res.json(shops);
  } catch (err) {
    next(err);
  }
}

module.exports = { listShops };
