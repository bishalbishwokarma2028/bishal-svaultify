-- ====================================================================
-- VAULTIFY - COMPLETE SUPABASE SQL SCHEMA
-- ====================================================================
-- Copy and paste this entire file into your Supabase SQL Editor and click "Run".
-- This will create all the necessary tables for your secure digital vault!

-- 1. Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create Folders Table
CREATE TABLE IF NOT EXISTS public.folders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    parent_id UUID REFERENCES public.folders(id) ON DELETE CASCADE,
    color TEXT DEFAULT '#3b82f6',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id UUID -- Optional: references auth.users if you use native Supabase Auth policies
);

-- 3. Create Files Table
CREATE TABLE IF NOT EXISTS public.files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    size BIGINT NOT NULL,
    type TEXT NOT NULL,
    url TEXT NOT NULL,
    folder_id UUID REFERENCES public.folders(id) ON DELETE CASCADE,
    category TEXT NOT NULL DEFAULT 'Personal IDs',
    tags TEXT[] DEFAULT '{}',
    is_starred BOOLEAN DEFAULT FALSE,
    is_archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    expiry_date TIMESTAMP WITH TIME ZONE,
    user_id UUID
);

-- 4. Create Passwords Table
CREATE TABLE IF NOT EXISTS public.passwords (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    username TEXT,
    password_encrypted TEXT NOT NULL,
    url TEXT,
    category TEXT DEFAULT 'Work',
    notes TEXT,
    strength TEXT DEFAULT 'Medium',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    last_used TIMESTAMP WITH TIME ZONE,
    user_id UUID
);

-- 5. Create Notes Table
CREATE TABLE IF NOT EXISTS public.notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT DEFAULT 'Personal',
    is_pinned BOOLEAN DEFAULT FALSE,
    is_locked BOOLEAN DEFAULT FALSE,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id UUID
);

-- 6. Create Reminders Table
CREATE TABLE IF NOT EXISTS public.reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    item_id TEXT NOT NULL,
    item_type TEXT NOT NULL,
    expiry_date TIMESTAMP WITH TIME ZONE NOT NULL,
    notify_before_days INT DEFAULT 30,
    is_resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id UUID
);

-- 7. Create Activity Logs Table
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    action TEXT NOT NULL,
    details TEXT NOT NULL,
    ip_address TEXT,
    device TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id UUID
);

-- 8. Create Emergency Contacts Table
CREATE TABLE IF NOT EXISTS public.emergency_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    relationship TEXT DEFAULT 'Spouse',
    access_delay_hours INT DEFAULT 24,
    status TEXT DEFAULT 'Active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id UUID
);

-- 9. Create Shared Links Table
CREATE TABLE IF NOT EXISTS public.shared_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_id UUID REFERENCES public.files(id) ON DELETE CASCADE,
    url_token TEXT NOT NULL UNIQUE,
    is_password_protected BOOLEAN DEFAULT FALSE,
    password TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_one_time BOOLEAN DEFAULT TRUE,
    downloads_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id UUID
);

-- 10. Disable Row Level Security (RLS) initially for easy testing directly with your Anon Key
-- (You can enable these later in your Supabase dashboard if you want strict user-based access)
ALTER TABLE public.folders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.files DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.passwords DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_contacts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_links DISABLE ROW LEVEL SECURITY;

-- Output success message
DO $$ 
BEGIN 
    RAISE NOTICE 'Vaultify database tables created successfully!'; 
END $$;
