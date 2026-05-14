/**
 * backend/src/bot.js
 *
 * Telegram bot in webhook mode.
 * Mounted by index.js — no separate process needed.
 * The webhook URL is set once on startup via setWebHook().
 */

const TelegramBot = require('node-telegram-bot-api');

const TOKEN       = process.env.TELEGRAM_BOT_TOKEN;
const WEBAPP_URL  = process.env.WEBAPP_URL;
const WEBHOOK_URL = process.env.WEBHOOK_URL;
const BACKEND_URL = `http://localhost:${process.env.PORT || 3000}`;

if (!TOKEN) throw new Error('TELEGRAM_BOT_TOKEN is not set');

// Create bot WITHOUT polling — Express handles incoming updates
const bot = new TelegramBot(TOKEN, { webHook: false });

// Register the webhook URL with Telegram once on startup
bot.setWebHook(`${WEBHOOK_URL}/bot${TOKEN}`)
  .then(() => console.log(`✅ Webhook set → ${WEBHOOK_URL}/bot${TOKEN}`))
  .catch(err => console.error('Webhook set error:', err.message));

// ── Register commands ─────────────────────────────────────────────────────────
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
    `Hey ${firstName}! ☕\n\n*FreeCups* — collect 6 stamps, get 1 free coffee.\n\nTap the button to open your loyalty card 👇`,
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
  const userId = msg.from?.id;
  try {
    const r    = await fetch(`${BACKEND_URL}/user/${userId}`);
    const data = await r.json();
    if (!r.ok) throw new Error(data.error);

    const stamps  = Math.max(0, ...Object.values(data.coffees || {}).map(Number));
    const rewards = data.rewards || 0;
    const bar     = stampBar(stamps, 6);

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
    `*How FreeCups works* ☕\n\n1️⃣ Buy a coffee\n2️⃣ Ask the barista to show the QR code\n3️⃣ Scan it in the app\n4️⃣ After 6 stamps — *free coffee!*\n\n/start to open your card.`,
    { parse_mode: 'Markdown' }
  );
});

// ── WebApp data (stamp scanned) ───────────────────────────────────────────────
bot.on('web_app_data', (msg) => {
  try {
    const { type, message } = JSON.parse(msg.web_app_data.data);
    if (type === 'scan_success') {
      bot.sendMessage(msg.chat.id, message || '✅ Stamp added!');
    }
  } catch { /* ignore */ }
});

bot.on('webhook_error', (err) => console.error('Bot webhook error:', err.message));

function stampBar(count, total) {
  const n = Math.min(count, total);
  return `${'☕'.repeat(n)}${'⬜'.repeat(total - n)}  (${n}/${total})`;
}

module.exports = bot;
