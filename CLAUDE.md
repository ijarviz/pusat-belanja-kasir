# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## What this is

`kasir` (package name `kasir-gudang-import`) is the **point-of-sale (kasir) app for Pusat Belanja outlets**. It is **not** one of the CodeIgniter/Autolaris Shop API storefronts described in `/autolaris/websites/CLAUDE.md`. It is a Next.js 16 (App Router, React 19) + Supabase app, deployed on Vercel (see `vercel.json`). The catalog, transactions, stock, vouchers and printers all live in **Supabase Postgres**. Shipping goes through a separate **shipment-service** (AutoKirim). It shares that Supabase DB with two sibling apps: the admin dashboard `../panel/` ("gudang-import") and the storefront `../store/`. See `../CLAUDE.md` for how the three fit together. None of the three repos defines the schema or RPCs; those live only in the Supabase project.

`README.md` is still the stock create-next-app README. UI copy, comments and route names are in Indonesian (`penjualan` = sales, `cek-harga` = price check, `pengaturan` = settings, `nonaktif` = inactive).

## Commands

```bash
npm install        # node_modules is not checked in
npm run dev        # next dev
npm run build      # next build
npm run lint       # eslint (flat config: next core-web-vitals + typescript)
npx tsc --noEmit   # type-check; there is no dedicated script
```

There is no test suite. Git remote: `git@github.com:ijarviz/pusat-belanja-kasir.git` (branch `main`).

Env vars (`.env*` is gitignored): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SHIPMENT_SERVICE_URL`, `SHIPMENT_API_KEY` (server-only, never expose to the client), plus optional `NEXT_PUBLIC_APP_URL`, `PUPPETEER_EXECUTABLE_PATH`, `NEXT_PUBLIC_ENABLE_SIGNUP` and `NEXT_PUBLIC_ENABLE_FORGOT_PASSWORD`. If the Supabase vars are missing, `lib/supabase/proxy.ts` skips the auth check (`hasEnvVars`).

## Architecture

**Auth + session.** `proxy.ts` (Next 16's replacement for `middleware.ts`) calls `updateSession` in `lib/supabase/proxy.ts`. That refreshes the Supabase session cookie and redirects unauthenticated users to `/auth/login`. Supabase has three clients: `lib/supabase/server.ts` (Server Components / route handlers, cookie-based), `lib/supabase/client.ts` (browser) and the proxy one. Server code gets the user through `getAuthUser()` in `lib/auth.ts`, which redirects if there is no user.

**Multi-outlet tenancy is cookie-driven.** A user belongs to outlets through `outlet_users` (role and status). `getActiveOutlet()` in `lib/outlet.ts` loads the user's active memberships and redirects to `/nonaktif` if there are none. It then picks the outlet whose id is in the `outlet_id` cookie, falling back to the first one. `components/outlet-switcher.tsx` writes that cookie on the client with js-cookie. Data queries read the cookie directly through `getCurrentOutletId()` in `lib/current-outlet.ts` and filter by `outlet_id`. Older code keyed outlets by `outlet_code`, and commented-out `outlet_code` code is still everywhere. The current key is `outlet_id` (a uuid).

**Domain layer.** Each domain gets a folder under `lib/<domain>/`: `products`, `transactions`, `stock-movements`, `vouchers` and `expedition`. Each folder has the same split: `types.ts`, `queries.ts` (reads), `mutations.ts` (writes) and sometimes `transformers.ts`. `products/transformers.ts` (`mapProduct`) turns snake_case DB rows into camelCase domain types. Some mutations use the browser client and run from client components.

**Checkout.** `components/kasir/kasir-client.tsx` is the main POS screen. It is a large client component holding the cart, barcode scanning and the payment dialog. Checkout calls the Supabase RPC **`create_store_transaction`**, which creates the transaction and its stock movements atomically. The RPC receives a per-item product snapshot (`p_products`). After the RPC returns, the client re-fetches the row from `transactions` to show the success dialog and print.

**Receipt printing goes directly from the browser to the device.** Receipts are ESC/POS bytes built in `lib/printer/escpos.ts` and sent through **WebUSB** (`lib/printer/usb.ts`) or **Web Bluetooth** (`lib/printer/bluetooth.ts`). The typings for both are in `types/`. Printer configs are stored per outlet in the `printer_devices` table and managed at `/kasir/pengaturan/printer`. `lib/printer/transaction-print.ts` looks up the outlet's default printer and dispatches the job. These APIs only work in Chromium browsers on a secure context.

**Shipping labels (resi) are PDFs rendered server-side with headless Chrome.** `app/print/[id]/pdf/route.ts` and `app/print/bulk/pdf/route.ts` launch Chromium through `lib/pdf/browser.ts` and load the app's own `/print/[id]` page, forwarding the caller's raw `Cookie` header so the page can authenticate. On Vercel they use `@sparticuz/chromium`. Locally they use `PUPPETEER_EXECUTABLE_PATH` or full `puppeteer`'s cached Chrome. `next.config.ts` needs **both** `serverExternalPackages` and `outputFileTracingIncludes` for the chromium `bin/`. If you add a new PDF route, add it to `outputFileTracingIncludes` and to `vercel.json` (60s, 1024MB), or it will fail on Vercel.

**Shipment-service proxy.** `app/api/shipment/*` route handlers keep `SHIPMENT_API_KEY` on the server (sent as the `X-API-KEY` header). `area` proxies area search. `cancel/[id]` voids an AWB using `transactions.shipping_ref1` and then marks the transaction cancelled. Client code calls these routes, never the shipment-service itself (see `cancelShipment` in `lib/transactions/mutations.ts`).

**UI.** shadcn/ui (`components.json`: style `radix-maia`, hugeicons icon library, Tailwind v4 via `app/globals.css`) with primitives in `components/ui/`. Tables use TanStack Table with a `page.tsx` / `columns.tsx` / `data-table.tsx` trio per route (`app/kasir/penjualan`, `app/kasir/order-web`). `/` redirects to `/kasir`. `app/kasir/layout.tsx` enforces the active outlet and renders the sidebar.

## Quirks

- `app/kasir/penjualan copy/` is a leftover duplicate. Because App Router turns every folder into a route, it is still live at `/kasir/penjualan copy`. Edit `app/kasir/penjualan/`, not the copy.
- The proxy's public-path allowlist still includes `/instruments`, left over from the Supabase starter template.
- `next.config.ts` only allows remote images from one Supabase storage host.
- The root layout currently loads Figtree and Geist. The cross-site default font is Outfit (see `/autolaris/websites/CLAUDE.md`); apply it if fonts get touched.
