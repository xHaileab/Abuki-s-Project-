# Dream Architecture (Lightweight)

## Goal
Ship a fast MVP ordering flow for local businesses with no account creation.

## High-Level Components

1. **Flutter App (`flutter_app`)**
   - Presentation + user interactions
   - State management via `provider` (`OrderProvider`)
   - HTTP integration to backend API (`ApiService`)
   - Two-screen flow:
     - Home (ads + order selection)
     - Checkout (summary + payment + call admin)

2. **Backend API (`backend`)**
   - Express server exposing REST endpoints
   - CORS enabled for Flutter client
   - JSON file persistence for simple MVP storage
   - Input validation + basic error handling

3. **Persistence (`backend/data/db.json`)**
   - Ads
   - Products
   - App config (admin phone + payment note)
   - Orders

## Request Flow

1. App starts and fetches:
   - `/api/ads`
   - `/api/products`
   - `/api/config`
2. User adjusts quantities locally in provider state.
3. User taps **Buy Now**.
4. App sends `POST /api/orders` with selected items + total.
5. Backend validates and stores order, returns created order.
6. App opens Checkout screen with order summary and admin call instruction.

## Design Notes

- Visual theme inspired by provided references:
  - Turquoise background motif
  - Rounded cards and buttons
  - Bold orange primary CTA elements
- Product model supports optional image, but UI intentionally avoids per-item images for speed.

## MVP Constraints

- No authentication
- No user profile
- No admin dashboard UI (admin listing via `GET /api/orders`)
- File-based DB suitable for MVP/small scale only
