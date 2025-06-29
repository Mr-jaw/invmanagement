/*
  # Create Admin User

  1. New User
    - Creates admin user with email/password authentication
    - Uses Supabase's built-in auth functions for proper user creation
    - Sets up admin role in user metadata

  2. Security
    - User will be created with confirmed email status
    - Proper authentication flow through Supabase Auth
*/

-- Create admin user using Supabase's auth.users table directly
-- We need to use a different approach since ON CONFLICT might not work as expected

DO $$
DECLARE
    user_id uuid;
BEGIN
    -- Check if admin user already exists
    SELECT id INTO user_id FROM auth.users WHERE email = 'admin@luxeshowcase.com';
    
    -- If user doesn't exist, create it
    IF user_id IS NULL THEN
        -- Generate a new UUID for the user
        user_id := gen_random_uuid();
        
        -- Insert into auth.users
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
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
            user_id,
            'authenticated',
            'authenticated',
            'admin@luxeshowcase.com',
            crypt('admin123', gen_salt('bf')),
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
        );

        -- Insert into auth.identities
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
            user_id,
            format('{"sub": "%s", "email": "%s"}', user_id, 'admin@luxeshowcase.com')::jsonb,
            'email',
            NOW(),
            NOW(),
            NOW()
        );
    END IF;
END $$;