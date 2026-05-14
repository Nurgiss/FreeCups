// ─────────────────────────────────────────────────────────────────────────────
// FreeCups — Telegram Mini App  (single-shop mode)
// ─────────────────────────────────────────────────────────────────────────────
import { renderHome } from './pages/home.js';
import { renderScan }  from './pages/scan.js';

// ── Telegram WebApp ───────────────────────────────────────────────────────────
export const tg = window.Telegram?.WebApp;

if (tg) {
  tg.ready();
  tg.expand();
  // Mirror Telegram's own theme so the app blends in natively
  document.documentElement.style.setProperty('--tg-bg',       tg.themeParams.bg_color             || '#0a0a0f');
  document.documentElement.style.setProperty('--tg-surface',  tg.themeParams.secondary_bg_color   || '#13131a');
  document.documentElement.style.setProperty('--tg-text',     tg.themeParams.text_color            || '#ffffff');
  document.documentElement.style.setProperty('--tg-hint',     tg.themeParams.hint_color            || 'rgba(255,255,255,0.45)');
  document.documentElement.style.setProperty('--tg-button',   tg.themeParams.button_color          || '#7c6aff');
  document.documentElement.style.setProperty('--tg-btn-text', tg.themeParams.button_text_color     || '#ffffff');
}

// ── Global state ──────────────────────────────────────────────────────────────
export const state = {
  userId: getUserId(),
  user:   null,
  shop:   null,   // single shop object
};

function getUserId() {
  const tgUser = tg?.initDataUnsafe?.user;
  if (tgUser?.id) return String(tgUser.id);
  const p = new URLSearchParams(window.location.search);
  return p.get('userId') || 'demo_user_123';
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
  // Prefer Telegram native alert
  if (tg?.showAlert) { tg.showAlert(msg); return; }
  let c = document.querySelector('.toast-container');
  if (!c) { c = document.createElement('div'); c.className = 'toast-container'; document.body.appendChild(c); }
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `${type === 'success' ? '✅' : '❌'} ${msg}`;
  c.appendChild(t);
  setTimeout(() => t.remove(), 3200);
}

// ── Router ────────────────────────────────────────────────────────────────────
export let currentView = 'home';

export function navigate(view, params = {}) {
  currentView = view;
  const app = document.getElementById('app');

  if (view === 'scan') {
    tg?.MainButton?.hide();
    tg?.BackButton?.show();
    tg?.BackButton?.onClick(goHome);
    renderScan(app, params, state);
  } else {
    goHome();
  }
}

function goHome() {
  currentView = 'home';
  tg?.BackButton?.hide();
  renderHome(document.getElementById('app'), {}, state);
}

// ── Bootstrap ─────────────────────────────────────────────────────────────────
async function init() {
  try {
    const [user, shop] = await Promise.all([
      API.getUser(state.userId).catch(() => ({ id: state.userId, coffees: {}, rewards: 0, lastScanAt: {} })),
      API.getShop().catch(() => null),
    ]);
    state.user = user;
    state.shop = shop;
  } catch {
    state.user = { id: state.userId, coffees: {}, rewards: 0, lastScanAt: {} };
    state.shop = null;
  }

  renderHome(document.getElementById('app'), {}, state);
}

init();
