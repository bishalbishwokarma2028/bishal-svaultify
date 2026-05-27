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

DO $$ BEGIN RAISE NOTICE 'Vaultify schema (v2) created successfully with RLS enabled!'; END $$;
