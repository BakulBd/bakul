'use client';
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { createClientComponentClient, User } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import PostEditor from "@/components/PostEditor";
import Image from 'next/image';
import { Profile, Post } from '@/types/supabase';

interface ExtendedPost extends Post {
  profiles?: Profile;
}

function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  return (
    <div className={`fixed top-6 right-6 z-50 px-4 py-2 rounded shadow-lg text-white ${type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}
      role="alert">
      <div className="flex items-center">
        <span>{message}</span>
        <button 
          onClick={onClose} 
          className="ml-4 p-1 rounded hover:bg-white hover:bg-opacity-20"
          aria-label="Close"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [editorOpen, setEditorOpen] = useState(false);
  const [editPost, setEditPost] = useState<ExtendedPost | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<ExtendedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClientComponentClient();

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*, profiles(name, avatar_url, bio)')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching posts:', error);
        setToast({ message: 'Failed to load posts. Please try again.', type: 'error' });
      } else {
        setPosts(data || []);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setToast({ message: 'An unexpected error occurred.', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();

        if (error || !data?.user) {
          router.replace('/login');
          return;
        }

        setUser(data.user);

        // Fetch profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profileError) {
          console.error('Error fetching profile:', profileError);
          // Create a default profile if none exists
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert([{ 
              id: data.user.id, 
              name: data.user.user_metadata?.name || 'User', 
              avatar_url: '', 
              role: 'user',
              email: data.user.email
            }])
            .select()
            .single();

          if (!createError && newProfile) {
            setProfile(newProfile);
          } else {
            console.error('Error creating profile:', createError);
          }
        } else {
          setProfile(profileData);
        }

        await fetchPosts();
      } catch (err) {
        console.error('Auth error:', err);
        router.replace('/login');
      }
    };

    checkAuth();
  }, [router, supabase, fetchPosts]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  async function handleSave(data: Pick<Post, 'title' | 'slug' | 'content' | 'media_url' | 'type'>) {
    try {
      const now = new Date().toISOString();
      
      if (editPost) {
        // Check if slug was changed and if it's already used
        if (editPost.slug !== data.slug) {
          const { data: existing } = await supabase
            .from('posts')
            .select('id')
            .eq('slug', data.slug);
            
          if (existing && existing.length > 0) {
            setToast({ message: 'Slug already exists. Please choose another.', type: 'error' });
            return;
          }
        }
        
        const { error } = await supabase
          .from('posts')
          .update({ 
            ...data, 
            updated_at: now 
          })
          .eq('id', editPost.id);
          
        if (error) throw error;
        setToast({ message: 'Post updated successfully!', type: 'success' });
      } else {
        // Check if slug already exists
        const { data: existing } = await supabase
          .from('posts')
          .select('id')
          .eq('slug', data.slug);
          
        if (existing && existing.length > 0) {
          setToast({ message: 'Slug already exists. Please choose another.', type: 'error' });
          return;
        }
        
        const { error } = await supabase
          .from('posts')
          .insert([{ 
            ...data, 
            author_id: user!.id, 
            created_at: now, 
            updated_at: now 
          }]);
          
        if (error) throw error;
        setToast({ message: 'Post created successfully!', type: 'success' });
      }
      
      setEditorOpen(false);
      setEditPost(null);
      fetchPosts();
    } catch (err) {
      console.error('Error saving post:', err);
      setToast({ message: (err as Error).message || 'An error occurred.', type: 'error' });
    }
  }

  async function handleDelete(id: string) {
    if (confirmDelete !== id) {
      setConfirmDelete(id);
      return;
    }
    
    try {
      const { error } = await supabase.from('posts').delete().eq('id', id);
      if (error) throw error;
      setToast({ message: 'Post deleted.', type: 'success' });
      setConfirmDelete(null);
      fetchPosts();
    } catch (err) {
      console.error('Error deleting post:', err);
      setToast({ message: (err as Error).message || 'An error occurred.', type: 'error' });
    }
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.replace('/login');
    } catch (err) {
      console.error('Sign out error:', err);
      setToast({ message: 'Failed to sign out. Please try again.', type: 'error' });
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-8">
      {/* Toast notification */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      {/* Sidebar */}
      <aside className="w-full md:w-56 flex-shrink-0 mb-6 md:mb-0">
        <nav className="bg-white dark:bg-gray-900 rounded-lg shadow p-4 space-y-2 sticky top-24">
          {profile && (
            <div className="mb-4 text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-2xl font-bold text-indigo-600 dark:text-indigo-300 overflow-hidden">
                {profile.avatar_url ? (
                  <Image 
                    src={profile.avatar_url} 
                    alt={profile.name || 'User avatar'} 
                    width={64} 
                    height={64} 
                    className="rounded-full object-cover"
                  />
                ) : (
                  profile.name?.[0] || user?.email?.[0] || '?'
                )}
              </div>
              <div className="mt-2 font-semibold text-gray-800 dark:text-gray-200">{profile.name || user?.email}</div>
              <div className="text-xs text-gray-400">{profile.role === 'admin' ? 'Admin' : 'Author'}</div>
            </div>
          )}
          
          <Link 
            href="/admin" 
            className="block py-2 px-3 rounded bg-indigo-50 dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 font-semibold"
            aria-current="page"
          >
            Dashboard
          </Link>
          <Link 
            href="/admin/profile" 
            className="block py-2 px-3 rounded hover:bg-indigo-50 dark:hover:bg-gray-800 transition"
          >
            Profile
          </Link>
          {profile?.role === 'admin' && (
            <Link 
              href="/admin/users" 
              className="block py-2 px-3 rounded hover:bg-indigo-50 dark:hover:bg-gray-800 transition"
            >
              Users
            </Link>
          )}
          <Link 
            href="/blog" 
            className="block py-2 px-3 rounded hover:bg-indigo-50 dark:hover:bg-gray-800 transition"
            target="_blank"
            rel="noopener noreferrer"
          >
            View Blog
          </Link>
          <button 
            onClick={handleLogout} 
            className="block w-full text-left py-2 px-3 rounded hover:bg-red-50 dark:hover:bg-gray-800 text-red-600 dark:text-red-400 transition mt-6"
          >
            Logout
          </button>
        </nav>
      </aside>
      
      {/* Main Content */}
      <main className="flex-1">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Admin Dashboard</h1>
          <button 
            onClick={() => { setEditorOpen(true); setEditPost(null); }} 
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>New Post</span>
          </button>
        </div>
        <div className="overflow-x-auto bg-white dark:bg-gray-900 shadow rounded-lg p-6">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No posts yet</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Get started by creating a new post.</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Author</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {posts.map((post) => (
                  <tr key={post.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate max-w-xs">
                        {post.title}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-700 dark:text-gray-300">
                        {post.profiles?.name || 'Unknown'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        post.type === 'blog' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      }`}>
                        {post.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(post.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button 
                        onClick={() => { setEditorOpen(true); setEditPost(post); }} 
                        className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(post.id)} 
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        
        {editorOpen && (
          <PostEditor
            initial={editPost || undefined}
            onSave={handleSave}
            onCancel={() => { setEditorOpen(false); setEditPost(null); setConfirmDelete(null); }}
          />
        )}
      </main>
    </div>
  );
}