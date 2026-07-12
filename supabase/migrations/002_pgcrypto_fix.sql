-- Fix admin login: enable pgcrypto in extensions schema
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION verify_admin_login(p_username TEXT, p_password TEXT)
RETURNS TABLE (id UUID, username TEXT, is_super_admin BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
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
SET search_path = public, extensions
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
SET search_path = public, extensions
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

-- Re-hash super admin if pgcrypto was missing during initial insert.
-- Replace the placeholder below with your own strong password before running on production.
UPDATE admin_users
SET password_hash = crypt('change-me-on-first-deploy', gen_salt('bf'))
WHERE username = 'superadmin';

GRANT EXECUTE ON FUNCTION verify_admin_login(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION create_admin_account(TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION remove_admin_account(TEXT, UUID) TO anon, authenticated;
