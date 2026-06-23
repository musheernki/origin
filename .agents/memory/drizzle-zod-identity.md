---
name: drizzle-zod v4 identity columns
description: generatedAlwaysAsIdentity columns are auto-excluded from insert schemas — do not omit id
---

In `drizzle-zod` (v0.8+) with `zod/v4`, calling `createInsertSchema(table)` on a table with a `generatedAlwaysAsIdentity()` primary key column will automatically exclude that column from the schema.

**Rule:** Do NOT call `.omit({ id: true })` for tables with `generatedAlwaysAsIdentity()` — doing so throws `Error: Unrecognized key: "id"` at import time (before the app starts).

**Why:** drizzle-zod v4 detects generated columns and excludes them before the schema is constructed, so attempting to omit a non-existent key is an error.

**How to apply:** Only omit timestamp columns: `.omit({ createdAt: true, updatedAt: true })`.
