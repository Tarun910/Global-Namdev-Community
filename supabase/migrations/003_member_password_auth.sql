-- Member password auth (hybrid with MSG91 OTP in the SPA)

ALTER TABLE members
  ADD COLUMN IF NOT EXISTS password_hash TEXT,
  ADD COLUMN IF NOT EXISTS mobile_verified BOOLEAN NOT NULL DEFAULT false;

-- Backfill: existing verified members keep is_verified; treat as mobile verified when set
UPDATE members
SET mobile_verified = is_verified
WHERE mobile_verified IS DISTINCT FROM is_verified;

CREATE OR REPLACE FUNCTION verify_member_login(
  p_identifier TEXT,
  p_password TEXT,
  p_dial_code TEXT DEFAULT '+91'
)
RETURNS TABLE (
  member_id TEXT,
  community_id TEXT,
  full_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_member members%ROWTYPE;
  v_id TEXT := trim(p_identifier);
  v_dial TEXT := COALESCE(NULLIF(trim(p_dial_code), ''), '+91');
BEGIN
  IF length(trim(p_password)) < 6 THEN
    RETURN;
  END IF;

  IF upper(v_id) ~ '^GNC-' THEN
    SELECT * INTO v_member
    FROM members
    WHERE upper(community_id) = upper(v_id)
    LIMIT 1;
  ELSE
    SELECT * INTO v_member
    FROM members
    WHERE COALESCE(mobile_country_code, '+91') = v_dial
      AND regexp_replace(mobile_number, '\D', '', 'g') = regexp_replace(v_id, '\D', '', 'g')
    LIMIT 1;
  END IF;

  IF v_member.id IS NULL OR v_member.password_hash IS NULL THEN
    RETURN;
  END IF;

  IF v_member.password_hash = crypt(trim(p_password), v_member.password_hash) THEN
    member_id := v_member.id;
    community_id := v_member.community_id;
    full_name := v_member.full_name;
    RETURN NEXT;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION set_member_password_on_register(
  p_member_id TEXT,
  p_dial_code TEXT,
  p_mobile TEXT,
  p_password TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_member members%ROWTYPE;
  v_dial TEXT := COALESCE(NULLIF(trim(p_dial_code), ''), '+91');
  v_mobile TEXT := regexp_replace(trim(p_mobile), '\D', '', 'g');
BEGIN
  IF length(trim(p_password)) < 6 OR length(v_mobile) < 6 THEN
    RETURN FALSE;
  END IF;

  SELECT * INTO v_member
  FROM members
  WHERE id = trim(p_member_id)
    AND COALESCE(mobile_country_code, '+91') = v_dial
    AND regexp_replace(mobile_number, '\D', '', 'g') = v_mobile
  LIMIT 1;

  IF v_member.id IS NULL THEN
    RETURN FALSE;
  END IF;

  UPDATE members
  SET
    password_hash = crypt(trim(p_password), gen_salt('bf')),
    updated_at = now()
  WHERE id = v_member.id;

  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION reset_member_password(
  p_dial_code TEXT,
  p_mobile TEXT,
  p_dob_or_age TEXT,
  p_fathers_name TEXT,
  p_community_id TEXT,
  p_new_password TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_member members%ROWTYPE;
  v_dial TEXT := COALESCE(NULLIF(trim(p_dial_code), ''), '+91');
  v_mobile TEXT := regexp_replace(trim(p_mobile), '\D', '', 'g');
BEGIN
  IF length(trim(p_new_password)) < 6 OR length(v_mobile) < 6 THEN
    RETURN FALSE;
  END IF;

  SELECT * INTO v_member
  FROM members
  WHERE COALESCE(mobile_country_code, '+91') = v_dial
    AND regexp_replace(mobile_number, '\D', '', 'g') = v_mobile
    AND lower(trim(dob_or_age)) = lower(trim(p_dob_or_age))
    AND lower(trim(fathers_name)) = lower(trim(p_fathers_name))
    AND (
      trim(COALESCE(p_community_id, '')) = ''
      OR upper(community_id) = upper(trim(p_community_id))
    )
  LIMIT 1;

  IF v_member.id IS NULL THEN
    RETURN FALSE;
  END IF;

  UPDATE members
  SET
    password_hash = crypt(trim(p_new_password), gen_salt('bf')),
    updated_at = now()
  WHERE id = v_member.id;

  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION verify_member_login(TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION set_member_password_on_register(TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION reset_member_password(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;
