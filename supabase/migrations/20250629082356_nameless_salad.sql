/*
  # Create admin user for authentication

  1. New User Creation
    - Creates admin user in auth.users table
    - Sets up proper authentication credentials
    - Configures email confirmation and metadata
  
  2. Identity Setup
    - Creates corresponding identity record
    - Links user to email provider
    - Ensures proper authentication flow
  
  3. Safety
    - Uses conditional logic to avoid duplicates
    - Handles existing users gracefully
*/

DO $$
DECLARE
    admin_user_id uuid;
    existing_user_count integer;
    existing_identity_count integer;
BEGIN
    -- Check if admin user already exists
    SELECT COUNT(*) INTO existing_user_count 
    FROM auth.users 
    WHERE email = 'admin@luxeshowcase.com';
    
    -- Only create user if it doesn't exist
    IF existing_user_count = 0 THEN
        -- Generate UUID for the admin user
        admin_user_id := gen_random_uuid();
        
        -- Insert admin user
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
            admin_user_id,
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
        );
        
        -- Check if identity already exists for this user
        SELECT COUNT(*) INTO existing_identity_count
        FROM auth.identities
        WHERE user_id = admin_user_id AND provider = 'email';
        
        -- Create identity record if it doesn't exist
        IF existing_identity_count = 0 THEN
            INSERT INTO auth.identities (
                id,
                user_id,
                identity_data,
                provider,
                provider_id,
                last_sign_in_at,
                created_at,
                updated_at
            ) VALUES (
                gen_random_uuid(),
                admin_user_id,
                format('{"sub": "%s", "email": "%s"}', admin_user_id::text, 'admin@luxeshowcase.com')::jsonb,
                'email',
                'admin@luxeshowcase.com',
                NOW(),
                NOW(),
                NOW()
            );
        END IF;
        
    ELSE
        -- User already exists, get the existing user ID
        SELECT id INTO admin_user_id 
        FROM auth.users 
        WHERE email = 'admin@luxeshowcase.com';
        
        -- Check if identity exists for existing user
        SELECT COUNT(*) INTO existing_identity_count
        FROM auth.identities
        WHERE user_id = admin_user_id AND provider = 'email';
        
        -- Create identity if missing
        IF existing_identity_count = 0 THEN
            INSERT INTO auth.identities (
                id,
                user_id,
                identity_data,
                provider,
                provider_id,
                last_sign_in_at,
                created_at,
                updated_at
            ) VALUES (
                gen_random_uuid(),
                admin_user_id,
                format('{"sub": "%s", "email": "%s"}', admin_user_id::text, 'admin@luxeshowcase.com')::jsonb,
                'email',
                'admin@luxeshowcase.com',
                NOW(),
                NOW(),
                NOW()
            );
        END IF;
    END IF;
END $$;