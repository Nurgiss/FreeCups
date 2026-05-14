const { getDb } = require('../firebase');

const STAMPS_REQUIRED = parseInt(process.env.STAMPS_REQUIRED) || 6;
const SCAN_COOLDOWN_MS = (parseInt(process.env.SCAN_COOLDOWN_MINUTES) || 30) * 60 * 1000;
const QR_MAX_AGE_MS = (parseInt(process.env.QR_MAX_AGE_MINUTES) || 10) * 60 * 1000;

/**
 * POST /scan
 * body: { userId: string, qrData: string (JSON stringified) }
 *
 * qrData shape: { shopId, secret, timestamp? }
 */
async function handleScan(req, res, next) {
  try {
    const { userId, qrData } = req.body;

    // ── 1. Basic input validation ─────────────────────────────────────────────
    if (!userId || !qrData) {
      return res.status(400).json({ error: 'userId and qrData are required.' });
    }

    let parsed;
    try {
      parsed = typeof qrData === 'string' ? JSON.parse(qrData) : qrData;
    } catch {
      return res.status(400).json({ error: 'Invalid QR data format.' });
    }

    const { shopId, secret, timestamp } = parsed;

    if (!shopId || !secret) {
      return res.status(400).json({ error: 'QR missing shopId or secret.' });
    }

    // ── 2. QR timestamp freshness check ──────────────────────────────────────
    if (timestamp) {
      const age = Date.now() - Number(timestamp);
      if (age > QR_MAX_AGE_MS || age < 0) {
        return res.status(400).json({ error: 'QR code has expired. Ask the barista to refresh it.' });
      }
    }

    const db = getDb();

    // ── 3. Validate shop & secret ─────────────────────────────────────────────
    const shopSnap = await db.collection('shops').doc(shopId).get();
    if (!shopSnap.exists) {
      return res.status(404).json({ error: 'Shop not found.' });
    }

    const shop = shopSnap.data();
    if (shop.secret !== secret) {
      return res.status(403).json({ error: 'Invalid QR secret.' });
    }

    // ── 4. Load / create user ─────────────────────────────────────────────────
    const userRef = db.collection('users').doc(String(userId));
    const userSnap = await userRef.get();

    const now = Date.now();

    if (!userSnap.exists) {
      // First time user
      await userRef.set({
        coffees: { [shopId]: 1 },
        rewards: 0,
        lastScanAt: { [shopId]: now },
        createdAt: now,
      });

      return res.json({
        success: true,
        message: `☕ +1 stamp at ${shop.name}!`,
        coffees: 1,
        rewards: 0,
        shopId,
      });
    }

    const userData = userSnap.data();

    // ── 5. Rate limit: 1 scan per SCAN_COOLDOWN_MS per shop ──────────────────
    const lastScanAt = userData.lastScanAt?.[shopId] || 0;
    const elapsed = now - lastScanAt;

    if (elapsed < SCAN_COOLDOWN_MS) {
      const waitMins = Math.ceil((SCAN_COOLDOWN_MS - elapsed) / 60000);
      return res.status(429).json({
        error: `Too soon! Wait ${waitMins} more minute${waitMins !== 1 ? 's' : ''} before scanning again.`,
      });
    }

    // ── 6. Increment stamp ────────────────────────────────────────────────────
    const currentStamps = (userData.coffees?.[shopId] || 0) + 1;
    let rewards = userData.rewards || 0;
    let message;
    let finalStamps = currentStamps;

    if (currentStamps >= STAMPS_REQUIRED) {
      // 🎉 Free coffee earned
      finalStamps = 0;
      rewards += 1;
      message = `🎉 Free coffee unlocked at ${shop.name}! Your reward is waiting.`;
    } else {
      const remaining = STAMPS_REQUIRED - currentStamps;
      message = `☕ +1 stamp at ${shop.name}! ${remaining} more for a free coffee.`;
    }

    await userRef.update({
      [`coffees.${shopId}`]: finalStamps,
      rewards,
      [`lastScanAt.${shopId}`]: now,
    });

    return res.json({
      success: true,
      message,
      coffees: finalStamps,
      rewards,
      shopId,
      freeEarned: currentStamps >= STAMPS_REQUIRED,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { handleScan };
