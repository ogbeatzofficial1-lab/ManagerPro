-- Supabase Schema for OG BEATZ
-- Copy and paste this into the Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tracks Table
CREATE TABLE IF NOT EXISTS tracks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  artist TEXT NOT NULL DEFAULT 'OGBeatz',
  duration INTEGER NOT NULL DEFAULT 0,
  bpm INTEGER NOT NULL DEFAULT 120,
  key_signature TEXT NOT NULL DEFAULT 'C Major',
  file_url TEXT,
  image_url TEXT,
  size BIGINT NOT NULL DEFAULT 0,
  type TEXT NOT NULL DEFAULT 'audio/mpeg',
  plays INTEGER NOT NULL DEFAULT 0,
  likes INTEGER NOT NULL DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  status TEXT NOT NULL CHECK (status IN ('ready', 'processing', 'error')) DEFAULT 'processing',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Playlists Table
CREATE TABLE IF NOT EXISTS playlists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  track_ids UUID[] DEFAULT '{}',
  start_color TEXT DEFAULT '#f97316',
  end_color TEXT DEFAULT '#ea580c',
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clients Table
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  company TEXT,
  status TEXT CHECK (status IN ('online', 'offline', 'away')) DEFAULT 'offline',
  last_active TIMESTAMPTZ DEFAULT NOW(),
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Share Links Table
CREATE TABLE IF NOT EXISTS share_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token TEXT UNIQUE NOT NULL,
  track_id UUID REFERENCES tracks(id) ON DELETE CASCADE,
  playlist_id UUID REFERENCES playlists(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  recipient_email TEXT,
  download_enabled BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  access_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activities Table
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL,
  track_id UUID REFERENCES tracks(id) ON DELETE SET NULL,
  playlist_id UUID REFERENCES playlists(id) ON DELETE SET NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  "user" UUID,
  action TEXT,
  target TEXT,
  details TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Messages Table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  recipient_id TEXT,
  content TEXT NOT NULL,
  image_url TEXT,
  direction TEXT CHECK (direction IN ('inbound', 'outbound')) NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  is_read BOOLEAN DEFAULT false
);

-- Promo Videos Table
CREATE TABLE IF NOT EXISTS promo_videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  track_id UUID REFERENCES tracks(id) ON DELETE CASCADE,
  playlist_id UUID REFERENCES playlists(id) ON DELETE CASCADE,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  style TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('processing', 'ready', 'error')) DEFAULT 'processing',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  video_data JSONB DEFAULT '{}'::jsonb,
  thumbnail_data JSONB DEFAULT '{}'::jsonb
);

-- Promo Packs Table
CREATE TABLE IF NOT EXISTS promo_packs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  track_id UUID REFERENCES tracks(id) ON DELETE CASCADE,
  youtube_copy TEXT,
  instagram_copy TEXT,
  generic_copy TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Profiles Table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT,
  artist_name TEXT,
  bio TEXT,
  email TEXT,
  avatar_url TEXT,
  social_links JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Todos Table
CREATE TABLE IF NOT EXISTS todos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE share_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

-- Public Policies (Using DO block to avoid 'already exists' errors)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Access' AND tablename = 'tracks') THEN
        CREATE POLICY "Public Access" ON tracks FOR ALL USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Access' AND tablename = 'playlists') THEN
        CREATE POLICY "Public Access" ON playlists FOR ALL USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Access' AND tablename = 'clients') THEN
        CREATE POLICY "Public Access" ON clients FOR ALL USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Access' AND tablename = 'share_links') THEN
        CREATE POLICY "Public Access" ON share_links FOR ALL USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Access' AND tablename = 'activities') THEN
        CREATE POLICY "Public Access" ON activities FOR ALL USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Access' AND tablename = 'messages') THEN
        CREATE POLICY "Public Access" ON messages FOR ALL USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Access' AND tablename = 'promo_videos') THEN
        CREATE POLICY "Public Access" ON promo_videos FOR ALL USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Access' AND tablename = 'promo_packs') THEN
        CREATE POLICY "Public Access" ON promo_packs FOR ALL USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Access' AND tablename = 'profiles') THEN
        CREATE POLICY "Public Access" ON profiles FOR ALL USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Access' AND tablename = 'todos') THEN
        CREATE POLICY "Public Access" ON todos FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;
