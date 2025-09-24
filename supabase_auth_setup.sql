-- Create user profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  user_type TEXT NOT NULL CHECK (user_type IN ('artist', 'venue')),
  display_name TEXT NOT NULL,
  bio TEXT,
  website TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on user_type for efficient queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_type ON user_profiles(user_type);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read access to user profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can delete their own profile" ON user_profiles;

-- Users can read all profiles
CREATE POLICY "Allow public read access to user profiles" ON user_profiles
  FOR SELECT USING (true);

-- Users can only insert their own profile
CREATE POLICY "Users can insert their own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Users can only update their own profile
CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Users can only delete their own profile
CREATE POLICY "Users can delete their own profile" ON user_profiles
  FOR DELETE USING (auth.uid() = id);

-- Update venues table to link to user profiles
ALTER TABLE venues ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL;

-- Create index on owner_id
CREATE INDEX IF NOT EXISTS idx_venues_owner ON venues(owner_id);

-- Update venue policies to allow owners to manage their venues
DROP POLICY IF EXISTS "Allow public read access to venues" ON venues;
DROP POLICY IF EXISTS "Allow authenticated users to insert venues" ON venues;
DROP POLICY IF EXISTS "Allow authenticated users to update venues" ON venues;
DROP POLICY IF EXISTS "Allow venue owners to update their venues" ON venues;
DROP POLICY IF EXISTS "Allow venue owners to delete their venues" ON venues;

-- Allow public read access to venues
CREATE POLICY "Allow public read access to venues" ON venues
  FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to insert venues" ON venues
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow venue owners to update their venues" ON venues
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Allow venue owners to delete their venues" ON venues
  FOR DELETE USING (auth.uid() = owner_id);

-- Function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, user_type, display_name)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'artist'),
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
