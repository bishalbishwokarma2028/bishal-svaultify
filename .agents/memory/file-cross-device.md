---
name: File cross-device sync strategy
description: How files are stored and synced across devices given no Supabase Storage bucket
---

## Rule
Files are synced across devices via the Supabase `files` table `content` column (base64 data URL), not via Storage bucket URLs — because the `vault-files` bucket does not exist yet.

**Why:** Supabase Storage bucket creation requires service_role (blocked). The existing DB sync (`syncFromSupabase`) already pulls all rows including the `content` column, so base64-encoded files automatically propagate to any device that syncs.

**How to apply:**
- Files ≤ 5 MB: converted to base64 data URL via `FileReader.readAsDataURL`, stored in DB `content` column → fully cross-device.
- Files > 5 MB: stored in IndexedDB only (device-local). Show as "stored on this device" on other devices until `vault-files` bucket is created.
- `addFile` in `useVaultStore.ts` tries Storage upload first (fails silently), then falls back to base64.
- When the `vault-files` bucket is eventually created via Supabase dashboard, larger files will automatically start uploading to Storage and the public URL will sync cross-device.
