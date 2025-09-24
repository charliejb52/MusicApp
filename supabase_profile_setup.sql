-- Add profile picture and media columns to user_profiles
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}';

-- Create media table for user posts/media
CREATE TABLE IF NOT EXISTS user_media (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video', 'audio')),
  media_url TEXT NOT NULL,
  caption TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on user_id for efficient queries
CREATE INDEX IF NOT EXISTS idx_user_media_user_id ON user_media(user_id);
CREATE INDEX IF NOT EXISTS idx_user_media_created_at ON user_media(created_at DESC);

-- Enable Row Level Security
ALTER TABLE user_media ENABLE ROW LEVEL SECURITY;

-- Users can read all media
CREATE POLICY "Allow public read access to user media" ON user_media
  FOR SELECT USING (true);

-- Users can only insert their own media
CREATE POLICY "Users can insert their own media" ON user_media
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only update their own media
CREATE POLICY "Users can update their own media" ON user_media
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can only delete their own media
CREATE POLICY "Users can delete their own media" ON user_media
  FOR DELETE USING (auth.uid() = user_id);

-- Update user_profiles policies to allow profile picture updates
CREATE POLICY "Users can update their own profile picture" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);
