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
  const [filter, setFilter] = useState<'all' | 'blog' | 'vlog'>('all');

  useEffect(() => {
    const supabase = createClientComponentClient();

    async function fetchPosts() {
      setLoading(true);
      let query = supabase
        .from('posts')
        .select('*, profiles(name, avatar_url, bio)')
        .eq('published', true)
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('type', filter);
      }

      const { data, error } = await query;

      if (!error) setPosts(data || []);
      setLoading(false);
    }

    fetchPosts();
  }, [filter]);

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

  const filteredPosts = posts;

  return (
    <section className="max-w-7xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
          Blog & Vlog
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Thoughts, tutorials, and insights about web development, technology, and life
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex justify-center mb-8">
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-1 flex">
          {[
            { key: 'all', label: 'All Posts' },
            { key: 'blog', label: 'Blog Posts' },
            { key: 'vlog', label: 'Video Blogs' }
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key as 'all' | 'blog' | 'vlog')}
              className={`px-6 py-2 rounded-md font-medium transition-all duration-200 ${
                filter === key
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No posts available
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {filter === 'all' ? 'Check back soon for updates!' : `No ${filter} posts found. Try a different filter.`}
          </p>
        </div>
      ) : (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPosts.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="group bg-white dark:bg-gray-900 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden"
            >
              {/* Post Image */}
              <div className="relative aspect-video bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900 dark:to-purple-900">
                {post.media_url ? (
                  <Image
                    src={post.media_url}
                    alt={post.title ?? 'Blog cover'}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    priority={posts.indexOf(post) < 3}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg className="w-16 h-16 text-gray-400 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                
                {/* Post Type Badge */}
                <div className="absolute top-3 left-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    post.type === 'blog' 
                      ? 'bg-green-500 text-white' 
                      : 'bg-red-500 text-white'
                  }`}>
                    {post.type === 'blog' ? '📝 Blog' : '🎥 Vlog'}
                  </span>
                </div>

                {/* View Count */}
                <div className="absolute top-3 right-3 bg-black bg-opacity-50 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  {post.view_count || 0}
                </div>
              </div>

              {/* Post Content */}
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors mb-3 line-clamp-2">
                  {post.title}
                </h2>
                
                <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-3 leading-relaxed">
                  {getPostPreview(post)}...
                </p>

                {/* Author and Date */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {post.profiles?.avatar_url ? (
                      <Image
                        src={post.profiles.avatar_url}
                        alt={post.profiles.name ?? 'Author'}
                        width={32}
                        height={32}
                        className="rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-800 rounded-full flex items-center justify-center">
                        <span className="text-indigo-600 dark:text-indigo-300 font-bold text-sm">
                          {post.profiles?.name?.[0] || '?'}
                        </span>
                      </div>
                    )}
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {post.profiles?.name || 'Unknown'}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(post.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Read More Arrow */}
                  <div className="text-indigo-600 dark:text-indigo-400 group-hover:translate-x-1 transition-transform">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}