# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## What this is

`kasir` (package name `kasir-gudang-import`) is the **point-of-sale (kasir) app for Pusat Belanja outlets**. It is **not** one of the CodeIgniter/Autolaris Shop API storefronts described in `/autolaris/websites/CLAUDE.md`. It is a Next.js 16 (App Router, React 19) app.

**Since 2026-10-14 its data lives in this server's MariaDB (database `pusatbelanja`), not Supabase.** The schema, procedures and triggers are in `../docs/db-pusatbelanja-mariadb.sql` and `../docs/db-function-pusatbelanja-mariadb.sql`. It shares that database with the admin dashboard `../panel/` ("gudang-import"), which moved first and whose data layer this app reuses. The storefront `../store/` is still on Supabase, so web orders and the storefront catalog are split from this app until it moves too. See `../CLAUDE.md` for how the three fit together. Shipping goes through a separate **shipment-service** (AutoKirim).

Users, passwords and outlet memberships are managed in `panel` (Akses Tim page). This app only logs users in.

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

Lint isn't clean (36 errors, mostly `no-explicit-any`, all from before the migration); don't add more.

Env vars (`.env*` is gitignored; `.env.local` on this server already holds local values):

- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`: MariaDB. The same credentials are in `../.db-credentials`.
- `AUTH_SECRET`: signs the session cookie, at least 32 characters. Changing it logs everyone out.
- `UPLOAD_PUBLIC_URL`: where `panel` serves uploaded images. In production it must be `panel`'s absolute URL (e.g. `https://panel.example/uploads`) so `next/image` allows that host.
- `SHIPMENT_SERVICE_URL`, `SHIPMENT_API_KEY`: server-only, never expose to the client.
- Optional: `NEXT_PUBLIC_APP_URL`, `PUPPETEER_EXECUTABLE_PATH`, `DB_POOL_SIZE`.

**Hosting.** The app can no longer run on Vercel, because MariaDB is only reachable from this server. It has to be hosted here (systemd + Apache reverse proxy, like `webmarket-jobs`); that isn't set up yet. WebUSB and Web Bluetooth printing need HTTPS.

## Architecture

**Database (`lib/db.ts`, copied from `panel`).** A `mysql2` pool whose type casts make rows look like Supabase's: `TINYINT(1)` becomes boolean, `DATETIME` an ISO UTC string, `DECIMAL` a number. JSON columns (`transactions.products`, `products.variant_config`) stay strings; parse them with `parseJson()` (`normalizeTransaction()` does it for transactions). The server runs in UTC; don't change the session `time_zone`.

