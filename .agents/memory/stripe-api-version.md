---
name: Stripe API version
description: The installed Stripe SDK version expects a specific apiVersion string
---

The Stripe Node SDK requires the `apiVersion` string to exactly match what the installed package version supports.

**Rule:** Use `"2026-05-27.dahlia"` as the apiVersion when constructing a Stripe client (as of the currently installed stripe version in this project).

**Why:** Passing an older version string (e.g. `"2025-05-28.basil"`) causes TS2322 type errors since the type is a string literal union.

**How to apply:** Check the stripe package's type definitions for `ApiVersion` if you bump the stripe dependency — the correct string will be listed there.
