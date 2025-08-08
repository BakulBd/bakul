"use client";

import { PostEdge } from "./types";
import Link from "next/link";
import ReadingProgress from "../../components/reading-progress";
import Image from "next/image";
import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CalendarIcon, ClockIcon, UserIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";

import { Post } from "./types";

interface PostContentProps {
  post: Post;
  mdx: React.ReactNode;
}

export default function PostContent({ post, mdx }: PostContentProps) {
  const [mounted, setMounted] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const isDark = theme === 'dark';

  return (
    <motion.div 
      className={`min-h-screen transition-colors duration-500 relative ${
        isDark 
          ? 'bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white' 
          : 'bg-gradient-to-br from-white via-blue-50 to-purple-50 text-gray-900'
      }`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      {/* Enhanced Background Effects */}
      <div className="fixed inset-0 -z-10">
        <motion.div
          className={`absolute inset-0 transition-opacity duration-1000 ${
            isDark 
              ? 'bg-gradient-to-br from-gray-900 via-slate-900 to-black' 
              : 'bg-gradient-to-br from-white via-blue-50 to-purple-50'
          }`}
          animate={{
            background: isDark 
              ? [
                  'radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)',
                  'radial-gradient(circle at 80% 20%, rgba(147, 51, 234, 0.1) 0%, transparent 50%)',
                  'radial-gradient(circle at 40% 40%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)'
                ]
              : [
                  'radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.05) 0%, transparent 50%)',
                  'radial-gradient(circle at 80% 20%, rgba(147, 51, 234, 0.05) 0%, transparent 50%)',
                  'radial-gradient(circle at 40% 40%, rgba(59, 130, 246, 0.05) 0%, transparent 50%)'
                ]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="relative z-10 w-full max-w-none">
        <ReadingProgress />

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
          {/* Enhanced Back Navigation */}
          <motion.nav 
            className="mb-8"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Link
              href="/blog"
              className={`inline-flex items-center gap-3 px-4 py-2 rounded-xl backdrop-blur-sm border transition-all duration-300 hover:scale-105 ${
                isDark
                  ? 'bg-gray-900/50 border-gray-700/50 text-gray-300 hover:text-blue-400 hover:border-blue-500/50'
                  : 'bg-white/50 border-gray-300/50 text-gray-600 hover:text-blue-600 hover:border-blue-500/50'
              }`}
            >
              <ArrowLeftIcon className="w-5 h-5" />
              <span className="font-medium">Back to Blog</span>
            </Link>
          </motion.nav>

          <article className="w-full max-w-none">
            <motion.header 
              className="mb-12"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              {/* Enhanced Title */}
              <h1 className={`text-4xl md:text-5xl lg:text-6xl font-black mb-8 bg-gradient-to-r bg-clip-text text-transparent leading-tight ${
                isDark 
                  ? 'from-white via-blue-200 to-purple-200' 
                  : 'from-gray-900 via-blue-700 to-purple-700'
              }`}>
                {post.title}
              </h1>

              {/* Enhanced Cover Image */}
              {post.coverImage && (
                <motion.div 
                  className={`relative w-full mb-8 rounded-2xl overflow-hidden backdrop-blur-sm border ${
                    isDark ? 'border-gray-700/50' : 'border-gray-300/50'
                  }`}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <Image
                    src={post.coverImage.url}
                    alt={post.title}
                    width={1200}
                    height={600}
                    className="w-full h-auto object-cover"
                    priority
                  />
                  <div className={`absolute inset-0 bg-gradient-to-t ${
                    isDark 
                      ? 'from-black/20 via-transparent to-transparent' 
                      : 'from-black/10 via-transparent to-transparent'
                  }`} />
                </motion.div>
              )}

              {/* Enhanced Subtitle */}
              {post.subtitle && (
                <motion.h2 
                  className={`text-xl md:text-2xl mb-8 leading-relaxed ${
                    isDark ? 'text-gray-300' : 'text-gray-600'
                  }`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                >
                  {post.subtitle}
                </motion.h2>
              )}

              {/* Enhanced Meta Information */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
              >
                <EnhancedBlogPostMeta post={{ node: post }} />
              </motion.div>
            </motion.header>

            {/* Enhanced Content */}
            <motion.div 
              className={`prose prose-lg max-w-none transition-colors duration-500 ${
                isDark 
                  ? 'prose-invert prose-slate prose-headings:text-white prose-p:text-gray-300 prose-strong:text-white prose-code:text-blue-400 prose-pre:bg-gray-800/50 prose-pre:border prose-pre:border-gray-700/50' 
                  : 'prose-slate prose-headings:text-gray-900 prose-p:text-gray-700 prose-strong:text-gray-900 prose-code:text-blue-600 prose-pre:bg-gray-100/50 prose-pre:border prose-pre:border-gray-300/50'
              } prose-headings:scroll-mt-20 prose-img:rounded-xl prose-img:shadow-lg prose-a:text-blue-500 hover:prose-a:text-blue-600 prose-blockquote:border-l-4 ${
                isDark ? 'prose-blockquote:border-blue-400' : 'prose-blockquote:border-blue-500'
              } prose-blockquote:pl-6 prose-blockquote:italic`}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              {mdx}
            </motion.div>
          </article>
        </div>
      </div>
    </motion.div>
  );
}

export function EnhancedBlogPostMeta({ post }: { post: PostEdge }) {
  const [mounted, setMounted] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const isDark = theme === 'dark';

  return (
    <div className={`flex flex-wrap items-center gap-6 p-6 rounded-2xl backdrop-blur-sm border transition-all duration-300 ${
      isDark
        ? 'bg-gray-900/30 border-gray-700/50'
        : 'bg-white/50 border-gray-300/50'
    }`}>
      {/* Author */}
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
          isDark ? 'bg-blue-500/20' : 'bg-blue-500/10'
        }`}>
          <UserIcon className={`w-5 h-5 ${
            isDark ? 'text-blue-400' : 'text-blue-600'
          }`} />
        </div>
        <div>
          <p className={`font-medium ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            {post.node.author?.name || 'Bakul Ahmed'}
          </p>
          <p className={`text-sm ${
            isDark ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Author
          </p>
        </div>
      </div>

      {/* Divider */}
      <div className={`w-px h-12 ${
        isDark ? 'bg-gray-700' : 'bg-gray-300'
      }`} />

      {/* Published Date */}
      {post.node.publishedAt && (
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            isDark ? 'bg-green-500/20' : 'bg-green-500/10'
          }`}>
            <CalendarIcon className={`w-5 h-5 ${
              isDark ? 'text-green-400' : 'text-green-600'
            }`} />
          </div>
          <div>
            <p className={`font-medium ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              {new Date(post.node.publishedAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
            <p className={`text-sm ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Published
            </p>
          </div>
        </div>
      )}

      {/* Divider */}
      <div className={`w-px h-12 ${
        isDark ? 'bg-gray-700' : 'bg-gray-300'
      }`} />

      {/* Read Time */}
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
          isDark ? 'bg-purple-500/20' : 'bg-purple-500/10'
        }`}>
          <ClockIcon className={`w-5 h-5 ${
            isDark ? 'text-purple-400' : 'text-purple-600'
          }`} />
        </div>
        <div>
          <p className={`font-medium ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            {post.node.readTimeInMinutes} minutes
          </p>
          <p className={`text-sm ${
            isDark ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Read time
          </p>
        </div>
      </div>
    </div>
  );
}

// Legacy component for backward compatibility
export function BlogPostMeta({ post }: { post: PostEdge }) {
  return <EnhancedBlogPostMeta post={post} />;
}
