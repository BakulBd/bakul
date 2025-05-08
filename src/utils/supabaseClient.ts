// src/utils/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Updated query to handle potential schema issues
export async function fetchPostsWithProfiles() {
  const { data, error } = await supabase
    .from('posts')
    .select(`id, title, slug, content, media_url, type, author_id, created_at, updated_at, profiles(id, name, avatar_url, role, email, bio)`) // Added 'bio' field
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching posts with profiles:', error.message || error.details || JSON.stringify(error));
    throw new Error(`Error fetching posts: ${error.message || 'Unknown error'}`);
  }

  // Normalize profiles to always be an object (not array)
  return (data || []).map(post => ({
    ...post,
    profiles: Array.isArray(post.profiles) ? post.profiles[0] : post.profiles,
  }));
}
