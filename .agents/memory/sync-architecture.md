---
name: Sync architecture and silent failure handling
description: How sync works, what was broken, and how errors are now surfaced
---

## Core sync flow

1. On login (200ms delay): `syncFromSupabase()` fetches all tables, merges with local state
2. On visibility change (returning to tab): auto-sync
3. Every 30 seconds: periodic background sync

## What was broken (before fix)

Every write failure in `addPassword`, `addFile`, `addNote` was silently swallowed with `catch { /* keep local */ }`. If Supabase tables don't exist, all writes fail silently. Device A sees data (local IDB only), Device B syncs and finds nothing in Supabase.

## Fix: error logging

All write failures now `console.error('[Vaultify] ...')` with the Supabase error message and code. Per-table sync errors also logged.

## Fix: sync states

Three new states added to VaultStore interface:
- `syncLoading: boolean` — true while syncFromSupabase is running
- `syncError: string | null` — error from last sync (null = success)
- `syncStats: { passwords, files, notes, folders, reminders, syncedAt } | null`

Dashboard shows a loading spinner while syncLoading is true, and a "synced" badge when done.
SyncStatusNotifier in App.tsx shows a toast on first sync after login with item counts.

## Fix: uploadLocalDataToCloud

New function `uploadLocalDataToCloud()` upserts ALL local data (passwords, notes, files, folders) to Supabase using `upsert({ onConflict: 'id' })`.
- Handles both "never saved" items and "already saved" items
- Returns `{ uploaded, errors }`
- Exposed as "Push All Data to Cloud" button in Settings > Backup section

**When to use**: if Device A has data locally but it never reached Supabase (e.g., tables didn't exist when data was saved), the user taps this button on Device A → data goes to Supabase → Device B can now sync it.

## Why sync fails when tables don't exist

If user never ran supabase-schema.sql, ALL table queries fail. The `syncFromSupabase` abort condition was `foldersRes.error && pwdRes.error` (just 2 tables). Fixed to abort when ALL four core tables fail simultaneously, with a specific console.error pointing to the schema setup requirement.
