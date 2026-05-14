import { navigate, tg, state } from '../app.js';

const STAMPS_REQUIRED = 6;

export function renderHome(container, _params, st) {
  const shopId  = st.shop?.id || null;
  const stamps  = shopId ? (st.user?.coffees?.[shopId] || 0) : 0;
  const rewards = st.user?.rewards || 0;
  const pct     = Math.round((stamps / STAMPS_REQUIRED) * 100);
  const need    = STAMPS_REQUIRED - stamps;
  const name    = st.userName || 'Guest';
  const initial = name.charAt(0).toUpperCase();

  container.innerHTML = `
    <div class="page">

      <!-- Header -->
      <div class="app-header">
        <div class="header-left">
          <div class="header-hi">Welcome back 👋</div>
          <div class="header-name">${esc(name)}</div>
        </div>
        <div class="header-avatar">${initial}</div>
      </div>

      <!-- Stats strip -->
      <div class="stats-strip">
        <div class="stat-item">
          <div class="stat-val">${stamps}</div>
          <div class="stat-lbl">Stamps</div>
        </div>
        <div class="stat-item">
          <div class="stat-val">${rewards}</div>
          <div class="stat-lbl">Free coffees</div>
        </div>
        <div class="stat-item">
          <div class="stat-val">${need > 0 ? need : '🎉'}</div>
          <div class="stat-lbl">${need > 0 ? 'Until free' : 'Ready!'}</div>
        </div>
      </div>

      ${rewards > 0 ? `
      <!-- Reward banner -->
      <div class="reward-banner">
        <div class="reward-icon">🎁</div>
        <div>
          <div class="reward-label">Free coffee ready</div>
          <div class="reward-value">${rewards} reward${rewards !== 1 ? 's' : ''} waiting for you</div>
        </div>
      </div>` : ''}

      <!-- Loyalty card label -->
      <div class="section-label">Your loyalty card</div>

      <!-- Loyalty Card -->
      <div class="loyalty-card">
        <div class="card-row">
          <div>
            <div class="card-shop-name">${st.shop ? esc(st.shop.name) : 'FreeCups'}</div>
            <div class="card-shop-tagline">Coffee loyalty card</div>
          </div>
          <div class="card-count-badge">${stamps} / ${STAMPS_REQUIRED}</div>
        </div>

        <div class="stamp-grid">
          ${Array.from({ length: STAMPS_REQUIRED }, (_, i) => `
            <div class="stamp ${i < stamps ? 'filled' : 'empty'}" style="${i < stamps ? `animation-delay:${i * 70}ms` : ''}">
              ${i < stamps ? '☕' : ''}
            </div>
          `).join('')}
        </div>

        <div class="progress-meta">
          <span class="progress-text">${need > 0 ? `${need} more stamp${need !== 1 ? 's' : ''} for a free coffee` : '🎉 Free coffee earned!'}</span>
          <span class="progress-num">${pct}%</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${pct}%"></div>
        </div>
      </div>

      <!-- Scan CTA button -->
      <button class="scan-cta" id="scan-btn">
        <div class="scan-cta-left">
          <div class="scan-cta-title">Scan QR Code</div>
          <div class="scan-cta-sub">Ask the barista to show the QR</div>
        </div>
        <div class="scan-cta-icon">📷</div>
      </button>

      <!-- How it works -->
      <div class="section-label">How it works</div>
      <div class="how-row">
        <div class="how-step">
          <div class="how-icon">☕</div>
          <div class="how-title">Buy coffee</div>
          <div class="how-desc">At any FreeCups partner</div>
        </div>
        <div class="how-step">
          <div class="how-icon">📷</div>
          <div class="how-title">Scan QR</div>
          <div class="how-desc">Barista shows the code</div>
        </div>
        <div class="how-step">
          <div class="how-icon">🎁</div>
          <div class="how-title">6th free</div>
          <div class="how-desc">Enjoy your reward!</div>
        </div>
      </div>

    </div>

    <!-- Bottom nav -->
    <nav class="bottom-nav">
      <button class="nav-btn active">
        <span class="nav-icon">🏠</span>
        Home
      </button>
      <button class="nav-btn nav-btn-center" id="nav-scan-btn">
        <div class="nav-center-circle">📷</div>
        Scan
      </button>
      <button class="nav-btn" disabled style="opacity:0.3">
        <span class="nav-icon">👤</span>
        Profile
      </button>
    </nav>
  `;

  container.querySelector('#scan-btn')?.addEventListener('click', () => navigate('scan'));
  container.querySelector('#nav-scan-btn')?.addEventListener('click', () => navigate('scan'));
}

function esc(str) {
  return String(str).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
  );
}
