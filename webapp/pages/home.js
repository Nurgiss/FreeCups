import { navigate, tg, state } from '../app.js';

const STAMPS_REQUIRED = 6;

export function renderHome(container, _params, st) {
  const shopId  = st.shop?.id || null;
  const stamps  = shopId ? (st.user?.coffees?.[shopId] || 0) : 0;
  const rewards = st.user?.rewards || 0;
  const pct     = Math.round((stamps / STAMPS_REQUIRED) * 100);
  const need    = STAMPS_REQUIRED - stamps;

  // ── Telegram MainButton → "Scan QR" ────────────────────────────────────────
  if (tg?.MainButton) {
    tg.MainButton.setText('📷  Scan QR Code');
    tg.MainButton.color      = tg.themeParams.button_color      || '#7c6aff';
    tg.MainButton.textColor  = tg.themeParams.button_text_color || '#ffffff';
    tg.MainButton.show();
    // Replace listener each render to avoid duplicates
    tg.MainButton.offClick(onScanClick);
    tg.MainButton.onClick(onScanClick);
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  container.innerHTML = `
    <div class="page">

      <!-- Top bar -->
      <div class="topbar">
        <div class="topbar-logo">FreeCups</div>
        <div class="topbar-tagline">Coffee loyalty</div>
      </div>

      <!-- Free coffee banner -->
      ${rewards > 0 ? `
      <div class="free-banner">
        <span class="free-banner-icon">🎉</span>
        <div>
          <div class="free-banner-label">FREE COFFEE READY</div>
          <div class="free-banner-value">${rewards} reward${rewards !== 1 ? 's' : ''} waiting</div>
        </div>
      </div>` : ''}

      <!-- Card -->
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-shop">${st.shop ? escHtml(st.shop.name) : 'Your Card'}</div>
            <div class="card-sub">Coffee loyalty card</div>
          </div>
          <div class="card-badge">${stamps}/${STAMPS_REQUIRED}</div>
        </div>

        <!-- Stamp grid -->
        <div class="stamp-grid">
          ${Array.from({ length: STAMPS_REQUIRED }, (_, i) => `
            <div class="stamp ${i < stamps ? 'filled' : 'empty'}" style="${i < stamps ? `animation-delay:${i * 60}ms` : ''}">
              ${i < stamps ? '☕' : ''}
            </div>
          `).join('')}
        </div>

        <!-- Progress bar -->
        <div class="progress-wrap">
          <div class="progress-fill" style="width:${pct}%"></div>
        </div>
        <div class="progress-labels">
          <span class="muted">${need > 0 ? `${need} more for free coffee` : '🎉 Free coffee earned!'}</span>
          <span class="muted">${pct}%</span>
        </div>
      </div>

      <!-- Stats row -->
      <div class="stats">
        <div class="stat-box">
          <div class="stat-num purple">${stamps}</div>
          <div class="stat-lbl">Stamps</div>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-box">
          <div class="stat-num green">${rewards}</div>
          <div class="stat-lbl">Free coffees</div>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-box">
          <div class="stat-num">${Math.floor(((stamps + rewards * STAMPS_REQUIRED)) / 1) }</div>
          <div class="stat-lbl">Total ever</div>
        </div>
      </div>

      <!-- How it works -->
      <div class="how-section">
        <div class="how-title">How it works</div>
        <div class="how-steps">
          <div class="how-step">
            <div class="how-step-icon">☕</div>
            <div class="how-step-text">Buy a coffee</div>
          </div>
          <div class="how-arrow">→</div>
          <div class="how-step">
            <div class="how-step-icon">📷</div>
            <div class="how-step-text">Scan QR</div>
          </div>
          <div class="how-arrow">→</div>
          <div class="how-step">
            <div class="how-step-icon">🎁</div>
            <div class="how-step-text">6th is free</div>
          </div>
        </div>
      </div>

      <!-- Fallback scan button (shown only if NOT inside Telegram) -->
      ${!tg ? `
      <div style="padding: 0 16px 32px;">
        <button class="scan-fallback-btn" id="scan-btn">📷 Scan QR Code</button>
      </div>` : '<!-- MainButton used -->'}

      <!-- Bottom safe area spacer for MainButton -->
      <div style="height: ${tg ? '80px' : '0'}"></div>

    </div>
  `;

  // Fallback button (non-Telegram browser / dev)
  container.querySelector('#scan-btn')?.addEventListener('click', onScanClick);
}

function onScanClick() {
  navigate('scan');
}

function escHtml(str) {
  return String(str).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
  );
}

