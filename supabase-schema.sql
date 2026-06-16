-- ====================================================================
-- VAULTIFY - COMPLETE SUPABASE SQL SCHEMA (v2)
-- ====================================================================
-- Paste this entire file into your Supabase SQL Editor and click "Run".
-- This creates all tables with proper Row Level Security (RLS) so each
-- user can only access their own data.

-- 1. Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Folders
CREATE TABLE IF NOT EXISTS public.folders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    parent_id UUID REFERENCES public.folders(id) ON DELETE CASCADE,
    color TEXT DEFAULT '#3b82f6',
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own folders" ON public.folders;
CREATE POLICY "Users manage own folders" ON public.folders
    USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 3. Files
CREATE TABLE IF NOT EXISTS public.files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    size BIGINT NOT NULL,
    type TEXT NOT NULL,
    url TEXT NOT NULL,
    content TEXT,
    folder_id UUID REFERENCES public.folders(id) ON DELETE SET NULL,
    category TEXT NOT NULL DEFAULT 'Personal IDs',
    tags TEXT[] DEFAULT '{}',
    is_starred BOOLEAN DEFAULT FALSE,
    is_archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    expiry_date TIMESTAMPTZ,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own files" ON public.files;
CREATE POLICY "Users manage own files" ON public.files
    USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 4. Passwords
CREATE TABLE IF NOT EXISTS public.passwords (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    username TEXT,
    password_encrypted TEXT NOT NULL,
    url TEXT,
    category TEXT DEFAULT 'Work',
    notes TEXT,
    strength TEXT DEFAULT 'Medium',
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    last_used TIMESTAMPTZ,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);
ALTER TABLE public.passwords ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own passwords" ON public.passwords;
CREATE POLICY "Users manage own passwords" ON public.passwords
    USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 5. Notes
CREATE TABLE IF NOT EXISTS public.notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    content TEXT NOT NULL DEFAULT '',
    category TEXT DEFAULT 'Personal',
    is_pinned BOOLEAN DEFAULT FALSE,
    is_locked BOOLEAN DEFAULT FALSE,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own notes" ON public.notes;
CREATE POLICY "Users manage own notes" ON public.notes
    USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 6. Reminders
CREATE TABLE IF NOT EXISTS public.reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    item_id TEXT NOT NULL,
    item_type TEXT NOT NULL,
    expiry_date TIMESTAMPTZ NOT NULL,
    notify_before_days INT DEFAULT 30,
    is_resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own reminders" ON public.reminders;
CREATE POLICY "Users manage own reminders" ON public.reminders
    USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 7. Activity Logs
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    action TEXT NOT NULL,
    details TEXT NOT NULL,
    ip_address TEXT,
    device TEXT,
    timestamp TIMESTAMPTZ DEFAULT now() NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own activity_logs" ON public.activity_logs;
CREATE POLICY "Users manage own activity_logs" ON public.activity_logs
    USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 8. Emergency Contacts
CREATE TABLE IF NOT EXISTS public.emergency_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    relationship TEXT DEFAULT 'Spouse',
    access_delay_hours INT DEFAULT 24,
    status TEXT DEFAULT 'Active',
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);
ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own emergency_contacts" ON public.emergency_contacts;
CREATE POLICY "Users manage own emergency_contacts" ON public.emergency_contacts
    USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 9. Shared Links
CREATE TABLE IF NOT EXISTS public.shared_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_id UUID REFERENCES public.files(id) ON DELETE CASCADE,
    url_token TEXT NOT NULL UNIQUE,
    is_password_protected BOOLEAN DEFAULT FALSE,
    password TEXT,
    expires_at TIMESTAMPTZ,
    is_one_time BOOLEAN DEFAULT TRUE,
    downloads_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);
ALTER TABLE public.shared_links ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own shared_links" ON public.shared_links;
CREATE POLICY "Users manage own shared_links" ON public.shared_links
    USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 10. Admin Config (global settings synced to every user device)
