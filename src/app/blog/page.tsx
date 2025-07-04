'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MagnifyingGlassIcon, 
  CalendarIcon,
  ClockIcon,
  EyeIcon,
  UserIcon,
  DocumentTextIcon,
  VideoCameraIcon
} from '@heroicons/react/24/outline';
import { Post } from '@/types/supabase';
import { convertFromRaw } from 'draft-js';
import { stateToHTML } from 'draft-js-export-html';
import { Button, Input, Card, Badge } from '@/components/ui';
import { cn } from '@/lib/utils';
import 'draft-js/dist/Draft.css';

export default function BlogPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'blog' | 'vlog'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

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
      return div.textContent?.slice(0, 160) ?? '';
    } catch {
      return post.content.slice(0, 160); // fallback for plain text or invalid JSON
    }
  }

  // Filter posts based on search and category
  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         getPostPreview(post).toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const categories = [
    { id: 'all', name: 'All Categories', count: filteredPosts.length },
    { id: 'web-dev', name: 'Web Development', count: 12 },
    { id: 'ui-ux', name: 'UI/UX Design', count: 8 },
    { id: 'tutorials', name: 'Tutorials', count: 15 },
    { id: 'career', name: 'Career Tips', count: 6 },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-28 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 dark:from-blue-400/10 dark:to-purple-400/10" />
          <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,.1)_50%,transparent_75%)] bg-[length:20px_20px] opacity-20" />
        </div>
        
        <div className="relative container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            <h1 className="text-5xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Blog & Insights
            </h1>
            <p className="text-xl lg:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Thoughts, tutorials, and insights about web development, design, and technology. 
              Join me on my journey of continuous learning and sharing.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Search and Filters */}
      <section className="py-8 lg:py-12">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="max-w-4xl mx-auto"
          >
            {/* Search Bar */}
            <div className="relative mb-8">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search articles, tutorials, and insights..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 pr-4 py-4 text-lg bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-white/20 dark:border-slate-700/30 rounded-2xl"
              />
            </div>

            {/* Content Type Filter */}
            <div className="flex flex-wrap justify-center gap-3 mb-8">
              {[
                { key: 'all', label: 'All Posts', icon: DocumentTextIcon },
                { key: 'blog', label: 'Articles', icon: DocumentTextIcon },
                { key: 'vlog', label: 'Videos', icon: VideoCameraIcon }
              ].map(({ key, label, icon: Icon }) => (
                <Button
                  key={key}
                  onClick={() => setFilter(key as 'all' | 'blog' | 'vlog')}
                  variant={filter === key ? 'primary' : 'outline'}
                  size="lg"
                  className={cn(
                    'px-6 py-3 rounded-xl font-medium transition-all duration-300',
                    filter === key
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg transform scale-105'
                      : 'bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-white/20 dark:border-slate-700/30 hover:bg-white/80 dark:hover:bg-slate-700/60'
                  )}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {label}
                </Button>
              ))}
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap justify-center gap-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={cn(
                    'px-4 py-2 rounded-full text-sm font-medium transition-all duration-200',
                    selectedCategory === category.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/20 dark:border-slate-700/30 text-muted-foreground hover:text-foreground hover:bg-white/80 dark:hover:bg-slate-700/60'
                  )}
                >
                  {category.name}
                  <Badge variant="secondary" className="ml-2">
                    {category.count}
                  </Badge>
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Posts Grid */}
      <section className="pb-20 lg:pb-28">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="flex justify-center py-20">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"
              />
            </div>
          ) : filteredPosts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center py-20"
            >
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full flex items-center justify-center">
                <DocumentTextIcon className="w-12 h-12 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-4">
                No posts found
              </h2>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                {searchTerm 
                  ? `No posts match "${searchTerm}". Try adjusting your search or filters.`
                  : filter === 'all' 
                    ? 'Check back soon for updates!'
                    : `No ${filter} posts found. Try a different filter.`
                }
              </p>
              <Button 
                onClick={() => {
                  setSearchTerm('');
                  setFilter('all');
                  setSelectedCategory('all');
                }}
                variant="outline"
              >
                Clear Filters
              </Button>
            </motion.div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid gap-8 md:grid-cols-2 lg:grid-cols-3"
            >
              <AnimatePresence>
                {filteredPosts.map((post, index) => (
                  <motion.div
                    key={post.id}
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    whileHover={{ y: -8 }}
                    className="group"
                  >
                    <Link href={`/blog/${post.slug}`}>
                      <Card className="h-full bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-white/20 dark:border-slate-700/30 overflow-hidden hover:bg-white/80 dark:hover:bg-slate-700/60 transition-all duration-300">
                        {/* Post Image */}
                        <div className="relative aspect-video bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 overflow-hidden">
                          {post.media_url ? (
                            <Image
                              src={post.media_url}
                              alt={post.title ?? 'Blog cover'}
                              fill
                              className="object-cover group-hover:scale-110 transition-transform duration-500"
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                              priority={index < 6}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <DocumentTextIcon className="w-16 h-16 text-blue-400 dark:text-blue-500" />
                            </div>
                          )}
                          
                          {/* Overlay */}
                          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors duration-300" />
                          
                          {/* Post Type Badge */}
                          <div className="absolute top-4 left-4">
                            <Badge 
                              variant={post.type === 'blog' ? 'primary' : 'secondary'}
                              className="bg-white/90 dark:bg-slate-900/90 text-foreground backdrop-blur-sm"
                            >
                              {post.type === 'blog' ? (
                                <>
                                  <DocumentTextIcon className="w-3 h-3 mr-1" />
                                  Article
                                </>
                              ) : (
                                <>
                                  <VideoCameraIcon className="w-3 h-3 mr-1" />
                                  Video
                                </>
                              )}
                            </Badge>
                          </div>

                          {/* View Count */}
                          <div className="absolute top-4 right-4 bg-black/50 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1 backdrop-blur-sm">
                            <EyeIcon className="w-3 h-3" />
                            {post.view_count || 0}
                          </div>
                        </div>

                        {/* Post Content */}
                        <div className="p-6">
                          <h2 className="text-xl font-bold text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-3 line-clamp-2 leading-tight">
                            {post.title}
                          </h2>
                          
                          <p className="text-muted-foreground mb-4 line-clamp-3 leading-relaxed">
                            {getPostPreview(post)}...
                          </p>

                          {/* Author and Meta */}
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
                                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                                  <UserIcon className="w-4 h-4 text-white" />
                                </div>
                              )}
                              <div>
                                <div className="text-sm font-medium text-foreground">
                                  {post.profiles?.name || 'Bakul Ahmed'}
                                </div>
                                <div className="text-xs text-muted-foreground flex items-center gap-1">
                                  <CalendarIcon className="w-3 h-3" />
                                  {new Date(post.created_at).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                  })}
                                </div>
                              </div>
                            </div>

                            {/* Read Time */}
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <ClockIcon className="w-3 h-3" />
                              {Math.max(1, Math.ceil(getPostPreview(post).split(' ').length / 200))} min
                            </div>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </section>
    </div>
  );
}