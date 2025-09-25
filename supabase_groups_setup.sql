-- Groups feature setup for music collaboration
-- This script creates tables for artists to form groups and apply for gigs together

-- Add role field to user_profiles for artists
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS role VARCHAR(50);

-- Create groups table
CREATE TABLE IF NOT EXISTS groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  genre VARCHAR(50),
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create group_members table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS group_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL, -- e.g., 'guitarist', 'singer', 'drummer', 'bassist', 'keyboardist'
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(group_id, user_id) -- Prevent duplicate memberships
);

-- Create group_job_applications table
CREATE TABLE IF NOT EXISTS group_job_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  message TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(job_id, group_id) -- Prevent duplicate group applications
);

-- Enable RLS
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_job_applications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for groups table
DROP POLICY IF EXISTS "Users can view all groups" ON groups;
CREATE POLICY "Users can view all groups" ON groups
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create groups" ON groups;
CREATE POLICY "Users can create groups" ON groups
  FOR INSERT WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Group creators can update their groups" ON groups;
CREATE POLICY "Group creators can update their groups" ON groups
  FOR UPDATE USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "Group creators can delete their groups" ON groups;
CREATE POLICY "Group creators can delete their groups" ON groups
  FOR DELETE USING (auth.uid() = created_by);

-- RLS Policies for group_members table
DROP POLICY IF EXISTS "Users can view group members" ON group_members;
CREATE POLICY "Users can view group members" ON group_members
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Group creators can add members" ON group_members;
CREATE POLICY "Group creators can add members" ON group_members
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM groups 
      WHERE id = group_id AND created_by = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Group creators can remove members" ON group_members;
CREATE POLICY "Group creators can remove members" ON group_members
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM groups 
      WHERE id = group_id AND created_by = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can leave groups" ON group_members;
CREATE POLICY "Users can leave groups" ON group_members
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for group_job_applications table
DROP POLICY IF EXISTS "Users can view group job applications" ON group_job_applications;
CREATE POLICY "Users can view group job applications" ON group_job_applications
  FOR SELECT USING (
    -- Group members can view their group's applications
    EXISTS (
      SELECT 1 FROM group_members 
      WHERE group_id = group_job_applications.group_id AND user_id = auth.uid()
    )
    OR
    -- Venue owners can view applications for their jobs
    EXISTS (
      SELECT 1 FROM jobs 
      WHERE id = group_job_applications.job_id AND venue_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Group members can create applications" ON group_job_applications;
CREATE POLICY "Group members can create applications" ON group_job_applications
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_members 
      WHERE group_id = group_job_applications.group_id AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Venue owners can update application status" ON group_job_applications;
CREATE POLICY "Venue owners can update application status" ON group_job_applications
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM jobs 
      WHERE id = group_job_applications.job_id AND venue_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_job_applications_job_id ON group_job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_group_job_applications_group_id ON group_job_applications(group_id);

-- Insert some sample roles for artists
-- This is just for reference - actual roles will be stored in user_profiles.role
-- Common roles: guitarist, singer, drummer, bassist, keyboardist, saxophonist, violinist, etc.
