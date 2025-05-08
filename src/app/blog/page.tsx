'use client';
import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';
import Image from 'next/image';
import { Post } from '@/types/supabase';
import { convertFromRaw } from 'draft-js';
import { stateToHTML } from 'draft-js-export-html';
import 'draft-js/dist/Draft.css';

export default function BlogPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClientComponentClient();

    async function fetchPosts() {
      setLoading(true);
      const { data, error } = await supabase
        .from('posts')
        .select('*, profiles(name, avatar_url, bio)')
        .order('created_at', { ascending: false });

      if (!error) setPosts(data || []);
      setLoading(false);
    }

    fetchPosts();
  }, []);

  // Convert editor content (stored as raw JSON) to plain text preview
  function getPostPreview(post: Post): string {
    if (!post.content) return '';
    try {
      const raw = JSON.parse(post.content);
      const contentState = convertFromRaw(raw);
      const html = stateToHTML(contentState);
      const div = document.createElement('div');
      div.innerHTML = html;
      return div.textContent?.slice(0, 140) ?? '';
    } catch {
      return post.content.slice(0, 140); // fallback for plain text or invalid JSON
    }
  }

  return (
    <section className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold text-center mb-12 text-indigo-600 dark:text-indigo-400">
        Blog & Vlog
      </h1>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12 text-gray-400 dark:text-gray-500">
          <h2 className="text-lg font-semibold">No posts available</h2>
          <p className="text-sm">Check back soon for updates!</p>
        </div>
      ) : (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="group border rounded-xl bg-white dark:bg-gray-900 hover:shadow-lg transition overflow-hidden"
            >
              {post.media_url ? (
                <div className="aspect-video relative w-full bg-gray-200 dark:bg-gray-800">
                  <Image
                    src={post.media_url}
                    alt={post.title ?? 'Blog cover'}
                    fill
                    className="object-cover"
                    sizes="100vw"
                    priority={posts.indexOf(post) < 2}
                  />
                </div>
              ) : (
                <div className="aspect-video w-full flex items-center justify-center text-sm text-gray-400 dark:text-gray-600 bg-gray-100 dark:bg-gray-800">
                  No image
                </div>
              )}

              <div className="p-4">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white group-hover:text-indigo-500 transition">
                  {post.title}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 mb-3 line-clamp-3">
                  {getPostPreview(post)}...
                </p>

                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  {post.profiles?.avatar_url ? (
                    <Image
                      src={post.profiles.avatar_url}
                      alt={post.profiles.name ?? 'Author'}
                      width={20}
                      height={20}
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-5 h-5 bg-indigo-100 dark:bg-indigo-800 rounded-full flex items-center justify-center">
                      <span className="text-indigo-600 dark:text-indigo-300 font-bold text-xs">
                        {post.profiles?.name?.[0] || '?'}
                      </span>
                    </div>
                  )}
                  <span>{post.profiles?.name || 'Unknown'}</span>
                  <span>·</span>
                  <time dateTime={post.created_at}>
                    {new Date(post.created_at).toLocaleDateString()}
                  </time>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
