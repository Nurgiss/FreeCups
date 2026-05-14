import { navigate, API, showToast, tg, state } from '../app.js';

let scanner  = null;
let scanning = false;
let done     = false;

export function renderScan(container, _params, st) {
  done = false;

  container.innerHTML = `
    <div class="page scan-page">

      <!-- Camera viewport -->
      <div class="scan-viewport">
        <div id="qr-reader"></div>
        <!-- Corner decorations -->
        <div class="corner tl"></div>
        <div class="corner tr"></div>
        <div class="corner bl"></div>
        <div class="corner br"></div>
        <!-- Scan line animation -->
        <div class="scan-line"></div>
      </div>

      <!-- Bottom sheet -->
      <div class="scan-sheet">
        <div class="scan-sheet-handle"></div>

        <div id="scan-status" class="scan-status-idle">
          <div class="scan-status-icon">📷</div>
          <div class="scan-status-title">Point at QR Code</div>
          <div class="scan-status-sub">Ask the barista to show the shop QR code</div>
        </div>

        <!-- Shown after result -->
        <button id="scan-retry" class="scan-retry-btn" style="display:none">
          Try again
        </button>
      </div>

    </div>
  `;

  startScanner(st);

  container.querySelector('#scan-retry')?.addEventListener('click', () => {
    done = false;
    setStatus('idle');
    container.querySelector('#scan-retry').style.display = 'none';
    startScanner(st);
  });
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
        { fps: 12, qrbox: { width: 230, height: 230 }, aspectRatio: 1 },
        (text) => onDecoded(text, st),
        () => {}
      )
      .then(() => {
        scanning = true;
        // Hide html5-qrcode default toolbar
        document.getElementById('qr-reader__dashboard')?.remove();
      })
      .catch(() => {
        setStatus('error', '❌', 'Camera denied', 'Allow camera access in your browser settings, then retry.');
      });
  } catch (e) { console.error(e); }
}

async function onDecoded(text, st) {
  if (done) return;
  done = true;

  scanner?.pause(true);
  navigator.vibrate?.(80);
  tg?.HapticFeedback?.impactOccurred('medium');

  setStatus('loading', '⏳', 'Validating…', 'Checking QR code with server');

  try {
    const result = await API.scan(st.userId, text);

    // Update local stamp count
    if (st.user && result.shopId) {
      st.user.coffees         = st.user.coffees || {};
      st.user.coffees[result.shopId] = result.coffees;
      st.user.rewards         = result.rewards;
    }

    tg?.HapticFeedback?.notificationOccurred(result.freeEarned ? 'success' : 'success');

    if (result.freeEarned) {
      setStatus('success', '🎉', 'Free coffee!', result.message);
    } else {
      setStatus('success', '✅', `+1 stamp!`, result.message);
    }

    // Notify Telegram bot
    if (tg?.sendData) {
      try { tg.sendData(JSON.stringify({ type: 'scan_success', message: result.message })); } catch {}
    }

    // Auto return to home after 2.5s
    setTimeout(() => navigate('home'), 2500);

  } catch (err) {
    tg?.HapticFeedback?.notificationOccurred('error');
    setStatus('error', '❌', 'Failed', err.message || 'Something went wrong. Try again.');
    document.getElementById('scan-retry').style.display = 'block';
    done = false;
  }
}

function setStatus(type, icon = '', title = '', sub = '') {
  const el = document.getElementById('scan-status');
  if (!el) return;

  const classes = { idle: 'scan-status-idle', loading: 'scan-status-loading', success: 'scan-status-success', error: 'scan-status-error' };
  el.className = classes[type] || 'scan-status-idle';

  if (type === 'idle') {
    el.innerHTML = `
      <div class="scan-status-icon">📷</div>
      <div class="scan-status-title">Point at QR Code</div>
      <div class="scan-status-sub">Ask the barista to show the shop QR code</div>
    `;
    return;
  }

  if (type === 'loading') {
    el.innerHTML = `<div class="scan-spinner"></div><div class="scan-status-title">${title}</div>`;
    return;
  }

  el.innerHTML = `
    <div class="scan-status-icon">${icon}</div>
    <div class="scan-status-title">${escHtml(title)}</div>
    <div class="scan-status-sub">${escHtml(sub)}</div>
  `;
}

function escHtml(str) {
  return String(str).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
  );
}

