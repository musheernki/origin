---
name: Composite lib build order
description: Must run typecheck:libs before leaf artifact typechecks; api-server depends on compiled db declarations
---

The `lib/db` package is a composite TypeScript library that emits `.d.ts` declarations to `lib/db/dist/`.

**Rule:** Always run `pnpm run typecheck:libs` (which runs `tsc --build`) before running `pnpm --filter @workspace/api-server run typecheck` or any other leaf artifact typecheck.

**Why:** Without compiled declarations, TypeScript resolves `@workspace/db` imports but cannot find the exported members, producing "Module has no exported member" errors even though the source exports are correct.

**How to apply:** In CI or manual checks: `pnpm run typecheck:libs && pnpm run typecheck`.
