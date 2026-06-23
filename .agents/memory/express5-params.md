---
name: Express 5 params typing
description: req.params values are string | string[] in Express 5 — must cast before parseInt
---

In Express 5, `req.params` values are typed `string | string[]`, not just `string`.

**Rule:** Always cast with `String(req.params["x"])` before passing to `parseInt` or any function expecting `string`.

**Why:** Express 5 changed the params type signature. TypeScript will error with TS2345 if you use the raw value or the `!` non-null assertion with `parseInt`.

**How to apply:** Replace `parseInt(req.params["id"]!, 10)` with `parseInt(String(req.params["id"]), 10)` in every route handler.
