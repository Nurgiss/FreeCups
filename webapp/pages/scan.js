import { navigate, API, tg } from '../app.js';

let scanner  = null;
let scanning = false;
let done     = false;

export function renderScan(container, _params, st) {
  done = false;

  container.innerHTML = `
    <div class="scan-page">

      <!-- Header overlay -->
      <div class="scan-page-header">
        <button class="scan-back" id="scan-back-btn">←</button>
        <div class="scan-page-title">Scan QR Code</div>
      </div>

      <!-- Camera -->
      <div class="scan-camera-wrap">
        <div id="qr-reader"></div>

        <!-- Dark overlay with transparent center -->
        <div class="qr-overlay">
          <div class="qr-overlay-dark top"></div>
          <div class="qr-overlay-dark bottom"></div>
          <div class="qr-overlay-dark left"></div>
          <div class="qr-overlay-dark right"></div>
        </div>

        <!-- Frame corners -->
        <div class="qr-frame">
          <div class="qr-corner tl"></div>
          <div class="qr-corner tr"></div>
          <div class="qr-corner bl"></div>
          <div class="qr-corner br"></div>
          <div class="qr-scan-line"></div>
        </div>
      </div>

      <!-- Bottom sheet -->
      <div class="scan-bottom" id="scan-bottom">
        <div id="scan-status">
          <div class="scan-hint-text">Point your camera at the barista's QR code</div>
        </div>
      </div>

    </div>
  `;

  container.querySelector('#scan-back-btn').addEventListener('click', () => stopAndGo('home'));
  startScanner(st);
}

function startScanner(st) {
  if (scanner) { scanner.clear().catch(() => {}); scanner = null; }

  const el = document.getElementById('qr-reader');
  if (!el) return;

  try {
    scanner = new Html5Qrcode('qr-reader');
    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 12, qrbox: { width: 220, height: 220 }, aspectRatio: 1 },
        (text) => onDecoded(text, st),
        () => {}
      )
      .then(() => {
        scanning = true;
        document.getElementById('qr-reader__dashboard')?.remove();
      })
      .catch(() => {
        showResult('error', '📵', 'Camera access denied', 'Allow camera access in your browser settings, then retry.');
      });
  } catch (e) { console.error(e); }
}

async function onDecoded(text, st) {
  if (done) return;
  done = true;
  scanner?.pause(true);

  navigator.vibrate?.(80);
  tg?.HapticFeedback?.impactOccurred('medium');

  showLoading('Validating QR code…');

  try {
    const result = await API.scan(st.userId, text);

    // Update local state
    if (st.user && result.shopId) {
      st.user.coffees = st.user.coffees || {};
      st.user.coffees[result.shopId] = result.coffees;
      st.user.rewards = result.rewards;
    }

    tg?.HapticFeedback?.notificationOccurred('success');

    if (result.freeEarned) {
      showResult('success', '🎉', 'Free coffee earned!', result.message);
    } else {
      showResult('success', '✅', `+1 stamp added!`, result.message);
    }

    setTimeout(() => stopAndGo('home'), 2500);

  } catch (err) {
    tg?.HapticFeedback?.notificationOccurred('error');
    showResult('error', '❌', 'Scan failed', err.message || 'Try again.');
    showRetry(st);
    done = false;
  }
}

function showLoading(text) {
  const el = document.getElementById('scan-status');
  if (!el) return;
  el.innerHTML = `
    <div class="scan-result-card">
      <div class="scan-spinner-wrap">
        <div class="scan-spinner"></div>
        <div class="scan-loading-text">${text}</div>
      </div>
    </div>
  `;
}

function showResult(type, emoji, title, msg) {
  const el = document.getElementById('scan-status');
  if (!el) return;
  el.innerHTML = `
    <div class="scan-result-card ${type}">
      <div class="scan-result-emoji">${emoji}</div>
      <div class="scan-result-title">${esc(title)}</div>
      <div class="scan-result-msg">${esc(msg)}</div>
    </div>
  `;
}

function showRetry(st) {
  const el = document.getElementById('scan-status');
  if (!el) return;
  const btn = document.createElement('button');
  btn.className = 'scan-retry-btn';
  btn.textContent = 'Try again';
  btn.addEventListener('click', () => {
    done = false;
    el.innerHTML = `<div class="scan-hint-text">Point your camera at the barista's QR code</div>`;
    startScanner(st);
  });
  el.appendChild(btn);
}

function stopAndGo(route) {
  if (scanner) {
    scanner.stop().catch(() => {}).finally(() => {
      scanner = null;
      scanning = false;
      navigate(route);
    });
  } else {
    navigate(route);
  }
}

function esc(str) {
  return String(str).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
  );
}
