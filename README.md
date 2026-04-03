# Dream

Direct ordering MVP for local restaurants/businesses with **no login flow** and a fast two-screen UX.

## Project Structure

- `flutter_app/` — Flutter mobile client
- `backend/` — Node.js + Express API with JSON-file persistence
- `docs/ARCHITECTURE.md` — lightweight architecture notes
- `docs/API_CONTRACT.md` — API request/response contract

## 1) Run Backend (Node.js + Express)

```bash
cd /home/ubuntu/.openclaw/workspace/Dream/backend
npm install
npm start
```

Backend default URL: `http://localhost:4000`

## 2) Run Flutter App

```bash
cd /home/ubuntu/.openclaw/workspace/Dream/flutter_app
/home/ubuntu/flutter-sdk/bin/flutter pub get
/home/ubuntu/flutter-sdk/bin/flutter run --dart-define=BACKEND_URL=http://localhost:4000
```

> For Android emulator, use:
>
> `--dart-define=BACKEND_URL=http://10.0.2.2:4000`

## Flutter App Features

- Home screen:
  - Ad carousel (backend-driven)
  - Product list with price and +/- quantity controls
  - Running total amount
  - Buy Now button
- Checkout screen:
  - Order summary
  - Payment instructions (from backend)
  - Admin phone and call CTA
- No auth, no profile, no extra tabs

## Backend API Endpoints

- `GET /api/ads`
- `GET /api/products`
- `GET /api/config`
- `POST /api/orders`
- `GET /api/orders`

See `docs/API_CONTRACT.md` for full payloads.

## Verification Done

### Flutter

```bash
cd /home/ubuntu/.openclaw/workspace/Dream/flutter_app
/home/ubuntu/flutter-sdk/bin/flutter analyze
```

Result: **No issues found**

### Backend smoke run

- Started backend
- Hit `GET /api/ads`, `GET /api/products`, `GET /api/config`
- Submitted sample order via `POST /api/orders`
- Verified order listing via `GET /api/orders`

## Persistence

- Seed data: `backend/data/seed.json`
- Runtime DB: `backend/data/db.json`
