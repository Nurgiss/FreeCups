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

      <!-- QR Code section -->
      <div class="section-label">Your QR code</div>
      <div class="user-qr-card">
        <div class="user-qr-wrap">
          <div id="user-qr-canvas"></div>
        </div>
        <div class="user-qr-hint">Show this to the barista to get your stamp</div>
        <div class="user-qr-expires" id="qr-expires"></div>
      </div>

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

  // Generate user QR code
  generateUserQR(st.userId);
}

function generateUserQR(userId) {
  const el = document.getElementById('user-qr-canvas');
  if (!el || !window.QRCode) return;

  const ts = Date.now();
  const qrData = JSON.stringify({ userId, ts });

  new window.QRCode(el, {
    text: qrData,
    width: 200,
    height: 200,
    colorDark: '#ffffff',
    colorLight: '#1c1035',
    correctLevel: window.QRCode.CorrectLevel.M,
  });

  // Show expiry countdown
  const expiresEl = document.getElementById('qr-expires');
  const expiresAt = ts + 10 * 60 * 1000;
  const tick = () => {
    const left = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
    if (!expiresEl) return;
    const m = Math.floor(left / 60);
    const s = left % 60;
    expiresEl.textContent = left > 0
      ? `Expires in ${m}:${String(s).padStart(2, '0')}`
      : 'Expired — refresh the page';
    if (left > 0) setTimeout(tick, 1000);
    else {
      expiresEl.style.color = 'var(--error)';
      // Regenerate QR
      el.innerHTML = '';
      generateUserQR(userId);
    }
  };
  tick();
}

function esc(str) {
  return String(str).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
  );
}
