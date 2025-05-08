'use client';

import { use, useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Editor, EditorState, convertFromRaw } from 'draft-js';
import Image from 'next/image';
import { Post } from '@/types/supabase';
import 'draft-js/dist/Draft.css';

type Comment = {
  id: string;
  content: string;
  // Add other fields as necessary, e.g., author, created_at, etc.
};

type BlogPostPageProps = {
  params: Promise<{ slug: string }>;
};

export default function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = use(params); // Correctly unwrap promise
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [editorState, setEditorState] = useState<EditorState | null>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    if (!slug) return;

    const fetchPostAndComments = async () => {
      try {
        setLoading(true);
        const { data: postData, error } = await supabase
          .from('posts')
          .select('*, profiles(name, avatar_url, bio), comments(*)')
          .eq('slug', slug)
          .single();

        if (error) {
          console.error('Error fetching post:', error.message);
        } else {
          setPost(postData as Post);
          setComments(postData.comments || []);

          if (postData.content) {
            const raw = JSON.parse(postData.content);
            const contentState = convertFromRaw(raw);
            setEditorState(EditorState.createWithContent(contentState));
          }
        }
      } catch (err) {
        console.error('Unexpected error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPostAndComments();
  }, [slug, supabase]);

  async function handleAddComment() {
    if (!newComment.trim()) return;

    const { data, error } = await supabase
      .from('comments')
      .insert({
        post_id: post?.id,
        content: newComment,
        author: 'Guest', // Replace with user info if logged in
      });

    if (!error && data) {
      setComments([...comments, ...data]);
      setNewComment('');
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-60">
        <div className="animate-spin h-10 w-10 border-4 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-red-500 mb-2">Post Not Found</h2>
        <p className="text-gray-600 dark:text-gray-400">
          The post you&apos;re looking for doesn&apos;t exist or has been removed.
        </p>
      </div>
    );
  }

  return (
    <article className="max-w-3xl mx-auto px-4 py-12">
      {/* Title */}
      <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white leading-tight mb-8">
        {post.title ?? 'Untitled Post'}
      </h1>

      {/* Author Info */}
      <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400 mb-8">
        {post.profiles?.avatar_url ? (
          <div className="relative w-12 h-12">
            <Image
              src={post.profiles.avatar_url}
              alt={`${post.profiles.name ?? 'Author'}'s avatar`}
              fill
              className="rounded-full object-cover"
            />
          </div>
        ) : (
          <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-800 rounded-full flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-300">
            {post.profiles?.name?.[0] ?? '?'}
          </div>
        )}
        <span className="font-medium">{post.profiles?.name ?? 'Unknown Author'}</span>
        <span>·</span>
        <time dateTime={post.created_at}>
          {new Date(post.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </time>
      </div>

      {/* Featured Image */}
      {post.media_url && (
        <div className="mb-8 rounded-lg overflow-hidden shadow-xl relative aspect-video">
          <Image
            src={post.media_url}
            alt={post.title ?? 'Post image'}
            fill
            priority
            className="object-cover rounded-lg"
          />
        </div>
      )}

      {/* Content */}
      <div className="prose dark:prose-invert bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-none">
        {editorState ? (
          <Editor editorState={editorState} onChange={() => {}} readOnly />
        ) : (
          <p className="text-gray-500">No content available.</p>
        )}
      </div>

      {/* Author Bio */}
      {post.profiles?.bio && (
        <div className="mt-12 p-6 rounded-lg shadow border dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">About the Author</h3>
          <p className="text-gray-700 dark:text-gray-400">{post.profiles.bio}</p>
        </div>
      )}

      {/* Comments Section */}
      <section className="mt-12">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">Comments</h2>
        <ul className="space-y-4">
          {comments.map((comment) => (
            <li key={comment.id} className="p-4 rounded-lg shadow bg-gray-50 dark:bg-gray-900">
              <p className="text-gray-700 dark:text-gray-400">{comment.content}</p>
            </li>
          ))}
        </ul>

        <div className="mt-6">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="w-full p-3 rounded-lg border dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-400"
          />
          <button
            onClick={handleAddComment}
            className="mt-3 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Submit
          </button>
        </div>
      </section>
    </article>
  );
}
