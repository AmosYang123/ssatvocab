-- ============================
-- SSAT Vocab Mastery - Supabase Schema
-- ============================
-- Run this in Supabase SQL Editor to set up all required tables
-- User profiles (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
-- User word progress/status
CREATE TABLE IF NOT EXISTS user_word_statuses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  word_name TEXT NOT NULL,
  status TEXT CHECK (status IN ('mastered', 'review')) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, word_name)
);
-- User marked (starred) words
CREATE TABLE IF NOT EXISTS user_marked_words (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  word_name TEXT NOT NULL,
  marked BOOLEAN DEFAULT true,
  UNIQUE(user_id, word_name)
);
-- User custom study sets
CREATE TABLE IF NOT EXISTS user_study_sets (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  word_names TEXT [] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
-- User preferences
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
  theme TEXT DEFAULT 'light' CHECK (
    theme IN (
      'light',
      'dark',
      'violet_bloom',
      'notebook',
      'catppuccin',
      'graphite',
      'high_contrast'
    )
  ),
  show_default_vocab BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- User custom vocabulary (AI-enhanced or manually added)
CREATE TABLE IF NOT EXISTS user_custom_vocab (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  word_name TEXT NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, word_name)
);
-- ============================
-- Row Level Security (RLS)
-- ============================
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_word_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_marked_words ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_study_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_custom_vocab ENABLE ROW LEVEL SECURITY;
-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles FOR
SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR
INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR
UPDATE USING (auth.uid() = id);
-- Word statuses policies
CREATE POLICY "Users can view own word statuses" ON user_word_statuses FOR
SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own word statuses" ON user_word_statuses FOR
INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own word statuses" ON user_word_statuses FOR
UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own word statuses" ON user_word_statuses FOR DELETE USING (auth.uid() = user_id);
-- Marked words policies
CREATE POLICY "Users can view own marked words" ON user_marked_words FOR
SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own marked words" ON user_marked_words FOR
INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own marked words" ON user_marked_words FOR
UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own marked words" ON user_marked_words FOR DELETE USING (auth.uid() = user_id);
-- Study sets policies
CREATE POLICY "Users can view own study sets" ON user_study_sets FOR
SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own study sets" ON user_study_sets FOR
INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own study sets" ON user_study_sets FOR
UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own study sets" ON user_study_sets FOR DELETE USING (auth.uid() = user_id);
-- Preferences policies
CREATE POLICY "Users can view own preferences" ON user_preferences FOR
SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own preferences" ON user_preferences FOR
INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own preferences" ON user_preferences FOR
UPDATE USING (auth.uid() = user_id);
-- Custom vocab policies
CREATE POLICY "Users can view own custom vocab" ON user_custom_vocab FOR
SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own custom vocab" ON user_custom_vocab FOR
INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own custom vocab" ON user_custom_vocab FOR
UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own custom vocab" ON user_custom_vocab FOR DELETE USING (auth.uid() = user_id);
-- ============================
-- Indexes for performance
-- ============================
CREATE INDEX IF NOT EXISTS idx_word_statuses_user_id ON user_word_statuses(user_id);
CREATE INDEX IF NOT EXISTS idx_marked_words_user_id ON user_marked_words(user_id);
CREATE INDEX IF NOT EXISTS idx_study_sets_user_id ON user_study_sets(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_vocab_user_id ON user_custom_vocab(user_id);
-- ============================
-- Function to auto-create profile on signup
-- ============================
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER AS $$
DECLARE base_username TEXT;
final_username TEXT;
counter INTEGER := 0;
is_social BOOLEAN;
BEGIN -- 1. Check if it's a social login
is_social := COALESCE(NEW.raw_app_meta_data->>'provider', 'email') != 'email';
-- 2. Determine base username
base_username := COALESCE(
  NEW.raw_user_meta_data->>'username',
  SPLIT_PART(NEW.email, '@', 1),
  'user'
);
-- Clean username
base_username := LOWER(
  REGEXP_REPLACE(base_username, '[^a-zA-Z0-9._]', '', 'g')
);
IF base_username = '' THEN base_username := 'user';
END IF;
final_username := base_username;
-- 3. Collision Logic
IF is_social THEN -- For social login, auto-number if taken
WHILE EXISTS (
  SELECT 1
  FROM public.profiles
  WHERE username = final_username
) LOOP counter := counter + 1;
final_username := base_username || counter::TEXT;
END LOOP;
ELSE -- For manual signup, do NOT auto-number.
-- Let the insert fail if taken (frontend handles message).
final_username := base_username;
END IF;
-- 4. Create profile
INSERT INTO public.profiles (id, username)
VALUES (NEW.id, final_username);
-- 5. Initialize preferences
INSERT INTO public.user_preferences (user_id, theme, show_default_vocab)
VALUES (NEW.id, 'light', true);
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Trigger to call function on new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER
INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();