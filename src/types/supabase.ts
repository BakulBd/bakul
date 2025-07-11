export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string | null;
          avatar_url: string | null;
          role: 'user' | 'admin';
          email: string | null;
          bio: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name?: string | null;
          avatar_url?: string | null;
          role?: 'user' | 'admin';
          email?: string | null;
          bio?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string | null;
          avatar_url?: string | null;
          role?: 'user' | 'admin';
          email?: string | null;
          bio?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      posts: {
        Row: {
          id: string;
          title: string;
          slug: string;
          content: string | null;
          media_url: string | null;
          type: 'blog' | 'vlog';
          author_id: string;
          created_at: string;
          updated_at: string;
          view_count: number;
          like_count: number;
          published: boolean;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          content?: string | null;
          media_url?: string | null;
          type?: 'blog' | 'vlog';
          author_id: string;
          created_at?: string;
          updated_at?: string;
          view_count?: number;
          like_count?: number;
          published?: boolean;
        };
        Update: {
          id?: string;
          title?: string;
          slug?: string;
          content?: string | null;
          media_url?: string | null;
          type?: 'blog' | 'vlog';
          author_id?: string;
          created_at?: string;
          updated_at?: string;
          view_count?: number;
          like_count?: number;
          published?: boolean;
        };
      };
      comments: {
        Row: {
          id: string;
          post_id: string;
          content: string;
          author_name: string;
          author_email: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          content: string;
          author_name: string;
          author_email?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          content?: string;
          author_name?: string;
          author_email?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      reactions: {
        Row: {
          id: string;
          post_id: string;
          user_ip: string;
          reaction_type: 'like' | 'love' | 'laugh' | 'wow' | 'sad' | 'angry';
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          user_ip: string;
          reaction_type: 'like' | 'love' | 'laugh' | 'wow' | 'sad' | 'angry';
          created_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          user_ip?: string;
          reaction_type?: 'like' | 'love' | 'laugh' | 'wow' | 'sad' | 'angry';
          created_at?: string;
        };
      };
    };
  };
}

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Post = Database['public']['Tables']['posts']['Row'] & {
  profiles?: Profile;
  comments?: Comment[];
  reactions?: Reaction[];
};
export type Comment = Database['public']['Tables']['comments']['Row'];
export type Reaction = Database['public']['Tables']['reactions']['Row'];
export type User = {
  id: string;
  email?: string;
  user_metadata?: {
    name?: string;
  };
};

export type ReactionType = 'like' | 'love' | 'laugh' | 'wow' | 'sad' | 'angry';