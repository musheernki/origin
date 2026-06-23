# M M Nilekani Travels

A premium full-stack travel booking website with a futuristic glassmorphism UI — luxury destinations, bookings, wishlist, reviews, and an admin panel.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, proxied at `/api`)
- `pnpm --filter @workspace/mm-nilekani-travels run dev` — run the frontend (port 20630, proxied at `/`)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run typecheck:libs` — build composite lib declarations (run before leaf typechecks)
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/scripts run seed` — seed database with 12 sample destinations
- Required env: `DATABASE_URL`, `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`, `VITE_CLERK_PUBLISHABLE_KEY`
- Optional env: `STRIPE_SECRET_KEY` (payments fall back to mock if absent)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Tailwind CSS, shadcn/ui, Framer Motion, glassmorphism design
- Auth: Clerk (`@clerk/react`, `@clerk/express`)
- API: Express 5
- DB: PostgreSQL + Drizzle ORM (6 tables: users, destinations, bookings, wishlist, reviews, notifications)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec at `lib/api-spec/openapi.yaml`)
- Payments: Stripe (optional, gracefully mocked when key absent)
- Build: esbuild (CJS bundle for API)

## Where things live

- `lib/db/src/schema/` — 6 Drizzle schema files (users, destinations, bookings, wishlist, reviews, notifications)
- `lib/api-spec/openapi.yaml` — OpenAPI source of truth (30+ endpoints)
- `lib/api-client-react/src/` — generated hooks, schemas, queryClient singleton
- `artifacts/api-server/src/routes/` — Express route handlers (destinations, bookings, wishlist, reviews, users, notifications, admin, payments)
- `artifacts/api-server/src/middlewares/requireAuth.ts` — Clerk auth middleware + JIT user provisioning
- `artifacts/mm-nilekani-travels/src/pages/` — all frontend pages
- `artifacts/mm-nilekani-travels/src/lib/theme.ts` — glassmorphism style utilities
- `scripts/src/seed.ts` — database seeder (12 destinations)

## Architecture decisions

- Clerk manages auth on both frontend (`@clerk/react`) and backend (`@clerk/express`); JIT provisioning creates user rows on first authenticated request
- `queryClient` singleton lives in `lib/api-client-react` so all frontend files share one cache
- Stripe falls back to mock responses when `STRIPE_SECRET_KEY` is absent, so dev works without keys
- `generatedAlwaysAsIdentity()` columns (id) are auto-excluded from `createInsertSchema` — do NOT `.omit({ id: true })` for those tables
- OpenAPI query param `?destinationId=` used for reviews list (avoids TS2308 collision with path param variant)

## Product

- **Home**: Hero with glassmorphism search bar, featured destinations, category grid
- **Destinations**: Browse & filter by category, country, price, rating; sort by price/rating/popularity
- **Destination Detail**: Image gallery, highlights/inclusions tabs, reviews, booking widget
- **Bookings**: User booking history with status badges; booking detail with cancellation
- **Wishlist**: Saved destinations grid
- **Dashboard**: Personalized user overview with recent bookings and notifications
- **Auth**: Clerk sign-in/sign-up with Google + email, branded UI
- **Admin Panel**: Dashboard with Recharts analytics, destinations CRUD, user role management, booking status updates

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Always run `pnpm run typecheck:libs` before `pnpm --filter @workspace/api-server run typecheck` — the api-server depends on compiled lib declarations
- `req.params` values are typed `string | string[]` in Express 5 — always cast with `String(req.params["x"])` before passing to `parseInt`
- Stripe API version must match the installed package's expected version (currently `"2026-05-27.dahlia"`)

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
