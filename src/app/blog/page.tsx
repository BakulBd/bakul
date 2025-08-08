'use client';

import Link from "next/link";
import { useState, useEffect } from "react";
import { useTheme } from 'next-themes';
import ModernNavbar from "@/components/layout/ModernNavbar";
import { motion, AnimatePresence, useInView, useScroll, useTransform } from "framer-motion";
import { 
  CalendarIcon, 
  ClockIcon, 
  EyeIcon, 
  ArrowRightIcon, 
  MagnifyingGlassIcon,
  FunnelIcon,
  SparklesIcon,
  BookOpenIcon,
  HeartIcon,
  ShareIcon,
  BookmarkIcon
} from "@heroicons/react/24/outline";
import { useRef } from 'react';

interface BlogPost {
  id: string;
  title: string;
  brief: string;
  slug: string;
  publishedAt: string;
  readTimeInMinutes: number;
  views: number;
  coverImage?: {
    url: string;
  };
  tags: Array<{
    name: string;
    slug: string;
  }>;
  author: {
    name: string;
    profilePicture?: string;
  };
}

interface HashnodeResponse {
  data: {
    publication: {
      posts: {
        edges: Array<{
          node: BlogPost;
        }>;
      };
    };
  };
}

// Hashnode GraphQL query
const HASHNODE_QUERY = `
  query GetPosts($host: String!) {
    publication(host: $host) {
      posts(first: 10) {
        edges {
          node {
            id
            title
            brief
            slug
            publishedAt
            readTimeInMinutes
            views
            coverImage {
              url
            }
            tags {
              name
              slug
            }
            author {
              name
              profilePicture
            }
          }
        }
      }
    }
  }
`;

