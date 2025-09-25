-- Fix foreign key relationships for groups feature
-- Run this in your Supabase SQL Editor

-- First, let's check if the foreign key exists
-- If it doesn't exist, we need to add it

-- Add foreign key constraint from group_members to user_profiles
-- This creates the relationship that Supabase needs for the query
ALTER TABLE group_members 
ADD CONSTRAINT group_members_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Also ensure the relationship to groups table exists
ALTER TABLE group_members 
ADD CONSTRAINT group_members_group_id_fkey 
FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE;

-- Update the RLS policies to work with the correct foreign key
DROP POLICY IF EXISTS "Users can view group members" ON group_members;
CREATE POLICY "Users can view group members" ON group_members
  FOR SELECT USING (true);

-- Make sure the user_profiles table has the role column
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS role VARCHAR(50);
