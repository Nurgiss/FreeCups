/**
 * generateQR.js
 *
 * Generates QR code images for each shop.
 * Each QR encodes: { shopId, secret }
 *
 * Usage:
 *   node generateQR.js
 *
 * Output: ./qr-codes/<shopId>.png
 *
 * For a "rotating" QR (timestamp-based), use generateRotatingQR.js
 */

require('dotenv').config({ path: '../backend/.env' });
const QRCode = require('qrcode');
const path   = require('path');
const fs     = require('fs');
const admin  = require('firebase-admin');

async function main() {
  // Init Firebase
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || '../backend/firebase-service-account.json';
  admin.initializeApp({
    credential: admin.credential.cert(path.resolve(serviceAccountPath)),
  });

  const db = admin.firestore();
  const snap = await db.collection('shops').get();

  if (snap.empty) {
    console.log('⚠️  No shops found in Firestore. Run seedShops.js first.');
    process.exit(0);
  }

  const outDir = path.join(__dirname, 'qr-codes');
  fs.mkdirSync(outDir, { recursive: true });

  for (const doc of snap.docs) {
    const shop = doc.data();
    const payload = JSON.stringify({
      shopId:    doc.id,
      secret:    shop.secret,
      // Optional: add timestamp at display time for freshness
    });

    const filePath = path.join(outDir, `${doc.id}.png`);
    await QRCode.toFile(filePath, payload, {
      width:           400,
      margin:          2,
      color: {
        dark:  '#ffffff',
        light: '#13131a',
      },
    });

    console.log(`✅ QR generated for "${shop.name}" → ${filePath}`);
  }

  console.log('\n🎉 All QR codes generated in ./qr-codes/');
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
