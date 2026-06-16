---
name: Admin premium requests cloud storage
description: How premium payment requests are stored and fetched in the admin panel
---

## The Problem (before fix)

`submitPremiumPayment` called `saveRequest()` which writes to the admin device's `localStorage` under `vaultify-payment-requests`. The admin panel called `getAllRequests()` which reads the same localStorage. Result: admin sees ZERO requests unless they happen to be on the same device as the user who submitted.

## The Fix

Three new functions added to `src/lib/premiumRequests.ts`:
- `savePremiumRequestToCloud(req)` — upserts to `premium_requests` Supabase table
- `fetchPremiumRequestsFromCloud()` — fetches all requests from cloud
- `updateCloudRequestStatus(id, status)` — updates status in cloud

`premium_requests` table added to `supabase-schema.sql` with:
- Public SELECT (anon) so admin panel can read without Supabase auth
- Authenticated INSERT restricted to own row (auth.uid() = user_id)
- Public UPDATE (anon) so admin can approve/reject without Supabase auth

## How it works now

1. User submits payment → `saveRequest()` (localStorage) + `savePremiumRequestToCloud()` (Supabase) called together
2. Admin opens admin panel → `loadData()` fetches local AND cloud requests
3. `allRequests` memo merges both (cloud takes priority by id), sorted by submitted_at
4. Admin approve/reject → updates localStorage + Supabase cloud row simultaneously

**Why:** localStorage is device-local — admin on a different device from the user will see nothing without cloud storage.
