require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

const TOKEN      = process.env.TELEGRAM_BOT_TOKEN;
const WEBAPP_URL = process.env.WEBAPP_URL;
const WEBHOOK_URL = process.env.WEBHOOK_URL; // e.g. https://your-app.railway.app

if (!TOKEN)      throw new Error('TELEGRAM_BOT_TOKEN is not set in .env');
if (!WEBAPP_URL) throw new Error('WEBAPP_URL is not set in .env');

// ── Bot init: webhook in production, polling in dev ───────────────────────────
let bot;
if (WEBHOOK_URL) {
  bot = new TelegramBot(TOKEN, { webHook: { port: process.env.PORT || 3001 } });
  bot.setWebHook(`${WEBHOOK_URL}/bot${TOKEN}`);
  console.log(`🤖 Bot started via webhook: ${WEBHOOK_URL}/bot${TOKEN}`);
} else {
  bot = new TelegramBot(TOKEN, { polling: true });
  console.log('🤖 Bot started via polling (dev mode)');
}

// ── Register bot commands (shows in Telegram menu) ────────────────────────────
bot.setMyCommands([
  { command: 'start',    description: '☕ Open FreeCups app' },
  { command: 'mystamps', description: '🎟 Check your stamps' },
  { command: 'help',     description: '❓ How it works' },
]);

// ── /start ────────────────────────────────────────────────────────────────────
bot.onText(/\/start/, (msg) => {
  const firstName = msg.from?.first_name || 'there';
  const userId    = msg.from?.id;

  bot.sendMessage(
    msg.chat.id,
    `Hey ${firstName}! ☕\n\n*FreeCups* — collect 6 stamps, get 1 free coffee.\n\nTap the button below to open your loyalty card 👇`,
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [[
          {
            text: '☕ Open My Card',
            web_app: { url: `${WEBAPP_URL}?userId=${userId}` },
          },
        ]],
      },
    }
  );
});

// ── /mystamps ─────────────────────────────────────────────────────────────────
bot.onText(/\/mystamps/, async (msg) => {
  const userId     = msg.from?.id;
  const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';

  try {
    const r    = await fetch(`${BACKEND_URL}/user/${userId}`);
    const data = await r.json();
    if (!r.ok) throw new Error(data.error);

    const shopStamps = Object.values(data.coffees || {});
    const stamps     = shopStamps.length > 0 ? Math.max(...shopStamps) : 0;
    const rewards    = data.rewards || 0;
    const bar        = stampBar(stamps, 6);

    bot.sendMessage(
      msg.chat.id,
      `☕ *Your loyalty card*\n\n${bar}\n\n🎟 Free coffees: *${rewards}*`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[
            { text: '☕ Open App', web_app: { url: `${WEBAPP_URL}?userId=${userId}` } },
          ]],
        },
      }
    );
  } catch {
    bot.sendMessage(msg.chat.id, '❌ Could not load your stamps. Try again later.');
  }
});

// ── /help ─────────────────────────────────────────────────────────────────────
bot.onText(/\/help/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    `*How FreeCups works* ☕\n\n1️⃣ Buy a coffee at a participating shop\n2️⃣ Ask the barista to show the QR code\n3️⃣ Scan it in the app\n4️⃣ After 6 stamps — your next coffee is *free!*\n\nUse /start to open your card.`,
    { parse_mode: 'Markdown' }
  );
});

// ── WebApp data callback ──────────────────────────────────────────────────────
bot.on('web_app_data', (msg) => {
  try {
    const { type, message } = JSON.parse(msg.web_app_data.data);
    if (type === 'scan_success') {
      bot.sendMessage(msg.chat.id, message || '✅ Stamp added!');
    }
  } catch { /* ignore */ }
});

// ── Error handling ────────────────────────────────────────────────────────────
bot.on('polling_error', (err) => console.error('Polling error:', err.message));
bot.on('webhook_error', (err) => console.error('Webhook error:', err.message));

// ── Helpers ───────────────────────────────────────────────────────────────────
function stampBar(count, total) {
  const filled = Math.min(count, total);
  return `${'☕'.repeat(filled)}${'⬜'.repeat(total - filled)}  (${filled}/${total})`;
}

module.exports = bot; // export for webhook integration with backend if needed
