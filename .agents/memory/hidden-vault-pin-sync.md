---
name: Hidden Vault PIN cross-device sync
description: How the Hidden Vault PIN is persisted across devices via Supabase
---

The Hidden Vault PIN (`hiddenVaultPin`) is synced via the `user_profiles` table.

**Column**: `hidden_vault_pin TEXT DEFAULT ''` on `user_profiles`.

**Why**: Previously the PIN was only in localStorage and IndexedDB — both device-local. A new device login always produced an empty PIN, locking the user out of their Hidden Vault even though their files were there.

**How to apply**: The `supabase-schema.sql` includes `ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS hidden_vault_pin TEXT DEFAULT '';` — run the full schema SQL in the Supabase SQL Editor to add the column.

**Write path**: `setHiddenVaultPin(pin)` → async IIFE `await supabase.from('user_profiles').update({ hidden_vault_pin: pin }).eq('id', userId)`.

**Read path**: `syncFromSupabase()` includes `user_profiles.select('hidden_vault_pin')` in the parallel fetch; if `cloudPin` is set and local PIN is empty, it restores the PIN and writes it to localStorage.

**Graceful degradation**: If the column doesn't exist yet (schema not applied), the Supabase query returns an error object but doesn't throw — sync continues normally without the PIN restore.
