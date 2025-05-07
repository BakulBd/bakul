'use client';
import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from "next/link";
import Image from 'next/image';
import { Post } from '@/types/supabase';

export default function BlogPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    async function fetchPosts() {
      setLoading(true);
      const { data, error } = await supabase.from('posts').select('*, profiles(name, avatar_url)').order('created_at', { ascending: false });
      if (!error) setPosts(data || []);
      setLoading(false);
    }
    fetchPosts();
  }, [supabase]);

  return (
    <section>
      <h1 className="text-3xl font-bold mb-6">Blog & Vlog</h1>
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-pulse w-8 h-8 rounded-full bg-indigo-400"></div>
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12 text-gray-400">No posts available yet. Check back soon!</div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="group block rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow hover:shadow-lg transition overflow-hidden"
            >
              {post.image_url ? (
                <div className="aspect-video w-full bg-gray-100 dark:bg-gray-800 relative">
                  <Image 
                    src={post.image_url} 
                    alt={post.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover"
                    priority={posts.indexOf(post) < 2} // Prioritize loading first two posts
                  />
                </div>
              ) : (
                <div className="aspect-video w-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <span className="text-gray-400">{post.type}</span>
                </div>
              )}
              <div className="p-4">
                <h2 className="text-xl font-semibold mb-1 group-hover:text-indigo-500 transition">{post.title}</h2>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-2 line-clamp-2">{post.content?.slice(0, 120)}...</p>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  {post.profiles?.avatar_url ? (
                    <div className="relative w-5 h-5">
                      <Image 
                        src={post.profiles.avatar_url} 
                        alt={`${post.profiles.name}'s avatar`}
                        fill
                        className="rounded-full object-cover" 
                      />
                    </div>
                  ) : (
                    <div className="w-5 h-5 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center">
                      <span className="text-xs text-indigo-600 dark:text-indigo-400">
                        {post.profiles?.name?.[0] || '?'}
                      </span>
                    </div>
                  )}
                  <span>{post.profiles?.name || 'Unknown'}</span>
                  <span>· {new Date(post.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}