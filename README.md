# Urban Bites — Restaurant Management System (RMS + POS + ERP)

A complete, working restaurant management system for the fictional **Urban Bites Restaurant** (Gulberg III, Lahore). Separate from all other Tensils projects — do not mix with ProPOS, TensilsOS, or any other system.

**Stack:** Vite + React 19 + TypeScript + Tailwind CSS v4. Static single-page app — no server required. All data persists in the browser's `localStorage` and is seeded with demo data on first load.

## Deploy on Vercel (from GitHub)

1. Push this repo to GitHub (already at `https://github.com/tensilstechnologies-afk/urban-bites-rms`).
2. In the Vercel dashboard: **Add New → Project → Import** the `urban-bites-rms` repo.
3. Framework preset: **Vite**. Build command: `npm run build`. Output directory: `dist`.
4. Deploy. No environment variables are needed.

A `vercel.json` is included with the SPA fallback rewrite.

## Run locally

```bash
npm install
npm run dev      # dev server
npm run build    # production build → dist/
npm run preview  # preview the production build
```

## Demo logins

Password for **every** demo account: `demo1234`

| Role | Email | Name |
|---|---|---|
| Restaurant Owner | owner@urbanbites.pk | Ahmed Raza |
| Super Admin | admin@urbanbites.pk | System Admin |
| Restaurant Admin | fatima@urbanbites.pk | Fatima Noor |
| General Manager | manager@urbanbites.pk | Bilal Hussain |
| Cashier | cashier@urbanbites.pk | Ayesha Khan |
| Waiter | usman@urbanbites.pk | Usman Tariq |
| Waiter | ali@urbanbites.pk | Ali Hassan |
| Chef | chef@urbanbites.pk | Imran Sheikh |
| Kitchen Staff | kitchen@urbanbites.pk | Kamran Ali |
| Inventory Manager | inventory@urbanbites.pk | Hira Shahid |
| Accountant | accountant@urbanbites.pk | Omar Farooq |

Click any demo account on the sign-in screen to autofill it. There is also a **guest online-menu** link — no login needed.

## What's inside

- **Owner dashboard** — real aggregates from seeded orders (sales, orders, completed/cancelled, AOV, top items, category sales, payment breakdown, waiter stats, daily sales chart), date filters Today / 7 days / 30 days / custom.
- **POS** — categories + food cards with real food photos, search/filter, variations, modifiers, special instructions, discounts, 5% tax, service charge, delivery fee, order types (dine-in / takeaway / delivery / pickup / online), Cash / Card / Bank Transfer / Digital Wallet, split payment, hold/resume, printable invoice/receipt modal.
- **Tables** — visual floor plan, Main Hall + Family Hall, 12 tables (T1–T12) with statuses available / occupied / reserved / waiting for food / served / payment pending / cleaning, reservations.
- **Kitchen Display (KDS)** — live tickets new → accepted → preparing → ready → served → completed, stations Fast Food / Chinese / Desi Kitchen / BBQ / Beverages, timers.
- **Menu management** — CRUD for categories and products, variations, modifiers, recipes.
- **Inventory** — 16 ingredients with stock, min levels, low/expiring alerts, stock adjustments, automatic recipe deduction when an order is placed.
- **Suppliers & purchases** — supplier profiles with outstanding balances, purchase orders, payments.
- **Customers (CRM)** — profiles, order history, lifetime spend, favourite items, loyalty points (10 pts per PKR 1,000).
- **Staff** — staff list, salaries, attendance check-in/out, waiter performance.
- **Expenses & financial reports** — revenue, COGS, gross/net profit, tax, discounts, refunds, payment breakdown, CSV export.
- **Online storefront** — hero, categories, best sellers, full menu, cart, checkout (delivery/pickup); online orders flow straight into POS and KDS.
- **Notifications, settings, audit log** — PKR default currency (configurable), tax 5%, service charge, loyalty rules, light + dark themes (saved per device).

## Demo data (seeded)

- 11 categories, **34 dishes** (PKR prices as specified in the brief).
- **54 orders over 13–19 Nov 2026** — 48 completed, 3 pending, 3 cancelled. Completed sales total ≈ **PKR 136,530** (seeded deterministically; the reference figure was ≈ PKR 140,392).
- Waiters Usman Tariq and Ali Hassan; 8 customers; 16 ingredients (Cooking Oil 14 L and Cheese 3.5 kg low; Milk expiring 22 Nov 2026).

## Notes / limitations of this build

- **Demo build:** role permissions are enforced client-side only. A production deployment should enforce them server-side with a real database (PostgreSQL + API).
- Data lives in the browser (`localStorage`) — clearing site data resets the demo. Use **Settings → Reset demo data** to restore the seed.
- Food photos are stable Unsplash URLs with an automatic fallback image if one fails to load.
