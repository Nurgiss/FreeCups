const admin = require('firebase-admin');
const path = require('path');

let db;

function initFirebase() {
  if (admin.apps.length > 0) return admin.app();

  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

  const app = admin.initializeApp({
    credential: admin.credential.cert(
      path.resolve(serviceAccountPath)
    ),
  });

  db = admin.firestore();
  console.log('✅ Firebase connected');
  return app;
}

function getDb() {
  if (!db) throw new Error('Firebase not initialized. Call initFirebase() first.');
  return db;
}

module.exports = { initFirebase, getDb };
