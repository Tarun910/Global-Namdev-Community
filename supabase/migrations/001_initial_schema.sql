-- Global Namdev Community — initial Supabase schema
-- Run in Supabase SQL Editor or via Supabase CLI: supabase db push

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ── Members ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS members (
  id TEXT PRIMARY KEY,
  community_id TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  fathers_name TEXT NOT NULL,
  mothers_name TEXT,
  gender TEXT NOT NULL CHECK (gender IN ('Male', 'Female', 'Other')),
  dob_or_age TEXT NOT NULL,
  mobile_number TEXT NOT NULL,
  mobile_country_code TEXT DEFAULT '+91',
  email TEXT,
  gotra TEXT,
  education TEXT NOT NULL,
  occupation TEXT NOT NULL,
  country TEXT NOT NULL,
  state TEXT NOT NULL,
  district TEXT NOT NULL,
  city TEXT NOT NULL,
  village TEXT,
  relationship TEXT NOT NULL,
  registration_date DATE NOT NULL,
  is_verified BOOLEAN NOT NULL DEFAULT true,
  photo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_members_mobile ON members (mobile_number);
CREATE INDEX IF NOT EXISTS idx_members_community_id ON members (community_id);

-- ── Community bulletins / updates ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS community_updates (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  time_label TEXT NOT NULL,
  is_important BOOLEAN NOT NULL DEFAULT false,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Forum ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS forum_discussions (
  id TEXT PRIMARY KEY,
  author TEXT NOT NULL,
  author_role TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  time_label TEXT NOT NULL,
  category TEXT NOT NULL,
  likes_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS forum_comments (
  id TEXT PRIMARY KEY,
  discussion_id TEXT NOT NULL REFERENCES forum_discussions (id) ON DELETE CASCADE,
  author TEXT NOT NULL,
  text TEXT NOT NULL,
  time_label TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_forum_comments_discussion ON forum_comments (discussion_id);

CREATE TABLE IF NOT EXISTS forum_likes (
  discussion_id TEXT NOT NULL REFERENCES forum_discussions (id) ON DELETE CASCADE,
  client_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (discussion_id, client_id)
);

-- ── Admin users ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  is_super_admin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by TEXT
);

-- Default super admin: superadmin / password123 (change after first login)
INSERT INTO admin_users (username, password_hash, is_super_admin, created_by)
VALUES (
  'superadmin',
  crypt('password123', gen_salt('bf')),
  true,
  'system'
)
ON CONFLICT (username) DO NOTHING;

-- ── Admin RPC functions ────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION verify_admin_login(p_username TEXT, p_password TEXT)
RETURNS TABLE (id UUID, username TEXT, is_super_admin BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT a.id, a.username, a.is_super_admin
  FROM admin_users a
  WHERE lower(a.username) = lower(trim(p_username))
    AND a.password_hash = crypt(trim(p_password), a.password_hash);
END;
$$;

CREATE OR REPLACE FUNCTION create_admin_account(
  p_requester_username TEXT,
  p_new_username TEXT,
  p_new_password TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_requester admin_users%ROWTYPE;
  v_new_username TEXT := trim(p_new_username);
  v_new_password TEXT := trim(p_new_password);
BEGIN
  SELECT * INTO v_requester
  FROM admin_users
  WHERE lower(username) = lower(trim(p_requester_username))
    AND is_super_admin = true;

  IF NOT FOUND THEN
    RETURN json_build_object('ok', false, 'error', 'Only the super admin can add other admins.');
  END IF;

  IF length(v_new_username) < 3 THEN
    RETURN json_build_object('ok', false, 'error', 'Username must be at least 3 characters.');
  END IF;

  IF length(v_new_password) < 6 THEN
    RETURN json_build_object('ok', false, 'error', 'Password must be at least 6 characters.');
  END IF;

  IF lower(v_new_username) IN ('superadmin', 'admin') THEN
    RETURN json_build_object('ok', false, 'error', 'That username is reserved for the super admin.');
  END IF;

  IF EXISTS (SELECT 1 FROM admin_users WHERE lower(username) = lower(v_new_username)) THEN
    RETURN json_build_object('ok', false, 'error', 'An admin with this username already exists.');
  END IF;

  INSERT INTO admin_users (username, password_hash, is_super_admin, created_by)
  VALUES (v_new_username, crypt(v_new_password, gen_salt('bf')), false, v_requester.username);

  RETURN json_build_object('ok', true);
END;
$$;

CREATE OR REPLACE FUNCTION remove_admin_account(
  p_requester_username TEXT,
  p_admin_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_requester admin_users%ROWTYPE;
  v_target admin_users%ROWTYPE;
BEGIN
  SELECT * INTO v_requester
  FROM admin_users
  WHERE lower(username) = lower(trim(p_requester_username))
    AND is_super_admin = true;

  IF NOT FOUND THEN
    RETURN json_build_object('ok', false, 'error', 'Only the super admin can remove other admins.');
  END IF;

  SELECT * INTO v_target FROM admin_users WHERE id = p_admin_id;

  IF NOT FOUND THEN
    RETURN json_build_object('ok', false, 'error', 'Admin account not found.');
  END IF;

  IF v_target.is_super_admin THEN
    RETURN json_build_object('ok', false, 'error', 'The super admin account cannot be removed.');
  END IF;

  DELETE FROM admin_users WHERE id = p_admin_id;

  RETURN json_build_object('ok', true);
END;
$$;

-- ── Row Level Security (MVP — tighten for production) ────────────────────────
-- Member auth uses MSG91 OTP in the SPA; admin auth uses RPC above.
-- These policies allow the anon key to read/write community data.
-- For production, move writes to Edge Functions or Supabase Auth.

ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members_select" ON members FOR SELECT USING (true);
CREATE POLICY "members_insert" ON members FOR INSERT WITH CHECK (true);
CREATE POLICY "members_update" ON members FOR UPDATE USING (true);
CREATE POLICY "members_delete" ON members FOR DELETE USING (true);

CREATE POLICY "updates_select" ON community_updates FOR SELECT USING (true);
CREATE POLICY "updates_insert" ON community_updates FOR INSERT WITH CHECK (true);
CREATE POLICY "updates_update" ON community_updates FOR UPDATE USING (true);
CREATE POLICY "updates_delete" ON community_updates FOR DELETE USING (true);

CREATE POLICY "forum_discussions_all" ON forum_discussions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "forum_comments_all" ON forum_comments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "forum_likes_all" ON forum_likes FOR ALL USING (true) WITH CHECK (true);

-- Admin directory is readable; writes go through SECURITY DEFINER RPCs
CREATE POLICY "admin_users_select" ON admin_users FOR SELECT USING (true);

GRANT EXECUTE ON FUNCTION verify_admin_login(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION create_admin_account(TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION remove_admin_account(TEXT, UUID) TO anon, authenticated;
