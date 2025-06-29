/*
  # Create Admin User

  1. Security
    - Creates an admin user with email 'admin@luxeshowcase.com'
    - Sets up the user in Supabase auth system
    - Password will be 'admin123' as shown in the demo credentials

  Note: This migration creates the admin user directly in the auth.users table
  which is the standard way to seed admin users in Supabase.
*/

-- Insert admin user into auth.users table
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@luxeshowcase.com',
  crypt('admin123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"role": "admin"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
) ON CONFLICT (email) DO NOTHING;

-- Insert corresponding identity record
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
) SELECT 
  gen_random_uuid(),
  id,
  format('{"sub": "%s", "email": "%s"}', id::text, email)::jsonb,
  'email',
  NOW(),
  NOW(),
  NOW()
FROM auth.users 
WHERE email = 'admin@luxeshowcase.com'
ON CONFLICT (provider, id) DO NOTHING;