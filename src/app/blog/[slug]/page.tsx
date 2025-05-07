'use client';
import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import ReactMarkdown from 'react-markdown';
import Image from 'next/image';
import { Post } from '@/types/supabase';

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    async function fetchPost() {
      setLoading(true);
      const { data, error } = await supabase.from('posts').select('*, profiles(name, avatar_url)').eq('slug', params.slug).single();
      if (!error) setPost(data as Post);
      setLoading(false);
    }
    fetchPost();
  }, [params.slug, supabase]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-pulse w-8 h-8 rounded-full bg-indigo-400"></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-red-500 mb-2">Post Not Found</h2>
        <p className="text-gray-600 dark:text-gray-400">The post you&apos;re looking for doesn&apos;t exist or has been removed.</p>
      </div>
    );
  }

  return (
    <article className="max-w-3xl mx-auto">
      <h1 className="text-3xl md:text-4xl font-bold mb-4">{post.title}</h1>
      
      <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 mb-6">
        {post.profiles?.avatar_url ? (
          <div className="relative w-8 h-8">
            <Image 
              src={post.profiles.avatar_url} 
              alt={`${post.profiles.name}'s avatar`} 
              fill
              className="rounded-full object-cover" 
            />
          </div>
        ) : (
          <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-300 font-semibold">
            {post.profiles?.name?.[0] || '?'}
          </div>
        )}
        <span>{post.profiles?.name || 'Unknown'}</span>
        <span>·</span>
        <time dateTime={post.created_at}>{new Date(post.created_at).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}</time>
      </div>
      
      {post.image_url && (
        <div className="mb-8 rounded-lg overflow-hidden shadow-md relative aspect-video">
          <Image 
            src={post.image_url} 
            alt={post.title} 
            fill
            priority
            className="object-cover"
          />
        </div>
      )}
      
      <div className="prose dark:prose-invert lg:prose-lg max-w-none">
        <ReactMarkdown>{post.content}</ReactMarkdown>
      </div>
    </article>
  );
}