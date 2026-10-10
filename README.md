# SwapCloset — Clothing Exchange & Swap Marketplace

A React + Vite frontend with separate page components, an Express API, and a SQLite database.

## Pages with their own code

Each page is implemented in its own file under `client/src/pages/`:

- `HomePage.jsx` — home and featured listings
- `BrowsePage.jsx` — search and filter listings
- `ItemDetailsPage.jsx` — listing details, wishlist, and swap request
- `AuthPage.jsx` — sign in and registration
- `DashboardPage.jsx` — user dashboard
- `SellPage.jsx` — create a listing
- `MyListingsPage.jsx` — manage personal listings
- `SwapsPage.jsx` — view and respond to swap requests
- `WishlistPage.jsx` — saved listings
- `NotificationsPage.jsx` — account notifications
- `ProfilePage.jsx` — profile details
- `AdminPage.jsx` — admin overview
- `HowItWorksPage.jsx` — how the marketplace works
- `NotFoundPage.jsx` — 404 page

`client/src/App.jsx` only connects page components to routes. Reusable layout, auth context, API helpers, and small shared UI elements live in `client/src/shared.jsx`.

## Requirements

Install Node.js 20 or newer (Node.js 22 LTS recommended). For `better-sqlite3`, allow npm to run required install scripts if npm prompts you.

## Run locally

1. Extract this ZIP.
2. In VS Code, open the extracted project root — the same folder that contains `package.json`.
3. Open **Terminal → New Terminal**.
4. Run `npm install` and wait for it to finish.
5. Run `npm run dev`.
6. Open `http://localhost:8081`.

The API health endpoint is `http://localhost:5000/api/health`.

## Demo accounts

- Admin: `admin@swapcloset.local` / `admin123`
- Member: `demo@swapcloset.local` / `demo123`

The server creates the SQLite database and starter listings on first run. This is a local-development project; change the JWT secret and add production security settings before public deployment.
