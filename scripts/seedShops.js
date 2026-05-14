/**
 * seedShops.js
 *
 * Seeds a single coffee shop into Firestore for MVP testing.
 * The shop ID must match SHOP_ID in backend/.env
 *
 * Usage:
 *   node seedShops.js
 */

require('dotenv').config({ path: '../backend/.env' });
const path   = require('path');
const admin  = require('firebase-admin');
const crypto = require('crypto');

// ← Change these to match your actual shop
const SHOP = {
  id:    process.env.SHOP_ID || 'shop_main',
  name:  'My Coffee Shop',
  emoji: '☕',
};

async function main() {
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || '../backend/firebase-service-account.json';
  admin.initializeApp({
    credential: admin.credential.cert(path.resolve(serviceAccountPath)),
  });

  const db     = admin.firestore();
  const secret = crypto.randomBytes(16).toString('hex');

  await db.collection('shops').doc(SHOP.id).set({
    name:      SHOP.name,
    emoji:     SHOP.emoji,
    secret,
    createdAt: Date.now(),
  });

  console.log(`✅ Shop "${SHOP.name}" created`);
  console.log(`   ID:     ${SHOP.id}`);
  console.log(`   Secret: ${secret}`);
  console.log('\n👉 Run generateQR.js to generate the QR code PNG.');
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
