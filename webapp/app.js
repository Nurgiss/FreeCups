// ─────────────────────────────────────────────────────────────────────────────
// FreeCups — Telegram Mini App
// ─────────────────────────────────────────────────────────────────────────────
import { renderHome } from './pages/home.js';
import { renderScan }  from './pages/scan.js';

// ── Telegram WebApp ───────────────────────────────────────────────────────────
export const tg = window.Telegram?.WebApp;

if (tg) {
  tg.ready();
  tg.expand();
}

// ── Global state ──────────────────────────────────────────────────────────────
export const state = {
  userId:   getUserId(),
  userName: getUserName(),
  user:     null,
  shop:     null,
};

function getUserId() {
  const tgUser = tg?.initDataUnsafe?.user;
  if (tgUser?.id) return String(tgUser.id);
  const p = new URLSearchParams(window.location.search);
  return p.get('userId') || 'demo_user_123';
}

function getUserName() {
  const u = tg?.initDataUnsafe?.user;
  if (u) return u.first_name || u.username || 'Guest';
  return 'Guest';
}

// ── API ───────────────────────────────────────────────────────────────────────
export const API = {
  async getUser(id) {
    const r = await fetch(`${window.BACKEND_URL}/user/${id}`);
    if (!r.ok) throw new Error('Failed to load user');
    return r.json();
  },
  async getShop() {
    const r = await fetch(`${window.BACKEND_URL}/shop`);
    if (!r.ok) throw new Error('Failed to load shop');
    return r.json();
  },
  async scan(userId, qrData) {
    const r = await fetch(`${window.BACKEND_URL}/scan`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ userId, qrData }),
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || 'Scan failed');
    return data;
  },
};

// ── Toast ─────────────────────────────────────────────────────────────────────
export function showToast(msg, type = 'success') {
  let c = document.querySelector('.toast-container');
  if (!c) { c = document.createElement('div'); c.className = 'toast-container'; document.body.appendChild(c); }
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `${type === 'success' ? '✅' : '❌'} ${msg}`;
  c.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

// ── Router ────────────────────────────────────────────────────────────────────
export let currentView = 'home';

export function navigate(view, params = {}) {
  currentView = view;
  const app = document.getElementById('app');

  if (view === 'scan') {
    renderScan(app, params, state);
  } else {
    renderHome(app, {}, state);
  }
}

// ── Bootstrap ─────────────────────────────────────────────────────────────────
async function init() {
  const appEl = document.getElementById('app');

  // Show premium splash
  appEl.innerHTML = `
    <div class="splash">
      <div class="splash-logo">☕</div>
      <div class="splash-name">FreeCups</div>
      <div class="splash-sub">Coffee loyalty rewards</div>
      <div class="splash-dots">
        <div class="splash-dot"></div>
        <div class="splash-dot"></div>
        <div class="splash-dot"></div>
      </div>
    </div>
  `;

  // Minimum splash time for premium feel
  const [data] = await Promise.all([
    Promise.all([
      API.getUser(state.userId).catch(() => ({ id: state.userId, coffees: {}, rewards: 0, lastScanAt: {} })),
      API.getShop().catch(() => null),
    ]),
    new Promise(r => setTimeout(r, 1200)),
  ]);

  const [user, shop] = data;
  state.user = user;
  state.shop = shop;

  renderHome(appEl, {}, state);
}

init();
