---
name: File cross-device sync
description: How file content is stored and synced across devices
---

Files use a tiered storage strategy for cross-device access.

**Tier 1 — Supabase Storage (public URL)**: Attempted on every upload via `vault-files` bucket. Bucket can only be created via service_role / dashboard (see `supabase-bucket-rls.md`). If upload succeeds, `file.url` = public HTTPS URL — accessible on any device directly.

**Tier 2 — DB content column (base64)**: For files ≤ 20MB when no public URL. The `files.content TEXT` column holds the full base64 data URL. This is the primary cross-device path when the storage bucket doesn't exist.

**Tier 3 — Local IDB only**: Files > 20MB with no storage bucket. These are device-local and not cross-device accessible.

**syncFromSupabase fix (critical)**: The old `select('*')` on files fetched the entire content column on every sync — for users with many files this caused query timeouts/failures, making ALL files disappear on new devices. Fixed to:
1. `select('id,name,size,type,url,folder_id,category,tags,is_starred,is_archived,created_at,updated_at,expiry_date')` — metadata only
2. Check IDB for each file to find which ones are missing content
3. Single batch query `select('id,content').in('id', needsContentIds)` for missing files only
4. Store fetched content in IDB under canonical Supabase UUID

After first successful sync, all content is in IDB. Subsequent 30-second syncs only fetch metadata (fast).

**Size limit note**: The `addFile` 20MB base64 threshold is correct — files above this threshold won't sync cross-device without the storage bucket.
