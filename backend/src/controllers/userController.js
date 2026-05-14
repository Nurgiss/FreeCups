const { getDb } = require('../firebase');

/**
 * GET /user/:id
 */
async function getUser(req, res, next) {
  try {
    const { id } = req.params;
    const db = getDb();
    const snap = await db.collection('users').doc(String(id)).get();

    if (!snap.exists) {
      // Return empty state for new users — let frontend handle "welcome" state
      return res.json({
        id,
        coffees: {},
        rewards: 0,
        lastScanAt: {},
      });
    }

    const data = snap.data();
    return res.json({
      id,
      coffees: data.coffees || {},
      rewards: data.rewards || 0,
      lastScanAt: data.lastScanAt || {},
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getUser };
