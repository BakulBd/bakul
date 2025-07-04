'use client';

import { use, useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Editor, EditorState, convertFromRaw } from 'draft-js';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  CalendarIcon, 
  ClockIcon, 
  UserIcon,
  ShareIcon,
  BookmarkIcon,
  ArrowLeftIcon,
  ChatBubbleLeftIcon,
  HeartIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { Comment, PostWithProfile } from '@/types/database';
import ReactionSystem from '@/components/ReactionSystem';
import { Button, Card, Textarea } from '@/components/ui';
import { cn } from '@/lib/utils';
import 'draft-js/dist/Draft.css';

type BlogPostPageProps = {
  params: Promise<{ slug: string }>;
};

export default function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = use(params);
  const [post, setPost] = useState<PostWithProfile | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState({ content: '', author_name: '', author_email: '' });
  const [loading, setLoading] = useState(true);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [editorState, setEditorState] = useState<EditorState | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const supabase = createClientComponentClient();

  useEffect(() => {
    if (!slug) return;

    const fetchPostAndComments = async () => {
      try {
        setLoading(true);
        
        // Fetch post with author profile
        const { data: postData, error } = await supabase
          .from('posts')
          .select('*, profiles(id, username, full_name, avatar_url)')
          .eq('slug', slug)
          .eq('status', 'published')
          .single();

        if (error) {
          console.error('Error fetching post:', error.message);
        } else {
          setPost(postData as PostWithProfile);
          setLikeCount(postData.reaction_count || 0);

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

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!post || !newComment.content.trim()) return;

    setSubmittingComment(true);
    try {
      const { error } = await supabase
        .from('comments')
        .insert({
          post_id: post.id,
          content: newComment.content,
        });

      if (!error) {
        setNewComment({ content: '', author_name: '', author_email: '' });
        // Refetch comments
        const { data: commentsData } = await supabase
          .from('comments')
          .select('*')
          .eq('post_id', post.id)
          .order('created_at', { ascending: true });
        setComments(commentsData || []);
      }
    } catch (err) {
      console.error('Error submitting comment:', err);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleLike = async () => {
    if (!post) return;
    
    setIsLiked(!isLiked);
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
  };

  const handleShare = async () => {
    if (navigator.share && post) {
      try {
        await navigator.share({
          title: post.title,
          text: `Check out this post: ${post.title}`,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const readingTime = post ? Math.max(1, Math.ceil((post.content?.length || 0) / 1000)) : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Post not found</h1>
          <Link href="/blog">
            <Button variant="outline">← Back to Blog</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Back Button */}
      <div className="sticky top-20 z-40 pt-6">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Link href="/blog">
              <Button variant="outline" className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-white/20 dark:border-slate-700/30">
                <ArrowLeftIcon className="w-4 h-4 mr-2" />
                Back to Blog
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="py-12 lg:py-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto"
          >
            {/* Post Header */}
            <div className="text-center mb-12">
              <h1 className="text-4xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent leading-tight">
                {post.title}
              </h1>

              {/* Meta Information */}
              <div className="flex flex-wrap items-center justify-center gap-6 text-muted-foreground">
                <div className="flex items-center gap-2">
                  <UserIcon className="w-4 h-4" />
                  <span>{post.profiles?.full_name || 'Bakul Ahmed'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4" />
                  <span>{post.created_at ? new Date(post.created_at).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  }) : 'Unknown date'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <ClockIcon className="w-4 h-4" />
                  <span>{readingTime} min read</span>
                </div>
              </div>
            </div>

            {/* Featured Image */}
            {post.media_url && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="relative aspect-video bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-2xl overflow-hidden mb-12"
              >
                <Image
                  src={post.media_url}
                  alt={post.title}
                  fill
                  className="object-cover"
                  priority
                />
              </motion.div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Content Section */}
      <section className="pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid lg:grid-cols-4 gap-12">
              {/* Sidebar */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="lg:col-span-1"
              >
                <div className="sticky top-32 space-y-6">
                  {/* Author Card */}
                  <Card className="p-6 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-white/20 dark:border-slate-700/30">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        {post.profiles?.avatar_url ? (
                          <Image
                            src={post.profiles.avatar_url}
                            alt={post.profiles.full_name || 'Author'}
                            width={64}
                            height={64}
                            className="rounded-full object-cover"
                          />
                        ) : (
                          <UserIcon className="w-8 h-8 text-white" />
                        )}
                      </div>
                      <h3 className="font-semibold text-foreground mb-2">
                        {post.profiles?.full_name || 'Bakul Ahmed'}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Full-Stack Developer & UI/UX Designer
                      </p>
                    </div>
                  </Card>

                  {/* Actions */}
                  <Card className="p-6 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-white/20 dark:border-slate-700/30">
                    <div className="space-y-4">
                      <Button
                        onClick={handleLike}
                        variant="outline"
                        className="w-full flex items-center gap-2"
                      >
                        {isLiked ? (
                          <HeartSolidIcon className="w-4 h-4 text-red-500" />
                        ) : (
                          <HeartIcon className="w-4 h-4" />
                        )}
                        Like ({likeCount})
                      </Button>

                      <Button
                        onClick={() => setIsBookmarked(!isBookmarked)}
                        variant="outline"
                        className="w-full flex items-center gap-2"
                      >
                        <BookmarkIcon className={cn("w-4 h-4", isBookmarked && "fill-current")} />
                        {isBookmarked ? 'Bookmarked' : 'Bookmark'}
                      </Button>

                      <Button
                        onClick={handleShare}
                        variant="outline"
                        className="w-full flex items-center gap-2"
                      >
                        <ShareIcon className="w-4 h-4" />
                        Share
                      </Button>
                    </div>
                  </Card>
                </div>
              </motion.div>

              {/* Main Content */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="lg:col-span-3"
              >
                <Card className="p-8 lg:p-12 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-white/20 dark:border-slate-700/30">
                  <div className="prose prose-lg dark:prose-invert max-w-none">
                    {editorState ? (
                      <Editor
                        editorState={editorState}
                        readOnly={true}
                        onChange={() => {}}
                      />
                    ) : (
                      <div className="whitespace-pre-wrap">{post.content}</div>
                    )}
                  </div>
                </Card>

                {/* Reaction System */}
                <div className="mt-8">
                  <ReactionSystem postId={post.id} />
                </div>

                {/* Comments Section */}
                <div className="mt-12">
                  <h2 className="text-2xl font-bold text-foreground mb-8 flex items-center gap-2">
                    <ChatBubbleLeftIcon className="w-6 h-6" />
                    Comments ({comments.length})
                  </h2>

                  {/* Comment Form */}
                  <Card className="p-6 mb-8 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-white/20 dark:border-slate-700/30">
                    <form onSubmit={handleCommentSubmit} className="space-y-4">
                      <Textarea
                        placeholder="Write your comment..."
                        value={newComment.content}
                        onChange={(e) => setNewComment(prev => ({ ...prev, content: e.target.value }))}
                        rows={4}
                        required
                      />
                      <Button type="submit" disabled={submittingComment}>
                        {submittingComment ? 'Posting...' : 'Post Comment'}
                      </Button>
                    </form>
                  </Card>

                  {/* Comments List */}
                  <div className="space-y-6">
                    {comments.map((comment) => (
                      <Card
                        key={comment.id}
                        className="p-6 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-white/20 dark:border-slate-700/30"
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                            A
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-semibold text-foreground">
                                Anonymous
                              </span>
                              <span className="text-sm text-muted-foreground">
                                {comment.created_at ? new Date(comment.created_at).toLocaleDateString() : 'Unknown date'}
                              </span>
                            </div>
                            <p className="text-muted-foreground leading-relaxed">
                              {comment.content}
                            </p>
                          </div>
                        </div>
                      </Card>
                    ))}

                    {comments.length === 0 && (
                      <div className="text-center py-12">
                        <ChatBubbleLeftIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">
                          No comments yet. Be the first to share your thoughts!
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}