**Auth + session.** Local `users` table with bcrypt passwords. `lib/auth-actions.ts` has only `loginAction` and `logoutAction`. The session is a signed JWT cookie, `pb_session` (`lib/session-token.ts`, `lib/session.ts`). `proxy.ts` (Next 16's replacement for `middleware.ts`) redirects requests without a valid session to `/auth/login`, except `/`, `/auth/*` and `/login`. Server code gets the user through `getAuthUser()` in `lib/auth.ts`, which redirects if there is no user.

**No RLS: every data access is checked on the server.** All queries and writes run on the server (Server Components, route handlers or `"use server"` actions); client components never touch the database. Every action and route handler calls `requireOutletAccess()` (`lib/outlet.ts`, re-exported from `lib/access.ts`) and scopes its query to `activeOutlet.id`. Everything a `"use server"` file exports can be called straight from the browser, so keep internal helpers in `server-only` modules. Next hides thrown server-action error messages in production, so return `{ success: false, message }` when the user must see the message.

**Multi-outlet tenancy is cookie-driven.** A user belongs to outlets through `outlet_users` (role and status). `getActiveOutlet()` in `lib/outlet.ts` (aliased as `requireOutletAccess`) loads the user's active memberships and redirects to `/nonaktif` if there are none. It then picks the outlet whose id is in the `outlet_id` cookie, falling back to the first one; the cookie is only a preference and membership is always checked. Unlike `panel`, every active role may use this app, including `kasir`. `components/outlet-switcher.tsx` writes that cookie on the client with js-cookie. `getCurrentOutletId()` in `lib/current-outlet.ts` returns the validated active outlet id. Older code keyed outlets by `outlet_code`, and commented-out `outlet_code` code is still everywhere. The current key is `outlet_id` (a uuid).

**Domain layer.** Each domain gets a folder under `lib/<domain>/`. Only `products` (read-only catalog: `queries.ts`, `rows.ts`, `transformers.ts`) and `transactions` (`queries.ts`, `actions.ts`, `checkout-actions.ts`, `mutations.ts`, `receipt.ts`) have code; `stock-movements`, `vouchers` and `expedition` keep only types. Their Supabase query and mutation files were unused here and were removed in the migration; `panel` has the MariaDB versions. `products/rows.ts` replaces Supabase's nested select (`*, category, variants, images`), and `products/transformers.ts` (`mapProduct`) turns snake_case DB rows into camelCase domain types.

**Checkout.** `components/kasir/kasir-client.tsx` is the main POS screen. It is a large client component holding the cart, barcode scanning and the payment dialog. Checkout calls `createStoreTransactionAction` (`lib/transactions/checkout-actions.ts`), which runs the MariaDB procedure **`create_store_transaction`** through `withUserConnection()` (it sets `@app_user_id`, the procedure's replacement for `auth.uid()`). The procedure creates the transaction (`channel = 'store'`) and its stock movements atomically and rejects the whole sale if any item is short of stock; the action returns that message as-is. The action also checks that the outlet is the user's active outlet, which the Supabase RPC never did. It then returns the saved transaction for the success dialog and printing. The cart already caps quantities at the stock loaded with the page, so the procedure's stock error only shows when stock changed after the page loaded. Selling a variant lowers the variant's stock but not the parent product's total; that's how the original RPC behaved.

**Receipt printing goes directly from the browser to the device.** Receipts are ESC/POS bytes built in `lib/printer/escpos.ts` and sent through **WebUSB** (`lib/printer/usb.ts`) or **Web Bluetooth** (`lib/printer/bluetooth.ts`). The typings for both are in `types/`. Printer configs are stored per outlet member (`printer_devices.outlet_user_id`) and managed at `/kasir/pengaturan/printer` (actions in `app/kasir/pengaturan/printer/actions.ts`). `lib/printer/transaction-print.ts` runs in the browser; it gets the logged-in user's default printer and the outlet header through `lib/printer/actions.ts`, then dispatches the job. The Supabase version looked up any default printer in the outlet and broke once two members each had one. These APIs only work in Chromium browsers on a secure context.

**Shipping labels (resi) are PDFs rendered server-side with headless Chrome.** `app/print/[id]/pdf/route.ts` and `app/print/bulk/pdf/route.ts` launch Chromium through `lib/pdf/browser.ts` and load the app's own `/print/[id]` page, forwarding the caller's raw `Cookie` header (`pb_session` + `outlet_id`) so the page can authenticate. `/print` pages only show the active outlet's transactions (`getTransactionsForPrint`). Locally Chromium comes from `PUPPETEER_EXECUTABLE_PATH` or full `puppeteer`'s cached Chrome. `vercel.json`, `@sparticuz/chromium` and `outputFileTracingIncludes` are left over from Vercel.

**Shipment-service proxy.** `app/api/shipment/*` route handlers keep `SHIPMENT_API_KEY` on the server (sent as the `X-API-KEY` header). `area` proxies area search. `cancel/[id]` voids an AWB using `transactions.shipping_ref1` (the transaction must belong to the active outlet) and then marks the transaction cancelled. Client code calls these routes, never the shipment-service itself (see `cancelShipment` in `lib/transactions/mutations.ts`).

**UI.** shadcn/ui (`components.json`: style `radix-maia`, hugeicons icon library, Tailwind v4 via `app/globals.css`) with primitives in `components/ui/`. Tables use TanStack Table with a `page.tsx` / `columns.tsx` / `data-table.tsx` trio per route (`app/kasir/penjualan`, `app/kasir/order-web`). `/` redirects to `/kasir`. `app/kasir/layout.tsx` enforces the active outlet and renders the sidebar.

## Quirks

- `app/kasir/penjualan copy/` is a leftover duplicate. Because App Router turns every folder into a route, it is still live at `/kasir/penjualan copy`. Edit `app/kasir/penjualan/`, not the copy.
- In Next 16, `router.refresh()` called right after `router.push()` cancels the navigation. For `force-dynamic` pages, `push()` alone is enough.
- `next.config.ts` allows remote images from the old Supabase Storage host (imported data) and from the `UPLOAD_PUBLIC_URL` host.
- The root layout currently loads Figtree and Geist. The cross-site default font is Outfit (see `/autolaris/websites/CLAUDE.md`); apply it if fonts get touched.