export function renderScan(container, params, st) {
  processed = false;

  container.innerHTML = `
    <div class="page scanner-page">
      <!-- Header -->
      <div class="header">
        <button class="header-back" id="back-btn">←</button>
        <div>
          <div class="header-logo">Scan QR</div>
          <div class="header-sub">Point camera at shop QR code</div>
        </div>
      </div>

      <div class="scanner-wrap">
        <!-- QR reader container -->
        <div id="qr-reader"></div>

        <!-- Hint -->
        <div class="scanner-hint" id="scan-hint">
          📷 Align the QR code within the frame.<br/>The camera will auto-detect it.
        </div>

        <!-- Result -->
        <div id="scan-result" style="display:none"></div>

        <!-- Manual retry -->
        <button class="btn btn-secondary" id="retry-btn" style="display:none; max-width:320px; margin-top: 8px;">
          Try again
        </button>

        <!-- Back button -->
        <button class="btn btn-secondary" id="done-btn" style="max-width:320px; margin-top: 8px;">
          ← Back to shops
        </button>
      </div>
    </div>
  `;

  container.querySelector('#back-btn').onclick = () => stopAndNavigate('home');
  container.querySelector('#done-btn').onclick = () => stopAndNavigate('home');
  container.querySelector('#retry-btn').onclick = () => {
    processed = false;
    document.getElementById('scan-result').style.display = 'none';
    document.getElementById('retry-btn').style.display = 'none';
    document.getElementById('scan-hint').textContent = '📷 Align the QR code within the frame.';
    startScanner(st);
  };

  startScanner(st);
}

function startScanner(st) {
  if (scanner) {
    scanner.clear().catch(() => {});
    scanner = null;
  }

  const readerEl = document.getElementById('qr-reader');
  if (!readerEl) return;

  try {
    scanner = new Html5Qrcode('qr-reader');

    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0,
      showTorchButtonIfSupported: true,
    };

    scanner
      .start(
        { facingMode: 'environment' },
        config,
        (decodedText) => onScanSuccess(decodedText, st),
        (_err) => { /* ignore scan misses */ }
      )
      .then(() => {
        scanning = true;
        // Clean up default html5-qrcode UI cruft
        const dashboard = document.getElementById('qr-reader__dashboard');
        if (dashboard) dashboard.style.display = 'none';
      })
      .catch((err) => {
        console.error('Camera error:', err);
        showScanResult(
          '❌',
          'Camera access denied. Please allow camera permissions and try again.',
          'error'
        );
      });
  } catch (err) {
    console.error(err);
  }
}

async function onScanSuccess(decodedText, st) {
  if (processed) return;
  processed = true;

  // Pause scanner
  if (scanner && scanning) {
    scanner.pause(true);
  }

  // Vibrate on success
  navigator.vibrate?.(80);

  showScanResult('⏳', 'Validating QR code...', 'success');

  try {
    const result = await API.scan(st.userId, decodedText);

    // Update local state
    if (st.user) {
      st.user.coffees = st.user.coffees || {};
      st.user.coffees[result.shopId] = result.coffees;
      st.user.rewards = result.rewards;
    }

    showScanResult(result.freeEarned ? '🎉' : '✅', result.message, 'success');

    // Send data back to Telegram bot
    const tg = window.Telegram?.WebApp;
    if (tg?.sendData) {
      tg.sendData(JSON.stringify({ type: 'scan_success', message: result.message }));
    }

    // Navigate to shop detail after delay
    if (result.shopId) {
      setTimeout(() => stopAndNavigate('shop', { shopId: result.shopId }), 2500);
    }
  } catch (err) {
    showScanResult('❌', err.message || 'Scan failed. Please try again.', 'error');
    document.getElementById('retry-btn').style.display = 'flex';
    processed = false; // allow retry
  }
}

function showScanResult(icon, msg, type) {
  const el = document.getElementById('scan-result');
  if (!el) return;
  el.style.display = 'flex';
  el.className = `scan-result ${type}`;
  el.innerHTML = `
    <div class="scan-result-icon">${icon}</div>
    <div class="scan-result-msg">${escHtml(msg)}</div>
  `;

  const hint = document.getElementById('scan-hint');
  if (hint) hint.style.display = 'none';
}

function stopAndNavigate(route, params = {}) {
  if (scanner) {
    scanner.stop().catch(() => {}).finally(() => {
      scanner = null;
      scanning = false;
      navigate(route, params);
    });
  } else {
    navigate(route, params);
  }
}

function escHtml(str) {
  return String(str).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
