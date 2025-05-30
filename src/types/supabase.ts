export type Profile = {
  id: string;
  name: string;
  avatar_url: string;
  role: string;
  email: string;
  bio?: string; // Optional field
};

export type Post = {
  id: string;
  title: string;
  slug: string;
  content: string;
  media_url?: string; // Optional field
  type: string;
  author_id: string;
  created_at: string;
  updated_at: string;
  profiles?: Profile; // Associated profile
};

export type User = {
  id: string;
  email: string;
  created_at: string;
  updated_at?: string; // Optional field
  profile?: Profile; // Associated profile
};
