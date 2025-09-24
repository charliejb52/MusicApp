-- Create venues table
CREATE TABLE IF NOT EXISTS venues (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  genre TEXT NOT NULL,
  address TEXT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  description TEXT,
  website TEXT,
  phone TEXT,
  capacity INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index on coordinates for efficient location queries
CREATE INDEX IF NOT EXISTS idx_venues_coordinates ON venues(latitude, longitude);

-- Enable Row Level Security
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;

-- Allow public read access to venues
CREATE POLICY "Allow public read access to venues" ON venues
  FOR SELECT USING (true);

-- Allow authenticated users to insert venues
CREATE POLICY "Allow authenticated users to insert venues" ON venues
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update venues
CREATE POLICY "Allow authenticated users to update venues" ON venues
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Insert Durham, NC venues with detailed information
INSERT INTO venues (name, genre, address, latitude, longitude, description, website, phone, capacity) VALUES
(
  'Cat''s Cradle',
  'Indie / Rock',
  '300 E Main St, Carrboro, NC',
  35.9103,
  -79.0473,
  'Legendary indie music venue that has hosted countless iconic bands since 1969. Known for its intimate atmosphere and excellent sound.',
  'https://catscradle.com',
  '(919) 967-9053',
  750
),
(
  'Motorco Music Hall',
  'Rock / Alt',
  '723 Rigsbee Ave, Durham, NC',
  35.9992,
  -78.9083,
  'Modern music venue and bar featuring local and touring acts. Great sound system and intimate setting.',
  'https://motorcomusic.com',
  '(919) 901-0875',
  400
),
(
  'DPAC',
  'Broadway / Pop',
  '123 Vivian St, Durham, NC',
  35.9961,
  -78.9019,
  'Durham Performing Arts Center - premier venue for Broadway shows, concerts, and cultural events.',
  'https://www.dpacnc.com',
  '(919) 680-2787',
  2700
),
(
  'The Pinhook',
  'Indie / Electronic',
  '117 W Main St, Durham, NC',
  35.9997,
  -78.9087,
  'Eclectic venue featuring indie rock, electronic, and experimental music. Known for its diverse lineup and vibrant atmosphere.',
  'https://www.thepinhook.com',
  '(919) 667-1100',
  150
),
(
  'Casbah',
  'Rock / Metal',
  '1007 W Main St, Durham, NC',
  35.9991,
  -78.9089,
  'Intimate venue specializing in rock, metal, and punk shows. Raw, energetic atmosphere perfect for loud music.',
  'https://www.casbahdurham.com',
  '(919) 667-3277',
  200
);