export default function Blog() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [showBackToTop, setShowBackToTop] = useState(false);
  const { theme } = useTheme();
  const headerRef = useRef(null);
  const isHeaderInView = useInView(headerRef, { once: true });
  const { scrollYProgress } = useScroll();
  const scaleX = useTransform(scrollYProgress, [0, 1], [0, 1]);

  // Handle scroll for back to top button
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 500);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Filter posts based on search term and selected tag
  useEffect(() => {
    let filtered = posts;

    if (searchTerm) {
      filtered = filtered.filter(post => 
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.brief.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.tags.some(tag => tag.name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (selectedTag) {
      filtered = filtered.filter(post => 
        post.tags.some(tag => tag.slug === selectedTag)
      );
    }

    setFilteredPosts(filtered);
  }, [posts, searchTerm, selectedTag]);

  // Get all unique tags
  const allTags = posts.reduce((tags, post) => {
    post.tags.forEach(tag => {
      if (!tags.find(t => t.slug === tag.slug)) {
        tags.push(tag);
      }
    });
    return tags;
  }, [] as Array<{name: string; slug: string}>);

  const fetchHashnodePosts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('https://gql.hashnode.com/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: HASHNODE_QUERY,
          variables: {
            host: 'bakul.hashnode.dev'
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: HashnodeResponse = await response.json();
      
      if (data.data?.publication?.posts?.edges) {
        const fetchedPosts = data.data.publication.posts.edges.map(edge => edge.node);
        setPosts(fetchedPosts);
        setFilteredPosts(fetchedPosts);
      } else {
        throw new Error('No posts found in the response');
      }
    } catch (err) {
      console.error('Error fetching Hashnode posts:', err);
      setError('Failed to load blog posts. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHashnodePosts();
  }, []);

  // Load favorites from localStorage
  useEffect(() => {
    const savedFavorites = localStorage.getItem('blogFavorites');
    if (savedFavorites) {
      setFavorites(new Set(JSON.parse(savedFavorites)));
    }
  }, []);

  if (!mounted) {
    return null;
  }

  const isDark = theme === 'dark';

  // Toggle favorite
  const toggleFavorite = (postId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newFavorites = new Set(favorites);
    if (newFavorites.has(postId)) {
      newFavorites.delete(postId);
    } else {
      newFavorites.add(postId);
    }
    setFavorites(newFavorites);
    // You could save to localStorage here
    localStorage.setItem('blogFavorites', JSON.stringify([...newFavorites]));
  };

  if (loading) {
    return (
      <motion.div 
        className={`min-h-screen transition-colors duration-300 ${
          isDark ? 'bg-gray-900' : 'bg-gray-50'
        }`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <ModernNavbar />
        
        {/* Enhanced loading screen */}
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <motion.div
              className={`w-16 h-16 border-4 border-t-transparent rounded-full mx-auto mb-6 ${
                isDark ? 'border-blue-400' : 'border-blue-600'
              }`}
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            <motion.h2
              className={`text-2xl font-bold mb-2 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              Loading Blog Posts
            </motion.h2>
            <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Fetching latest articles from bakul.hashnode.dev...
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div 
        className={`min-h-screen transition-colors duration-300 ${
          isDark ? 'bg-gray-900' : 'bg-gray-50'
        }`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <ModernNavbar />
        
        <div className="flex items-center justify-center min-h-screen">
          <motion.div 
            className="text-center max-w-md mx-auto px-4"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${
              isDark ? 'bg-red-900/20 text-red-400' : 'bg-red-100 text-red-600'
            }`}>
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className={`text-2xl font-bold mb-4 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              Unable to Load Posts
            </h2>
            <p className={`mb-6 ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {error}
            </p>
            <motion.button
              onClick={fetchHashnodePosts}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                isDark
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              Try Again
            </motion.button>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className={`min-h-screen relative overflow-hidden transition-colors duration-500 ${
        isDark 
          ? 'bg-gradient-to-br from-gray-900 via-slate-900 to-black' 
          : 'bg-gradient-to-br from-white via-blue-50 to-purple-50'
      }`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      <ModernNavbar />
      
      {/* Scroll Progress Indicator */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500 origin-left z-50"
        style={{ scaleX }}
      />
      
      {/* Enhanced Background Effects */}
      <div className="fixed inset-0 -z-10">
        {/* Animated gradient background */}
        <motion.div
          className={`absolute inset-0 transition-opacity duration-1000 ${
            isDark 
              ? 'bg-gradient-to-br from-gray-900 via-slate-900 to-black' 
              : 'bg-gradient-to-br from-white via-blue-50 to-purple-50'
          }`}
          animate={{
            background: isDark 
              ? [
                  'radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.15) 0%, transparent 50%)',
                  'radial-gradient(circle at 80% 20%, rgba(147, 51, 234, 0.15) 0%, transparent 50%)',
                  'radial-gradient(circle at 40% 40%, rgba(59, 130, 246, 0.15) 0%, transparent 50%)'
                ]
              : [
                  'radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)',
                  'radial-gradient(circle at 80% 20%, rgba(147, 51, 234, 0.1) 0%, transparent 50%)',
                  'radial-gradient(circle at 40% 40%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)'
                ]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        
        {/* Floating particles */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className={`absolute w-2 h-2 rounded-full ${
              isDark ? 'bg-blue-400/20' : 'bg-blue-500/30'
            }`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [-30, 30],
              x: [-20, 20],
              opacity: [0.2, 0.8, 0.2],
              scale: [0.5, 1.5, 0.5],
            }}
            transition={{
              duration: 4 + Math.random() * 4,
              repeat: Infinity,
              delay: Math.random() * 2,
              ease: 'easeInOut',
            }}
          />
        ))}
        
        {/* Enhanced Floating Orbs */}
        <motion.div
          className={`absolute top-20 right-20 w-96 h-96 rounded-full blur-3xl ${
            isDark ? 'bg-blue-500/10' : 'bg-blue-500/20'
          }`}
          animate={{
            y: [0, -30, 0],
            x: [0, 20, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className={`absolute bottom-20 left-20 w-80 h-80 rounded-full blur-3xl ${
            isDark ? 'bg-purple-500/15' : 'bg-purple-500/25'
          }`}
          animate={{
            y: [0, 30, 0],
            x: [0, -20, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
        />
        
        {/* Grid Pattern */}
        <div className={`absolute inset-0 opacity-30 ${
          isDark 
            ? 'bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)]'
            : 'bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)]'
        } bg-[size:50px_50px]`} />
      </div>
      
      <div className="relative z-10 pt-16 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Enhanced Header Section */}
          <motion.div
            ref={headerRef}
            initial={{ opacity: 0, y: 50 }}
            animate={isHeaderInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="text-center mb-2 md:mb-4"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={isHeaderInView ? { scale: 1 } : {}}
              transition={{ duration: 0.5, delay: 0.2 }}
              className={`inline-flex items-center px-6 py-3 rounded-full border backdrop-blur-sm mb-4 md:mb-5 ${
                isDark
                  ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-blue-500/30'
                  : 'bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20'
              }`}
            >
              <SparklesIcon className={`w-5 h-5 mr-2 ${
                isDark ? 'text-blue-400' : 'text-blue-600'
              }`} />
              <span className={`font-medium ${
                isDark ? 'text-blue-300' : 'text-blue-700'
              }`}>Knowledge Sharing</span>
            </motion.div>
            
            <motion.h1
              className={`text-5xl sm:text-6xl lg:text-7xl font-black mb-3 md:mb-4 bg-gradient-to-r bg-clip-text text-transparent leading-tight ${
                isDark 
                  ? 'from-white via-blue-200 to-purple-200' 
                  : 'from-gray-900 via-blue-700 to-purple-700'
              }`}
              initial={{ opacity: 0, y: 30 }}
              animate={isHeaderInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.3 }}
              style={{
                filter: isDark 
                  ? 'drop-shadow(0 0 30px rgba(59, 130, 246, 0.3))' 
                  : 'drop-shadow(0 0 20px rgba(59, 130, 246, 0.2))',
              }}
            >
              My Blog
            </motion.h1>
            
            <motion.p
              className={`text-xl md:text-2xl max-w-4xl mx-auto leading-relaxed ${
                isDark ? 'text-gray-300' : 'text-gray-600'
              }`}
              initial={{ opacity: 0, y: 30 }}
              animate={isHeaderInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              Insights, tutorials, and stories from my journey in{' '}
              <span className={`font-semibold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                technology and programming
              </span>
            </motion.p>

            {/* Header ends here (stats moved below search) */}
          </motion.div>

          {/* Enhanced Search and Filter Section */}
          <motion.div
            className="mb-6 mt-0"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
              {/* Search Bar */}
              <div className="relative flex-1 max-w-md">
                <MagnifyingGlassIcon className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                  isDark ? 'text-gray-400' : 'text-gray-500'
                }`} />
                <input
                  type="text"
                  placeholder="Search articles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-12 pr-4 py-4 rounded-2xl backdrop-blur-sm border focus:outline-none focus:ring-2 transition-all duration-300 ${
                    isDark
                      ? 'bg-gray-900/50 border-gray-700/50 text-white placeholder-gray-400 focus:ring-blue-500/50 focus:border-blue-500/50'
                      : 'bg-white/50 border-gray-300/50 text-gray-900 placeholder-gray-500 focus:ring-blue-500/50 focus:border-blue-500/50'
                  }`}
                />
              </div>

              {/* Tag Filter */}
              <div className="flex items-center gap-4">
                <FunnelIcon className={`w-5 h-5 ${
                  isDark ? 'text-gray-400' : 'text-gray-500'
                }`} />
                <div className="flex flex-wrap gap-2">
                  <motion.button
                    onClick={() => setSelectedTag(null)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
                      selectedTag === null
                        ? isDark
                          ? 'bg-blue-600 text-white border border-blue-500'
                          : 'bg-blue-600 text-white border border-blue-500'
                        : isDark
                          ? 'bg-gray-800/50 text-gray-400 border border-gray-700/50 hover:border-gray-600/70'
                          : 'bg-gray-200/50 text-gray-600 border border-gray-300/50 hover:border-gray-400/70'
                    }`}
                  >
                    All
                  </motion.button>
                  {allTags.slice(0, 5).map((tag) => (
                    <motion.button
                      key={tag.slug}
                      onClick={() => setSelectedTag(tag.slug === selectedTag ? null : tag.slug)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
                        selectedTag === tag.slug
                          ? isDark
                            ? 'bg-purple-600 text-white border border-purple-500'
                            : 'bg-purple-600 text-white border border-purple-500'
                          : isDark
                            ? 'bg-gray-800/50 text-gray-400 border border-gray-700/50 hover:border-gray-600/70'
                            : 'bg-gray-200/50 text-gray-600 border border-gray-300/50 hover:border-gray-400/70'
                      }`}
                    >
                      {tag.name}
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>

            {/* Results Counter */}
            {(searchTerm || selectedTag) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mt-4 text-center ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}
              >
                Found {filteredPosts.length} article{filteredPosts.length !== 1 ? 's' : ''}
                {searchTerm && ` matching "${searchTerm}"`}
                {selectedTag && ` tagged with "${allTags.find(t => t.slug === selectedTag)?.name}"`}
              </motion.div>
            )}
          </motion.div>

          {/* Blog Stats (moved below search for tighter header spacing) */}
          <motion.div
            className="flex flex-wrap justify-center gap-6 mt-4 mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={isHeaderInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            {[
              { 
                label: 'Articles', 
                value: posts.length, 
                icon: BookOpenIcon,
                color: 'from-blue-500 to-cyan-500',
                gradient: isDark ? 'from-blue-400 to-cyan-400' : 'from-blue-600 to-cyan-600'
              },
              { 
                label: 'Total Views', 
                value: posts.reduce((sum, post) => sum + (post.views || 0), 0).toLocaleString(), 
                icon: EyeIcon,
                color: 'from-green-500 to-emerald-500',
                gradient: isDark ? 'from-green-400 to-emerald-400' : 'from-green-600 to-emerald-600'
              },
              { 
                label: 'Read Time', 
                value: `${posts.reduce((sum, post) => sum + (post.readTimeInMinutes || 0), 0)} min`, 
                icon: ClockIcon,
                color: 'from-purple-500 to-pink-500',
                gradient: isDark ? 'from-purple-400 to-pink-400' : 'from-purple-600 to-pink-600'
              }
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
                className={`text-center p-6 rounded-2xl backdrop-blur-sm border transition-all duration-300 hover:shadow-lg ${
                  isDark
                    ? 'bg-gray-900/50 border-gray-700/50 hover:border-gray-600/70'
                    : 'bg-white/50 border-gray-300/50 hover:border-gray-400/70'
                }`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={isHeaderInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.5, delay: 0.2 + index * 0.08 }}
              >
                <div className={`w-12 h-12 bg-gradient-to-r ${stat.color} rounded-xl flex items-center justify-center mx-auto mb-3`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <div className={`text-2xl font-bold bg-gradient-to-r bg-clip-text text-transparent ${stat.gradient}`}>
                  {stat.value}
                </div>
                <div className={`text-sm font-medium ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>

          {/* Enhanced Blog Posts Grid */}
          <AnimatePresence>
            {filteredPosts.length > 0 ? (
              <motion.div 
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.8 }}
              >
                {filteredPosts.map((post, index) => (
                  <motion.article
                    key={post.id}
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 + 0.9, duration: 0.6 }}
                    whileHover={{ y: -8, scale: 1.02 }}
                    className={`group cursor-pointer rounded-2xl overflow-hidden backdrop-blur-xl border transition-all duration-300 relative ${
                      isDark
                        ? 'bg-gray-900/50 border-gray-700/50 hover:border-gray-600/70 hover:bg-gray-800/60'
                        : 'bg-white/50 border-gray-300/50 hover:border-gray-400/70 hover:bg-white/80'
                    }`}
                  >
                    {/* Favorite Button */}
                    <motion.button
                      onClick={(e) => toggleFavorite(post.id, e)}
                      className={`absolute top-4 right-4 z-10 w-10 h-10 rounded-full backdrop-blur-sm border flex items-center justify-center transition-all duration-300 ${
                        favorites.has(post.id)
                          ? 'bg-red-500/20 border-red-500/30 text-red-400'
                          : isDark
                            ? 'bg-gray-900/50 border-gray-700/50 text-gray-400 hover:text-red-400 hover:border-red-500/30'
                            : 'bg-white/50 border-gray-300/50 text-gray-500 hover:text-red-500 hover:border-red-300/50'
                      }`}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 + 1.2 }}
                    >
                      <HeartIcon className={`w-5 h-5 ${
                        favorites.has(post.id) ? 'fill-current' : ''
                      }`} />
                    </motion.button>

                    <Link href={`/blog/${post.slug}`}>
                      {/* Cover Image */}
                      {post.coverImage?.url && (
                        <div className="relative h-48 overflow-hidden">
                          <motion.img
                            src={post.coverImage.url}
                            alt={post.title}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                            whileHover={{ scale: 1.1 }}
                          />
                          <div className={`absolute inset-0 ${
                            isDark 
                              ? 'bg-gradient-to-t from-gray-900/60 to-transparent' 
                              : 'bg-gradient-to-t from-black/20 to-transparent'
                          }`} />
                        </div>
                      )}
                      
                      <div className="p-6">
                        {/* Tags */}
                        <div className="flex flex-wrap gap-2 mb-4">
                          {post.tags.slice(0, 2).map((tag) => (
                            <motion.span
                              key={tag.slug}
                              whileHover={{ scale: 1.05 }}
                              className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-300 ${
                                isDark
                                  ? 'bg-purple-900/30 text-purple-400 border border-purple-800/30'
                                  : 'bg-purple-100 text-purple-600 border border-purple-200'
                              }`}
                            >
                              {tag.name}
                            </motion.span>
                          ))}
                        </div>
                        
                        {/* Title */}
                        <motion.h2
                          className={`text-xl font-bold mb-3 line-clamp-2 transition-colors ${
                            isDark 
                              ? 'text-white group-hover:text-blue-300' 
                              : 'text-gray-900 group-hover:text-blue-600'
                          }`}
                          whileHover={{ x: 5 }}
                          transition={{ duration: 0.2 }}
                        >
                          {post.title}
                        </motion.h2>
                        
                        {/* Brief */}
                        <p className={`mb-6 leading-relaxed line-clamp-3 ${
                          isDark ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          {post.brief}
                        </p>
                        
                        {/* Meta Information */}
                        <div className="space-y-3">
                          <div className={`flex items-center justify-between text-sm ${
                            isDark ? 'text-gray-500' : 'text-gray-500'
                          }`}>
                            <div className="flex items-center space-x-4">
                              <span className="flex items-center">
                                <CalendarIcon className="w-4 h-4 mr-1" />
                                {new Date(post.publishedAt).toLocaleDateString('en-US', { 
                                  month: 'short', 
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </span>
                              <span className="flex items-center">
                                <ClockIcon className="w-4 h-4 mr-1" />
                                {post.readTimeInMinutes} min
                              </span>
                            </div>
                            {post.views > 0 && (
                              <span className="flex items-center">
                                <EyeIcon className="w-4 h-4 mr-1" />
                                {post.views.toLocaleString()}
                              </span>
                            )}
                          </div>

                          {/* Read More Button */}
                          <motion.div
                            className={`flex items-center justify-between pt-3 border-t transition-colors ${
                              isDark ? 'border-gray-700/50' : 'border-gray-300/50'
                            }`}
                            whileHover={{ x: 5 }}
                          >
                            <span className={`font-medium transition-colors ${
                              isDark 
                                ? 'text-blue-400 group-hover:text-blue-300' 
                                : 'text-blue-600 group-hover:text-blue-700'
                            }`}>
                              Read Article
                            </span>
                            <motion.div
                              whileHover={{ x: 3 }}
                              transition={{ duration: 0.2 }}
                            >
                              <ArrowRightIcon className={`w-5 h-5 transition-colors ${
                                isDark 
                                  ? 'text-blue-400 group-hover:text-blue-300' 
                                  : 'text-blue-600 group-hover:text-blue-700'
                              }`} />
                            </motion.div>
                          </motion.div>
                        </div>
                      </div>
                    </Link>
                  </motion.article>
                ))}
              </motion.div>
            ) : (
              /* Enhanced Empty State */
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.8 }}
                className="text-center py-20"
              >
                <motion.div
                  className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 ${
                    isDark ? 'bg-gray-800/50' : 'bg-gray-200/50'
                  }`}
                  animate={{ 
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ duration: 4, repeat: Infinity }}
                >
                  <svg className={`w-12 h-12 ${
                    isDark ? 'text-gray-600' : 'text-gray-400'
                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </motion.div>
                <h3 className={`text-2xl font-bold mb-4 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  No Blog Posts Found
                </h3>
                <p className={`text-lg mb-6 ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Check back soon for new articles from bakul.hashnode.dev!
                </p>
                <motion.a
                  href="https://bakul.hashnode.dev"
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`inline-flex items-center px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                    isDark
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  Visit My Blog
                  <ArrowRightIcon className="w-5 h-5 ml-2" />
                </motion.a>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Back to Top Button */}
      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className={`fixed bottom-8 right-8 w-12 h-12 rounded-full backdrop-blur-sm border flex items-center justify-center transition-all duration-300 z-40 ${
              isDark
                ? 'bg-gray-900/80 border-gray-700/50 text-gray-300 hover:bg-gray-800/90 hover:border-gray-600/70'
                : 'bg-white/80 border-gray-300/50 text-gray-600 hover:bg-white/90 hover:border-gray-400/70'
            }`}
            whileHover={{ scale: 1.1, y: -2 }}
            whileTap={{ scale: 0.9 }}
            initial={{ opacity: 0, scale: 0, y: 100 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0, y: 100 }}
            transition={{ duration: 0.3 }}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
}