-- Readable and writable by any client (anon or authenticated) so that:
--   • every user always gets the latest price/storage/plan settings, and
--   • the admin (who does NOT sign into Supabase) can push updates without auth.
CREATE TABLE IF NOT EXISTS public.admin_config (
    id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    subscription_price INTEGER DEFAULT 300,
    free_storage_limit_gb INTEGER DEFAULT 5,
    plan_access JSONB DEFAULT '{}',
    approved_emails TEXT[] DEFAULT '{}',
    announcement TEXT DEFAULT '',
    updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.admin_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read admin config" ON public.admin_config;
DROP POLICY IF EXISTS "Public write admin config" ON public.admin_config;
CREATE POLICY "Public read admin config" ON public.admin_config
    FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public write admin config" ON public.admin_config
    FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
INSERT INTO public.admin_config (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- 11. User Profiles (auto-registered on every signup / signin from any device)
-- Readable by anon so admin panel (no Supabase auth) can see all users.
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT DEFAULT '',
    registered_at TIMESTAMPTZ DEFAULT now(),
    last_sign_in_at TIMESTAMPTZ DEFAULT now(),
    hidden_vault_pin TEXT DEFAULT ''
);
-- Add hidden_vault_pin to existing deployments (safe to run multiple times)
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS hidden_vault_pin TEXT DEFAULT '';
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read user profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Auth users manage own profile" ON public.user_profiles;
CREATE POLICY "Public read user profiles" ON public.user_profiles
    FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Auth users manage own profile" ON public.user_profiles
    FOR ALL TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- 12. Payment Screenshots (submitted by users, reviewed / deleted by admin)
-- base64 data URL stored in screenshot_data column.
-- Readable + deletable by anon so admin panel can fetch & remove without Supabase auth.
CREATE TABLE IF NOT EXISTS public.payment_screenshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    user_email TEXT NOT NULL,
    transaction_id TEXT DEFAULT '',
    screenshot_data TEXT NOT NULL,
    submitted_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.payment_screenshots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read payment screenshots" ON public.payment_screenshots;
DROP POLICY IF EXISTS "Auth users insert own screenshots" ON public.payment_screenshots;
DROP POLICY IF EXISTS "Public delete payment screenshots" ON public.payment_screenshots;
CREATE POLICY "Public read payment screenshots" ON public.payment_screenshots
    FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Auth users insert own screenshots" ON public.payment_screenshots
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Public delete payment screenshots" ON public.payment_screenshots
    FOR DELETE TO anon, authenticated USING (true);

-- 13. Premium Requests (submitted by users from any device, reviewed by admin)
-- Public SELECT so admin panel (no Supabase auth) can see all requests.
-- Authenticated INSERT restricted to own row.
-- Public UPDATE so admin (no Supabase auth) can approve/reject.
CREATE TABLE IF NOT EXISTS public.premium_requests (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    email TEXT NOT NULL,
    transaction_id TEXT DEFAULT '',
    screenshot_base64 TEXT,
    status TEXT DEFAULT 'pending',
    submitted_at TIMESTAMPTZ DEFAULT now(),
    reviewed_at TIMESTAMPTZ
);
ALTER TABLE public.premium_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read premium requests" ON public.premium_requests;
DROP POLICY IF EXISTS "Auth users insert own requests" ON public.premium_requests;
DROP POLICY IF EXISTS "Public update premium requests" ON public.premium_requests;
DROP POLICY IF EXISTS "Public delete premium requests" ON public.premium_requests;
CREATE POLICY "Public read premium requests" ON public.premium_requests
    FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Auth users insert own requests" ON public.premium_requests
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Public update premium requests" ON public.premium_requests
    FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public delete premium requests" ON public.premium_requests
    FOR DELETE TO anon, authenticated USING (true);

-- ── Supabase Storage: vault-files bucket ──────────────────────────────────────
-- Run this in the Supabase SQL Editor to create the storage bucket for files
-- larger than 20 MB. Without this bucket, files >20 MB are local-only.
--
-- NOTE: Storage buckets cannot be created via SQL. You must create the bucket
-- manually in the Supabase Dashboard:
--   Dashboard → Storage → New Bucket → Name: vault-files → Public: ON
--   → Additional Settings → Max file size: 5000 MB (or higher for large files)
--
-- After creating the bucket, add this RLS policy via Dashboard → Storage →
-- vault-files → Policies → New Policy → For full customization:
--   Policy name: "Auth users manage own files"
--   Allowed operations: SELECT, INSERT, UPDATE, DELETE
--   Target roles: authenticated
--   USING: (auth.uid()::text = (storage.foldername(name))[1])
--   WITH CHECK: (auth.uid()::text = (storage.foldername(name))[1])

DO $$ BEGIN RAISE NOTICE 'Vaultify schema (v3) created successfully with RLS enabled!'; END $$;
