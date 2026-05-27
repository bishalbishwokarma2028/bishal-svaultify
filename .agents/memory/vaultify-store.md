---
name: Vaultify store design
description: Data persistence, per-user isolation, and Supabase sync strategy for useVaultStore
---

## Per-User Data Isolation
- `dataOwnerId` is persisted in Zustand state (IndexedDB key `vaultify-store`)
- On `login()`: if `dataOwnerId !== user.id`, clear all vault data (files, passwords, notes, folders, reminders) and reset `dataOwnerId` to new user
- If same user logs back in, data is preserved untouched

**Why:** All users share one localStorage/IndexedDB key. Without this, different users see each other's data.

## File URL Storage in Supabase
- File content is stored in IndexedDB under `local://FILEID`
- The `url` field in the Supabase `files` table MUST store `local://FILEID` (not empty string)
- Without this, `syncFromSupabase` returns empty URL → file content unresolvable

**Why:** `addFile` previously stored `fileData.url || ''` in Supabase instead of the local reference.

## syncFromSupabase Strategy
- Called on every login (500ms delay for state to settle)
- Merges: takes all Supabase items + keeps local-only items not in Supabase (by ID)
- Does NOT replace/overwrite local data
- Invoked in `App.tsx` SIGNED_IN handler and getSession response

## Admin Panel
- Route: `/admin` (outside auth guard)
- Credentials hardcoded in Admin.tsx: ADMIN_EMAIL / ADMIN_PASSWORD
- `getApprovedEmails()` was missing from premiumRequests.ts — added it
- Admin announcement stored in `vaultify-admin-announcement` + `vaultify-admin-announcement-active` localStorage keys
- App reads these keys via `AdminBanner` component in App.tsx

## Document Scanner (MobileScanner)
- 8 filters: magic, original, color, grayscale, bw, warm, sepia, sharpen
- PDF export uses window.open with printable HTML page (no PDF library needed)
- Multi-page via `pages` state array, saved to vault individually
- Quality selector (high/medium/low) maps to JPEG quality values
