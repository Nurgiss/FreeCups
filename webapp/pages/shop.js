import { navigate, showToast, state } from '../app.js';

const STAMPS_REQUIRED = 6;

export function renderShop(container, params, st) {
  const { shopId } = params;
  const shop   = st.shops.find(s => s.id === shopId);
  const stamps = st.user?.coffees?.[shopId] || 0;
  const rewards = st.user?.rewards || 0;
  const pct    = Math.round((stamps / STAMPS_REQUIRED) * 100);

  if (!shop) {
    container.innerHTML = `
      <div class="page">
        <div class="header">
          <button class="header-back" id="back-btn">←</button>
          <div><div class="header-logo">Shop</div></div>
        </div>
        <div class="empty-state">
          <div class="empty-state-icon">🔍</div>
          <div class="empty-state-title">Shop not found</div>
        </div>
      </div>`;
    container.querySelector('#back-btn').onclick = () => navigate('home');
    return;
  }

  container.innerHTML = `
    <div class="page page-with-nav">
      <!-- Header -->
      <div class="header">
        <button class="header-back" id="back-btn">←</button>
        <div>
          <div class="header-logo">${escHtml(shop.name)}</div>
          <div class="header-sub">Your progress</div>
        </div>
      </div>

      <!-- Shop hero -->
      <div class="shop-hero">
        <div class="shop-hero-icon">☕</div>
        <div class="shop-hero-name">${escHtml(shop.name)}</div>
        <div class="shop-hero-sub">${stamps} of ${STAMPS_REQUIRED} stamps collected</div>
      </div>

      <!-- Loyalty card for this shop -->
      <div class="loyalty-card" style="margin-top: 16px;">
        <div class="loyalty-card-header">
          <div class="loyalty-card-shop">Stamp card</div>
          <div class="loyalty-card-rewards">${pct}% complete</div>
        </div>

        <div class="stamp-grid">
          ${buildStampGrid(stamps)}
        </div>

        <div class="loyalty-card-progress">
          <div class="progress-label">${STAMPS_REQUIRED - stamps} more for free coffee</div>
          <div class="progress-count">${stamps}/${STAMPS_REQUIRED}</div>
        </div>
        <div class="progress-bar-wrap">
          <div class="progress-bar-fill" style="width: ${pct}%"></div>
        </div>
      </div>

      <!-- Stats -->
      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-label">Stamps here</div>
          <div class="stat-value purple">${stamps}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Free coffees</div>
          <div class="stat-value green">${rewards}</div>
        </div>
      </div>

      <!-- Info note -->
      <div style="margin: 16px; padding: 14px 16px; background: var(--card); border: 1px solid var(--border); border-radius: var(--radius); font-size: 13px; color: var(--text-muted); line-height: 1.6;">
        📋 Ask the barista at <strong style="color: var(--text);">${escHtml(shop.name)}</strong> to show the QR code, then tap Scan below.
      </div>
    </div>

    <!-- Bottom nav -->
    <nav class="bottom-nav">
      <button class="nav-item" data-nav="home" id="nav-home">
        <span class="nav-item-icon">🏠</span>
        Home
      </button>
      <button class="nav-item nav-scan-btn">
        <span class="nav-item-icon">📷</span>
        Scan
      </button>
    </nav>
  `;

  container.querySelector('#back-btn').onclick = () => navigate('home');
  container.querySelector('#nav-home').onclick = () => navigate('home');
  container.querySelector('.nav-scan-btn').onclick = () => navigate('scan', { returnShopId: shopId });
}

function buildStampGrid(count) {
  return Array.from({ length: STAMPS_REQUIRED }, (_, i) =>
    `<div class="stamp ${i < count ? 'filled' : 'empty'}"></div>`
  ).join('');
}

function escHtml(str) {
  return String(str).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