export function renderHome(container, _params, st) {
  const totalStamps  = Object.values(st.user?.coffees || {}).reduce((a, b) => a + b, 0);
  const rewards      = st.user?.rewards || 0;
  const shops        = st.shops || [];

  // Determine "best" shop to show on loyalty card (most stamps)
  const bestShopId   = Object.entries(st.user?.coffees || {})
    .sort((a, b) => b[1] - a[1])[0]?.[0] || shops[0]?.id;
  const bestStamps   = st.user?.coffees?.[bestShopId] || 0;
  const bestShop     = shops.find(s => s.id === bestShopId);

  container.innerHTML = `
    <div class="page page-with-nav">
      <!-- Header -->
      <div class="header">
        <div>
          <div class="header-logo">FreeCups ☕</div>
          <div class="header-sub">Your loyalty card</div>
        </div>
      </div>

      <!-- Rewards banner (show only if rewards > 0) -->
      ${rewards > 0 ? `
      <div class="rewards-banner" style="margin: 16px 16px 0;">
        <div class="rewards-banner-icon">🎉</div>
        <div class="rewards-banner-text">
          <div class="rewards-banner-label">Free coffees ready</div>
          <div class="rewards-banner-value">${rewards} reward${rewards !== 1 ? 's' : ''}</div>
        </div>
      </div>` : ''}

      <!-- Loyalty card -->
      <div class="loyalty-card">
        <div class="loyalty-card-header">
          <div class="loyalty-card-shop">${bestShop ? bestShop.name : 'Your stamps'}</div>
          ${rewards > 0 ? `<div class="loyalty-card-rewards">🎟 ${rewards} free</div>` : ''}
        </div>

        <div class="stamp-grid">
          ${buildStampGrid(bestStamps)}
        </div>

        <div class="loyalty-card-progress">
          <div class="progress-label">Progress</div>
          <div class="progress-count">${bestStamps} / ${STAMPS_REQUIRED}</div>
        </div>
        <div class="progress-bar-wrap">
          <div class="progress-bar-fill" style="width: ${(bestStamps / STAMPS_REQUIRED) * 100}%"></div>
        </div>
      </div>

      <!-- Stats -->
      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-label">Total stamps</div>
          <div class="stat-value purple">${totalStamps}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Free coffees</div>
          <div class="stat-value green">${rewards}</div>
        </div>
      </div>

      <!-- Shop list -->
      <div class="section-title">Participating shops</div>

      ${shops.length === 0 ? `
        <div class="empty-state">
          <div class="empty-state-icon">🏪</div>
          <div class="empty-state-title">No shops yet</div>
          <div class="empty-state-desc">Shops will appear here once they join FreeCups.</div>
        </div>
      ` : `
        <div class="shop-list">
          ${shops.map(shop => renderShopCard(shop, st.user?.coffees?.[shop.id] || 0)).join('')}
        </div>
      `}
    </div>

    <!-- Bottom nav -->
    <nav class="bottom-nav">
      <button class="nav-item active" data-nav="home">
        <span class="nav-item-icon">🏠</span>
        Home
      </button>
      <button class="nav-item nav-scan-btn" data-nav="scan">
        <span class="nav-item-icon">📷</span>
        Scan
      </button>
    </nav>
  `;

  // ── Events ──────────────────────────────────────────────────────────────────
  container.querySelectorAll('.shop-card').forEach(card => {
    card.addEventListener('click', () => {
      navigate('shop', { shopId: card.dataset.shopId });
    });
  });

  container.querySelector('.nav-scan-btn')?.addEventListener('click', () => {
    navigate('scan');
  });
}

function renderShopCard(shop, stamps) {
  const pct = Math.min((stamps / STAMPS_REQUIRED) * 100, 100);
  return `
    <div class="shop-card" data-shop-id="${shop.id}">
      <div class="shop-icon">☕</div>
      <div class="shop-info">
        <div class="shop-name">${escHtml(shop.name)}</div>
        <div class="mini-stamps">
          ${Array.from({ length: STAMPS_REQUIRED }, (_, i) =>
            `<div class="mini-stamp ${i < stamps ? 'filled' : 'empty'}"></div>`
          ).join('')}
        </div>
        <div class="shop-stamps">${stamps}/${STAMPS_REQUIRED} stamps</div>
      </div>
      <div class="shop-arrow">›</div>
    </div>
  `;
}

function buildStampGrid(count) {
  return Array.from({ length: STAMPS_REQUIRED }, (_, i) =>
    `<div class="stamp ${i < count ? 'filled' : 'empty'}"></div>`
  ).join('');
}

function escHtml(str) {
  return String(str).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
