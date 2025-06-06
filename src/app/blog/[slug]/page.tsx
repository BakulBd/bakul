'use client';

import { use, useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Editor, EditorState, convertFromRaw } from 'draft-js';
import Image from 'next/image';
import { Post, Comment } from '@/types/supabase';
import ReactionSystem from '@/components/ReactionSystem';
import 'draft-js/dist/Draft.css';

type BlogPostPageProps = {
  params: Promise<{ slug: string }>;
};

export default function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = use(params);
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState({ content: '', author_name: '', author_email: '' });
  const [loading, setLoading] = useState(true);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [editorState, setEditorState] = useState<EditorState | null>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    if (!slug) return;

    const fetchPostAndComments = async () => {
      try {
        setLoading(true);
        
        // Fetch post with author profile
        const { data: postData, error } = await supabase
          .from('posts')
          .select('*, profiles(name, avatar_url, bio)')
          .eq('slug', slug)
          .eq('published', true)
          .single();

        if (error) {
          console.error('Error fetching post:', error.message);
        } else {
          setPost(postData as Post);

          // Increment view count
          await supabase
            .from('posts')
            .update({ view_count: (postData.view_count || 0) + 1 })
            .eq('id', postData.id);

          // Parse content for editor
          if (postData.content) {
            try {
              const raw = JSON.parse(postData.content);
              const contentState = convertFromRaw(raw);
              setEditorState(EditorState.createWithContent(contentState));
            } catch {
              // Fallback for plain text content
              setEditorState(EditorState.createEmpty());
            }
          }

          // Fetch comments
          const { data: commentsData } = await supabase
            .from('comments')
            .select('*')
            .eq('post_id', postData.id)
            .order('created_at', { ascending: true });

          setComments(commentsData || []);
        }
      } catch (err) {
        console.error('Unexpected error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPostAndComments();
  }, [slug, supabase]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.content.trim() || !newComment.author_name.trim() || !post) return;

    setSubmittingComment(true);
    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          post_id: post.id,
          content: newComment.content.trim(),
          author_name: newComment.author_name.trim(),
          author_email: newComment.author_email.trim() || null,
        })
        .select()
        .single();

      if (error) throw error;

      setComments([...comments, data]);
      setNewComment({ content: '', author_name: '', author_email: '' });
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setSubmittingComment(false);
    }
  };

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
    <article className="max-w-4xl mx-auto px-4 py-12">
      {/* Title */}
      <header className="mb-8">
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white leading-tight mb-6">
          {post.title}
        </h1>

        {/* Meta Information */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-6">
          <div className="flex items-center gap-3">
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
            <div>
              <div className="font-medium text-gray-900 dark:text-white">
                {post.profiles?.name ?? 'Unknown Author'}
              </div>
              <div className="text-xs">
                {new Date(post.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-xs">
            <span className={`px-2 py-1 rounded-full font-medium ${
              post.type === 'blog' 
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
            }`}>
              {post.type.toUpperCase()}
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              {post.view_count || 0} views
            </span>
          </div>
        </div>
      </header>

      {/* Featured Image */}
      {post.media_url && (
        <div className="mb-8 rounded-xl overflow-hidden shadow-2xl relative aspect-video">
          <Image
            src={post.media_url}
            alt={post.title ?? 'Post image'}
            fill
            priority
            className="object-cover"
          />
        </div>
      )}

      {/* Content */}
      <div className="prose prose-lg dark:prose-invert max-w-none mb-8">
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-8">
          {editorState ? (
            <Editor 
              editorState={editorState} 
              onChange={() => {}} 
              readOnly 
            />
          ) : (
            <p className="text-gray-500">No content available.</p>
          )}
        </div>
      </div>

      {/* Author Bio */}
      {post.profiles?.bio && (
        <div className="mb-8 p-6 rounded-lg shadow-lg border dark:border-gray-700 bg-gradient-to-r from-gray-50 to-indigo-50 dark:from-gray-900 dark:to-indigo-900">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-3">
            About the Author
          </h3>
          <div className="flex items-start gap-4">
            {post.profiles?.avatar_url ? (
              <div className="relative w-16 h-16 flex-shrink-0">
                <Image
                  src={post.profiles.avatar_url}
                  alt={`${post.profiles.name}'s avatar`}
                  fill
                  className="rounded-full object-cover"
                />
              </div>
            ) : (
              <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-800 rounded-full flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-300 text-xl flex-shrink-0">
                {post.profiles?.name?.[0] ?? '?'}
              </div>
            )}
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                {post.profiles.name}
              </h4>
              <p className="text-gray-700 dark:text-gray-400">{post.profiles.bio}</p>
            </div>
          </div>
        </div>
      )}

      {/* Reaction System */}
      <ReactionSystem postId={post.id} />

      {/* Comments Section */}
      <section className="mt-12">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">
          Comments ({comments.length})
        </h2>

        {/* Add Comment Form */}
        <form onSubmit={handleAddComment} className="mb-8 bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Leave a Comment</h3>
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <input
              type="text"
              placeholder="Your name *"
              value={newComment.author_name}
              onChange={(e) => setNewComment({ ...newComment, author_name: e.target.value })}
              className="w-full p-3 rounded-lg border dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
            <input
              type="email"
              placeholder="Your email (optional)"
              value={newComment.author_email}
              onChange={(e) => setNewComment({ ...newComment, author_email: e.target.value })}
              className="w-full p-3 rounded-lg border dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <textarea
            placeholder="Write your comment here... *"
            value={newComment.content}
            onChange={(e) => setNewComment({ ...newComment, content: e.target.value })}
            className="w-full p-3 rounded-lg border dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-h-[120px]"
            required
          />
          <button
            type="submit"
            disabled={submittingComment}
            className="mt-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center gap-2"
          >
            {submittingComment ? (
              <>
                <svg className="animate-spin w-4 h-4\" fill="none\" viewBox="0 0 24 24">
                  <circle className="opacity-25\" cx="12\" cy="12\" r="10\" stroke="currentColor\" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Posting...
              </>
            ) : (
              'Post Comment'
            )}
          </button>
        </form>

        {/* Comments List */}
        <div className="space-y-6">
          {comments.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p>No comments yet. Be the first to share your thoughts!</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-800 rounded-full flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-300 flex-shrink-0">
                    {comment.author_name[0].toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {comment.author_name}
                      </h4>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(comment.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                      {comment.content}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </article>
  );
}