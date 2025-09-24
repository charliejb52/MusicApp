-- Create jobs/gigs table
CREATE TABLE IF NOT EXISTS jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  venue_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  genre TEXT NOT NULL,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  pay_range TEXT,
  requirements TEXT,
  contact_info TEXT,
  location TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'filled', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create applications table
CREATE TABLE IF NOT EXISTS job_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE NOT NULL,
  artist_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(job_id, artist_id) -- Prevent duplicate applications
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_jobs_venue_id ON jobs(venue_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_event_date ON jobs(event_date);
CREATE INDEX IF NOT EXISTS idx_jobs_genre ON jobs(genre);
CREATE INDEX IF NOT EXISTS idx_job_applications_job_id ON job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_artist_id ON job_applications(artist_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON job_applications(status);

-- Enable Row Level Security
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;

-- Jobs policies
CREATE POLICY "Allow public read access to jobs" ON jobs
  FOR SELECT USING (true);

CREATE POLICY "Venues can insert their own jobs" ON jobs
  FOR INSERT WITH CHECK (auth.uid() = venue_id);

CREATE POLICY "Venues can update their own jobs" ON jobs
  FOR UPDATE USING (auth.uid() = venue_id);

CREATE POLICY "Venues can delete their own jobs" ON jobs
  FOR DELETE USING (auth.uid() = venue_id);

-- Job applications policies
CREATE POLICY "Artists can view their own applications" ON job_applications
  FOR SELECT USING (auth.uid() = artist_id);

CREATE POLICY "Venues can view applications for their jobs" ON job_applications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM jobs 
      WHERE jobs.id = job_applications.job_id 
      AND jobs.venue_id = auth.uid()
    )
  );

CREATE POLICY "Artists can apply to jobs" ON job_applications
  FOR INSERT WITH CHECK (auth.uid() = artist_id);

CREATE POLICY "Venues can update application status for their jobs" ON job_applications
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM jobs 
      WHERE jobs.id = job_applications.job_id 
      AND jobs.venue_id = auth.uid()
    )
  );

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_jobs_updated_at
  BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_applications_updated_at
  BEFORE UPDATE ON job_applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
