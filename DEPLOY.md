# FreeCups — Deploy Guide

## Структура деплоя

```
GitHub repo
├── webapp/      → Vercel  (статика, бесплатно)
└── backend/     → Railway (Express + Bot webhook, ~$5/мес или бесплатно)
```

---

## Шаг 1 — Firebase

1. Открой [console.firebase.google.com](https://console.firebase.google.com)
2. Создай проект → включи **Firestore** (Native mode)
3. **Project Settings → Service accounts → Generate new private key**
4. Сохрани JSON как `backend/firebase-service-account.json`
5. Создай `.env` из примера:
   ```bash
   cd backend && cp .env.example .env
   ```

---

## Шаг 2 — GitHub

```bash
cd /путь/к/FreeCups
git init
git add .
git commit -m "init"
# Создай репо на github.com, затем:
git remote add origin https://github.com/ТВОЙюзер/freecups.git
git push -u origin main
```

> ⚠️ Убедись что `.gitignore` содержит `firebase-service-account.json` и `.env`

---

## Шаг 3 — Railway (Backend + Bot)

1. Зайди на [railway.app](https://railway.app) → **New Project → Deploy from GitHub repo**
2. Выбери свой репо → **Add service → GitHub Repo**
3. В настройках сервиса:
   - **Root Directory:** `backend`
   - **Start command:** `node src/index.js`
4. Перейди в **Variables** и добавь все переменные:

```
PORT=3000
TELEGRAM_BOT_TOKEN=токен_от_botfather
WEBAPP_URL=https://freecups-webapp.vercel.app   ← заполнишь после шага 4
WEBHOOK_URL=https://freecups-backend.up.railway.app
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json
SHOP_ID=shop_main
QR_MAX_AGE_MINUTES=10
SCAN_COOLDOWN_MINUTES=30
STAMPS_REQUIRED=6
```

5. В Railway: **Settings → Domains** → сгенерируй домен (это и есть `WEBHOOK_URL`)
6. Загрузи `firebase-service-account.json` через **Railway → Files** или добавь содержимое как переменную `FIREBASE_SERVICE_ACCOUNT` (JSON строкой)

---

## Шаг 4 — Vercel (Webapp)

### Вариант A — через сайт (проще)

1. Зайди на [vercel.com](https://vercel.com) → **Add New Project**
2. Импортируй GitHub репо
3. Настройки:
   - **Framework Preset:** Other
   - **Root Directory:** `webapp`
   - **Build Command:** *(пусто)*
   - **Output Directory:** `.`
4. Добавь **Environment Variable:**
   ```
   # В webapp/index.html замени строку:
   window.BACKEND_URL = 'https://freecups-backend.up.railway.app';
   ```
   Или используй Vercel env vars через `vercel.json`
5. Deploy → скопируй URL вида `https://freecups-xyz.vercel.app`

### Вариант B — через CLI

```bash
npm i -g vercel
cd webapp
vercel --prod
```

---

## Шаг 5 — Обновить WEBAPP_URL

После деплоя Vercel вернись в Railway и обнови переменную:
```
WEBAPP_URL=https://freecups-xyz.vercel.app
```
Railway автоматически перезапустит сервис.

---

## Шаг 6 — BotFather: зарегистрировать Mini App

1. Открой @BotFather
2. `/mybots` → выбери бота
3. **Bot Settings → Menu Button → Configure menu button**
   - Введи URL: `https://freecups-xyz.vercel.app`
   - Текст кнопки: `Open FreeCups ☕`
4. Теперь у пользователей будет кнопка прямо в интерфейсе бота

---

## Шаг 7 — Seed + QR

```bash
cd scripts && npm install
node seedShops.js    # создаёт shop_main в Firestore
node generateQR.js   # → scripts/qr-codes/shop_main.png
```

Распечатай `shop_main.png` → поставь на стойку ☕

---

## GitHub Actions (автодеплой)

При каждом `git push origin main` — автоматически деплоится всё.

Добавь секреты в **GitHub → Settings → Secrets → Actions**:

| Secret | Где взять |
|--------|-----------|
| `VERCEL_TOKEN` | vercel.com → Settings → Tokens |
| `VERCEL_ORG_ID` | vercel.com → Settings → General |
| `VERCEL_PROJECT_ID_WEBAPP` | Vercel проект → Settings |
| `RAILWAY_TOKEN` | railway.app → Account → Tokens |

---

## Обновить BACKEND_URL в webapp

Открой [webapp/index.html](../webapp/index.html) и замени:

```js
window.BACKEND_URL = 'https://freecups-backend.up.railway.app';
```

---

## Проверка

```bash
# Health check
curl https://freecups-backend.up.railway.app/health

# Список магазинов
curl https://freecups-backend.up.railway.app/shops

# Данные пользователя
curl https://freecups-backend.up.railway.app/user/123456789
```
