-- Rotate super admin password (run in Supabase → SQL Editor)
-- Replace YOUR_NEW_STRONG_PASSWORD with a unique password and store it securely.

UPDATE admin_users
SET password_hash = crypt('YOUR_NEW_STRONG_PASSWORD', gen_salt('bf'))
WHERE username = 'superadmin';
