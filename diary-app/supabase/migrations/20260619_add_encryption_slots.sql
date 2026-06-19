-- Add encryption slot columns to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS my_public_slot TEXT,
  ADD COLUMN IF NOT EXISTS partner_slot TEXT,
  ADD COLUMN IF NOT EXISTS partner_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Auto-approve any still-pending users (group approval no longer used)
UPDATE profiles SET status = 'approved' WHERE status = 'pending';
