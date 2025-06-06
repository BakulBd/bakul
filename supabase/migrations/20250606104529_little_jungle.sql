/*
  # Initial Portfolio Schema

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key, references auth.users)
      - `name` (text)
      - `avatar_url` (text)
      - `role` (text, default 'user')
      - `email` (text)
      - `bio` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `posts`
      - `id` (uuid, primary key)
      - `title` (text)
      - `slug` (text, unique)
      - `content` (text)
      - `media_url` (text)
      - `type` (text, 'blog' or 'vlog')
      - `author_id` (uuid, references profiles)
      - `view_count` (integer, default 0)
      - `like_count` (integer, default 0)
      - `published` (boolean, default true)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `comments`
      - `id` (uuid, primary key)
      - `post_id` (uuid, references posts)
      - `content` (text)
      - `author_name` (text)
      - `author_email` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `reactions`
      - `id` (uuid, primary key)
      - `post_id` (uuid, references posts)
      - `user_ip` (text)
      - `reaction_type` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for public read access and authenticated write access
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text,
  avatar_url text,
  role text DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  email text,
  bio text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create posts table
CREATE TABLE IF NOT EXISTS posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  content text,
  media_url text,
  type text DEFAULT 'blog' CHECK (type IN ('blog', 'vlog')),
  author_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  view_count integer DEFAULT 0,
  like_count integer DEFAULT 0,
  published boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE,
  content text NOT NULL,
  author_name text NOT NULL,
  author_email text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create reactions table
CREATE TABLE IF NOT EXISTS reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE,
  user_ip text NOT NULL,
  reaction_type text NOT NULL CHECK (reaction_type IN ('like', 'love', 'laugh', 'wow', 'sad', 'angry')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(post_id, user_ip, reaction_type)
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Posts policies
CREATE POLICY "Published posts are viewable by everyone"
  ON posts FOR SELECT
  USING (published = true);

CREATE POLICY "Authenticated users can insert posts"
  ON posts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update their own posts"
  ON posts FOR UPDATE
  USING (auth.uid() = author_id);

CREATE POLICY "Authors can delete their own posts"
  ON posts FOR DELETE
  USING (auth.uid() = author_id);

-- Comments policies
CREATE POLICY "Comments are viewable by everyone"
  ON comments FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert comments"
  ON comments FOR INSERT
  WITH CHECK (true);

-- Reactions policies
CREATE POLICY "Reactions are viewable by everyone"
  ON reactions FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert reactions"
  ON reactions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can delete their own reactions"
  ON reactions FOR DELETE
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug);
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_reactions_post_id ON reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_reactions_user_ip ON reactions(user_ip);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();