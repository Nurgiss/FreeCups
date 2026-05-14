require('dotenv').config();
const express = require('express');
const helmet  = require('helmet');
const cors    = require('cors');
const { initFirebase } = require('./firebase');

const scanRouter    = require('./routes/scan');
const userRouter    = require('./routes/user');
const shopsRouter   = require('./routes/shops');
const baristaRouter = require('./routes/barista');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.WEBAPP_URL || '*',
}));
app.use(express.json());

// ── Firebase ──────────────────────────────────────────────────────────────────
initFirebase();

// ── Telegram Bot (webhook mode) ───────────────────────────────────────────────
// Bot is mounted here so backend + bot = one Railway service
if (process.env.TELEGRAM_BOT_TOKEN && process.env.WEBHOOK_URL) {
  const bot = require('./bot');
  const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  app.post(`/bot${TOKEN}`, (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
  });
  console.log('🤖 Bot webhook registered at /bot<token>');
}

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/scan',    scanRouter);
app.use('/user',    userRouter);
app.use('/shops',   shopsRouter);
app.use('/barista', baristaRouter);

// ── Single-shop shortcut: GET /shop ──────────────────────────────────────────
app.get('/shop', async (_req, res, next) => {
  try {
    const { getDb } = require('./firebase');
    const shopId = process.env.SHOP_ID;
    if (!shopId) return res.status(400).json({ error: 'SHOP_ID not configured.' });
    const snap = await getDb().collection('shops').doc(shopId).get();
    if (!snap.exists) return res.status(404).json({ error: 'Shop not found.' });
    const { secret, ...safe } = snap.data();
    res.json({ id: snap.id, ...safe });
  } catch (err) { next(err); }
});

// ── Health ────────────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', ts: Date.now() }));

// ── Error handler ─────────────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => console.log(`🚀 Backend running on http://localhost:${PORT}`));
