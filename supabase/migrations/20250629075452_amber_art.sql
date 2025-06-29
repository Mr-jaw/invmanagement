/*
  # Create Admin User

  1. New User Creation
    - Creates an admin user with email `admin@luxeshowcase.com`
    - Sets password to `admin123` for demo purposes
    - Assigns admin role and metadata

  2. Security
    - Uses Supabase's built-in authentication system
    - Creates user through auth.users table
    - Sets up proper user metadata for admin access

  Note: This creates a demo admin user for testing purposes.
  In production, you should create admin users through the Supabase dashboard
  or use proper user management flows.
*/

-- Create the admin user using Supabase's auth functions
-- This uses the auth.users table which is managed by Supabase
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
  '{"role": "admin", "name": "Admin User"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
) ON CONFLICT (email) DO NOTHING;

-- Create identity record for the user
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  (SELECT id FROM auth.users WHERE email = 'admin@luxeshowcase.com'),
  format('{"sub": "%s", "email": "%s"}', (SELECT id FROM auth.users WHERE email = 'admin@luxeshowcase.com'), 'admin@luxeshowcase.com')::jsonb,
  'email',
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (provider, id) DO NOTHING;