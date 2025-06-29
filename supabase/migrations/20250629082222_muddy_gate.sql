/*
  # Admin User Setup Instructions

  This migration provides instructions for creating an admin user.
  
  Since directly manipulating Supabase's auth tables can cause constraint violations
  and is not recommended, the admin user should be created through the Supabase Dashboard
  or using the Supabase CLI/API.

  ## To create the admin user:

  1. Go to your Supabase Dashboard
  2. Navigate to Authentication > Users
  3. Click "Add user"
  4. Enter:
     - Email: admin@luxeshowcase.com
     - Password: admin123
     - Email Confirm: true
  5. After creation, you can add custom metadata if needed

  ## Alternative: Use Supabase API
  
  You can also create the user programmatically using the Supabase Admin API:
  
  ```javascript
  const { data, error } = await supabase.auth.admin.createUser({
    email: 'admin@luxeshowcase.com',
    password: 'admin123',
    email_confirm: true,
    user_metadata: {
      role: 'admin',
      name: 'Admin User'
    }
  })
  ```

  ## Security Note
  
  Remember to change the default password after first login in production!
*/

-- This migration intentionally contains no SQL operations
-- to avoid conflicts with Supabase's auth system
SELECT 1 as placeholder;