/*
# Traffic Violation Reporting System — Schema & Security

## Overview
Creates the complete database schema for a Traffic Violation Reporting System with
three user roles (admin, officer, citizen), violation reports with image uploads,
and row-level security policies.

## New Tables
1. `profiles` — extends Supabase auth.users with role, full_name, phone
   - id (uuid, PK, references auth.users)
   - full_name (text)
   - phone (text, nullable)
   - role (text: 'admin' | 'officer' | 'citizen', default 'citizen')
   - created_at (timestamptz)

2. `violations` — traffic violation reports
   - id (uuid, PK)
   - reporter_id (uuid, FK -> profiles.id, defaults to auth.uid())
   - vehicle_number (text)
   - vehicle_type (text)
   - violation_type (text)
   - description (text)
   - violation_date (date)
   - violation_time (text)
   - location (text)
   - latitude (numeric, nullable)
   - longitude (numeric, nullable)
   - image_url (text, nullable)
   - remarks (text, nullable)
   - status (text: 'pending' | 'approved' | 'rejected', default 'pending')
   - reviewed_by (uuid, FK -> profiles.id, nullable)
   - review_notes (text, nullable)
   - reviewed_at (timestamptz, nullable)
   - created_at (timestamptz)
   - updated_at (timestamptz)

## Security
- RLS enabled on both tables.
- profiles: users can read all profiles, update only their own.
- violations: citizens can CRUD their own reports; officers & admins can read all,
  update status (review). Admins can delete any report.
- Storage bucket `violation-images` with public read and authenticated upload policies.

## Triggers
- `handle_new_user` — auto-creates a profile row when a new auth user signs up,
  using metadata for full_name, phone, and role (defaulting to 'citizen').
- `update_updated_at` — auto-updates updated_at timestamp on violations update.
*/

-- ==================== PROFILES TABLE ====================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  phone text,
  role text NOT NULL DEFAULT 'citizen' CHECK (role IN ('admin', 'officer', 'citizen')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_all" ON profiles;
CREATE POLICY "profiles_select_all"
ON profiles FOR SELECT
TO authenticated USING (true);

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own"
ON profiles FOR UPDATE
TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own"
ON profiles FOR INSERT
TO authenticated WITH CHECK (auth.uid() = id);

-- ==================== VIOLATIONS TABLE ====================
CREATE TABLE IF NOT EXISTS violations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  vehicle_number text NOT NULL,
  vehicle_type text NOT NULL,
  violation_type text NOT NULL,
  description text NOT NULL,
  violation_date date NOT NULL,
  violation_time text NOT NULL,
  location text NOT NULL,
  latitude numeric(10,7),
  longitude numeric(10,7),
  image_url text,
  remarks text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  review_notes text,
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE violations ENABLE ROW LEVEL SECURITY;

-- Citizens: CRUD own reports
DROP POLICY IF EXISTS "violations_select" ON violations;
CREATE POLICY "violations_select"
ON violations FOR SELECT
TO authenticated USING (
  auth.uid() = reporter_id
  OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'officer'))
);

DROP POLICY IF EXISTS "violations_insert" ON violations;
CREATE POLICY "violations_insert"
ON violations FOR INSERT
TO authenticated WITH CHECK (
  auth.uid() = reporter_id
  OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'officer'))
);

DROP POLICY IF EXISTS "violations_update" ON violations;
CREATE POLICY "violations_update"
ON violations FOR UPDATE
TO authenticated USING (
  auth.uid() = reporter_id
  OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'officer'))
) WITH CHECK (
  auth.uid() = reporter_id
  OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'officer'))
);

DROP POLICY IF EXISTS "violations_delete" ON violations;
CREATE POLICY "violations_delete"
ON violations FOR DELETE
TO authenticated USING (
  auth.uid() = reporter_id
  OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

-- ==================== TRIGERS & FUNCTIONS ====================

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Unknown User'),
    NEW.raw_user_meta_data->>'phone',
    COALESCE(NEW.raw_user_meta_data->>'role', 'citizen')
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS violations_updated_at ON violations;
CREATE TRIGGER violations_updated_at
  BEFORE UPDATE ON violations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ==================== INDEXES ====================
CREATE INDEX IF NOT EXISTS idx_violations_reporter_id ON violations(reporter_id);
CREATE INDEX IF NOT EXISTS idx_violations_status ON violations(status);
CREATE INDEX IF NOT EXISTS idx_violations_created_at ON violations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_violations_vehicle_number ON violations(vehicle_number);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- ==================== STORAGE BUCKET ====================
INSERT INTO storage.buckets (id, name, public)
VALUES ('violation-images', 'violation-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: authenticated can upload, public can read
DROP POLICY IF EXISTS "violation_images_public_read" ON storage.objects;
CREATE POLICY "violation_images_public_read"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'violation-images');

DROP POLICY IF EXISTS "violation_images_auth_upload" ON storage.objects;
CREATE POLICY "violation_images_auth_upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'violation-images');

DROP POLICY IF EXISTS "violation_images_auth_update" ON storage.objects;
CREATE POLICY "violation_images_auth_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'violation-images') WITH CHECK (bucket_id = 'violation-images');

DROP POLICY IF EXISTS "violation_images_owner_delete" ON storage.objects;
CREATE POLICY "violation_images_owner_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'violation-images');