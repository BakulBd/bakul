// User and profile related types
export interface User {
  id: string;
  email?: string;
  app_metadata: Record<string, unknown>;
  user_metadata: Record<string, unknown>;
  aud: string;
}

export interface Profile {
  id: string;
  name: string;
  avatar_url: string;
  role: 'admin' | 'user';
  email?: string;
}

// Post related types
export interface Post {
  id: string;
  author_id: string;
  title: string;
  slug: string;
  content: string;
  image_url: string;
  type: 'blog' | 'vlog';
  created_at: string;
  updated_at: string;
  profiles?: Profile;
}