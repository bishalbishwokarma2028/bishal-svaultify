---
name: Supabase Storage bucket creation blocked by RLS
description: Why vault-files and vault-config buckets cannot be created via API and what to do instead
---

## Rule
Do NOT attempt to create Supabase Storage buckets via the REST API or Supabase JS client in application code — it always returns 403 "new row violates row-level security policy", even with an authenticated admin JWT.

**Why:** Supabase's default storage RLS restricts bucket creation to `service_role` only. The `anon` and normal authenticated user roles are excluded from `storage.buckets` INSERT.

**How to apply:** To create buckets, the project owner must either:
1. Use the Supabase dashboard → Storage → New bucket (manual one-time step)
2. Use a `service_role` key (not available in this project's environment secrets)

The code in `addFile` already gracefully handles missing buckets by falling back to base64 storage in the DB `content` column.
