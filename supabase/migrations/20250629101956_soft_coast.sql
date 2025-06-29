/*
  # Create admin actions log table

  1. New Tables
    - `admin_actions`
      - `id` (uuid, primary key)
      - `action_type` (text) - Type of action performed
      - `review_id` (uuid, nullable) - Reference to review if action is review-related
      - `contact_id` (uuid, nullable) - Reference to contact if action is contact-related
      - `admin_email` (text) - Email of admin who performed action
      - `timestamp` (timestamptz) - When action was performed
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `admin_actions` table
    - Add policy for authenticated users to insert and view admin actions
*/

CREATE TABLE IF NOT EXISTS admin_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type text NOT NULL CHECK (action_type IN ('verify_review', 'unverify_review', 'delete_review', 'mark_read', 'mark_unread', 'delete_message')),
  review_id uuid REFERENCES reviews(id) ON DELETE CASCADE,
  contact_id uuid REFERENCES contacts(id) ON DELETE CASCADE,
  admin_email text NOT NULL,
  timestamp timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage admin actions"
  ON admin_actions
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Add read_at column to contacts table to track when messages were read
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'read_at'
  ) THEN
    ALTER TABLE contacts ADD COLUMN read_at timestamptz;
  END IF;
END $$;