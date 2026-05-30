---
name: Admin config cross-device sync via Supabase user metadata
description: How admin settings (price, approved emails, plan access, free limit) are pushed to and fetched from Supabase without Storage buckets
---

## Rule
Admin settings are stored in the admin Supabase account's `user_metadata.admin_config` field (as a JSON string). Any device can fetch them by temporarily signing in as admin using a separate in-memory Supabase client.

**Why:** Supabase Storage bucket creation is blocked by RLS (see supabase-bucket-rls.md). The `user_metadata` field on the admin's auth account is writable by that user and readable via a fresh sign-in — no service role needed. Using `persistSession: false` and `autoRefreshToken: false` on the temp client ensures the main user's session is not disrupted.

**How to apply:**
- `pushAdminSettingsToCloud()` in `premiumRequests.ts`: creates temp client, signs in as admin, calls `updateUser({ data: { admin_config: JSON.stringify(settings) } })`, signs out.
- `fetchAdminSettingsFromCloud()` in `premiumRequests.ts`: creates temp client, signs in as admin, reads `user.user_metadata.admin_config`, signs out. Result is cached 5 minutes.
- Admin UUID: `6ee09053-2631-4108-9dbf-4e1681daa0c9`
- `syncFromSupabase()` in `useVaultStore.ts` calls `fetchAdminSettingsFromCloud()` and applies price, emails, planAccess, freeLimit, announcement to localStorage + Zustand state.
- `Admin.tsx` calls `pushAllToCloud()` after every setting change.
