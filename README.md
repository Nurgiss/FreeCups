# FreeCups ☕

**Coffee loyalty system built on Telegram Mini Apps.**
Collect 6 stamps → get 1 free coffee.

---

## Project Structure

```
FreeCups/
├── backend/          # Node.js + Express API
│   ├── src/
│   │   ├── index.js
│   │   ├── firebase.js
│   │   ├── controllers/
│   │   │   ├── scanController.js
│   │   │   ├── userController.js
│   │   │   └── shopsController.js
│   │   └── routes/
│   │       ├── scan.js
│   │       ├── user.js
│   │       └── shops.js
│   └── .env.example
│
├── bot/              # Telegram Bot
│   ├── src/index.js
│   └── .env.example
│
├── webapp/           # Telegram Mini App (Vanilla JS SPA)
│   ├── index.html
│   ├── app.js
│   ├── style.css
│   └── pages/
│       ├── home.js
│       ├── shop.js
│       └── scan.js
│
└── scripts/          # Utility scripts
    ├── seedShops.js
    └── generateQR.js
```

---

## 1. Firebase Setup

### 1.1 Create a Firebase project

1. Go to [https://console.firebase.google.com](https://console.firebase.google.com)
2. Click **"Add project"** → name it `freecups`
3. Disable Google Analytics (optional)

### 1.2 Enable Firestore

1. In sidebar → **Firestore Database**
2. Click **"Create database"**
3. Choose **"Start in test mode"** (switch to production rules later)
4. Pick a region close to your users

### 1.3 Create a Service Account

1. In sidebar → **Project Settings** → **Service Accounts**
2. Click **"Generate new private key"**
3. Download the JSON file
4. Save it as `backend/firebase-service-account.json`

### 1.4 Firestore Security Rules (production)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Only backend can write (service account bypasses rules)
    match /users/{userId} {
      allow read, write: if false;
    }
    match /shops/{shopId} {
      allow read: if false;
      allow write: if false;
    }
  }
}
```

---

## 2. Backend Setup

```bash
cd backend
cp .env.example .env
# Fill in your values in .env
npm install
npm run dev
```

### Environment Variables (`backend/.env`)

| Variable | Description |
|---|---|
| `PORT` | Server port (default: 3000) |
| `FIREBASE_SERVICE_ACCOUNT_PATH` | Path to Firebase JSON key |
| `STAMPS_REQUIRED` | Stamps for free coffee (default: 6) |
| `SCAN_COOLDOWN_MINUTES` | Min time between scans per shop (default: 30) |
| `QR_MAX_AGE_MINUTES` | Max QR code age if timestamp included (default: 10) |

---

## 3. Telegram Bot Setup

### 3.1 Create bot via BotFather

1. Open [@BotFather](https://t.me/BotFather) on Telegram
2. Send `/newbot`
3. Follow the prompts, get your **BOT_TOKEN**
4. Send `/setmenubutton` → set a Web App button with your webapp URL

### 3.2 Run the bot

```bash
cd bot
cp .env.example .env
# Set TELEGRAM_BOT_TOKEN and WEBAPP_URL
npm install
npm run dev
```

### Bot Commands

| Command | Description |
|---|---|
| `/start` | Show welcome message + Open App button |
| `/mystamps` | Quick stamp summary |
| `/help` | Usage instructions |

---

## 4. Web App Setup

### 4.1 Local development

The Web App is pure HTML/CSS/JS — no build step needed.

```bash
# Serve with any static server, e.g.:
cd webapp
npx serve .
# or
python3 -m http.server 8080
```

### 4.2 Update backend URL

In `webapp/index.html`, change:
```js
window.BACKEND_URL = 'http://localhost:3000';
```
to your deployed backend URL.

### 4.3 Deploy

Deploy to any static host:
- **Vercel**: `vercel --prod` in the `webapp/` folder
- **Netlify**: drag & drop `webapp/` folder
- **GitHub Pages**: push to a gh-pages branch

The URL must be **HTTPS** for Telegram Mini Apps.

---

## 5. Seed & QR Codes

```bash
cd scripts
cp ../backend/.env .env  # reuse backend env
npm install

# 1. Seed demo shops into Firestore
node seedShops.js

# 2. Generate QR code images
node generateQR.js
# → outputs to scripts/qr-codes/<shopId>.png
```

Print QR codes and place them at the coffee shop counter.

---

## 6. API Reference

### `POST /scan`

```json
{
  "userId": "123456789",
  "qrData": "{\"shopId\":\"shop_brew_bar\",\"secret\":\"abc123\"}"
}
```

**Response:**
```json
{
  "success": true,
  "message": "☕ +1 stamp at Brew Bar! 3 more for a free coffee.",
  "coffees": 3,
  "rewards": 0,
  "shopId": "shop_brew_bar",
  "freeEarned": false
}
```

### `GET /user/:id`

```json
{
  "id": "123456789",
  "coffees": { "shop_brew_bar": 3 },
  "rewards": 1,
  "lastScanAt": { "shop_brew_bar": 1715000000000 }
}
```

### `GET /shops`

```json
[
  { "id": "shop_brew_bar", "name": "Brew Bar", "emoji": "☕" }
]
```

---

## 7. Abuse Prevention

| Measure | Implementation |
|---|---|
| **Secret validation** | Each shop has a `secret` in Firestore; QR must match |
| **Per-user cooldown** | 30 min between scans at the same shop (configurable) |
| **QR expiry** | Optional timestamp in QR, rejected if > 10 min old |
| **IP rate limit** | Max 10 requests/min per IP via `express-rate-limit` |

---

## 8. How QR Codes Work

```
Barista shows QR ──► User scans in app ──► App sends raw QR string to /scan
                                                    │
                                          Backend parses JSON
                                                    │
                                    Validates shopId + secret against Firestore
                                                    │
                                          Checks cooldown
                                                    │
                                          Increments stamp
                                                    │
                                    Returns result → UI updates
```

QR payload format:
```json
{
  "shopId": "shop_brew_bar",
  "secret": "a1b2c3d4e5f6...",
  "timestamp": 1715000000000
}
```

The `timestamp` field is **optional** but recommended to prevent QR screenshot reuse.

---

## Local Dev Quick Start

```bash
# Terminal 1 — Backend
cd backend && npm install && npm run dev

# Terminal 2 — Bot
cd bot && npm install && npm run dev

# Terminal 3 — Web App
cd webapp && npx serve .

# Terminal 4 — Seed DB (once)
cd scripts && npm install && node seedShops.js && node generateQR.js
```

Then open Telegram, `/start` your bot, tap **Open FreeCups**.
