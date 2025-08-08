'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import MinimalisticLoadingScreen from '@/components/MinimalisticLoadingScreen';
import ModernNavbar from '@/components/layout/ModernNavbar';
import { 
  ArrowTopRightOnSquareIcon,
  CalendarIcon,
  ClockIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

export default function Homepage() {
  const [showLoading, setShowLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Simplified data for CSE students perspective
  const skills = useMemo(() => [
    'React & Next.js',
    'Python & Django',
    'JavaScript & TypeScript',
    'MySQL & PostgreSQL',
    'Git & GitHub',
    'Problem Solving'
  ], []);

  const projects = useMemo(() => [
    {
      id: 1,
      title: 'University Management System',
      description: 'A complete web application for managing university courses, students, and grades built with Next.js and PostgreSQL.',
      tech: ['Next.js', 'PostgreSQL', 'Tailwind CSS'],
      category: 'Web Development',
      status: 'Completed'
    },
    {
      id: 2,
      title: 'Competitive Programming Tracker',
      description: 'Track and analyze performance across multiple competitive programming platforms with automated data collection.',
      tech: ['Python', 'API Integration', 'Data Visualization'],
      category: 'Data Analysis',
      status: 'In Progress'
    },
    {
      id: 3,
      title: 'Bangladesh Weather App',
      description: 'Real-time weather application for major cities in Bangladesh with Bengali language support.',
      tech: ['React', 'Weather API', 'PWA'],
      category: 'Mobile Development',
      status: 'Completed'
    }
  ], []);

  const blogPosts = useMemo(() => [
    {
      id: 1,
      title: 'Getting Started with Competitive Programming in Bangladesh',
      excerpt: 'A comprehensive guide for CSE students to start their competitive programming journey with local contest information.',
      date: '2024-12-15',
      readTime: '6 min read',
      views: '850',
      category: 'Programming'
    },
    {
      id: 2,
      title: 'Building Your First Web Application as a CSE Student',
      excerpt: 'Step-by-step tutorial for creating modern web applications using popular technologies taught in universities.',
      date: '2024-12-10',
      readTime: '8 min read',
      views: '1.2k',
      category: 'Web Development'
    }
  ], []);

  useEffect(() => {
    setMounted(true);
    const hasVisited = sessionStorage.getItem('hasVisited');
    if (!hasVisited) {
      sessionStorage.setItem('hasVisited', 'true');
      const timer = setTimeout(() => setShowLoading(false), 2500);
      return () => clearTimeout(timer);
    } else {
      setShowLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!showLoading && mounted) {
      setIsVisible(true);
    }
  }, [showLoading, mounted]);

  const handleLoadingComplete = useCallback(() => {
    setShowLoading(false);
  }, []);

  if (showLoading) {
    return <MinimalisticLoadingScreen onComplete={handleLoadingComplete} />;
  }

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 transition-colors duration-300">
      <ModernNavbar />
      
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            {/* Hero Section - Ultra Minimalistic & Stunning */}
            <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 min-h-screen flex items-center">
              {/* Gradient Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-white to-purple-50/50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 -z-10"></div>
              
              {/* Floating Elements */}
              <div className="absolute inset-0 overflow-hidden -z-10">
                <motion.div
                  animate={{ 
                    y: [0, -20, 0],
                    rotate: [0, 5, 0] 
                  }}
                  transition={{ 
                    duration: 6, 
                    repeat: Infinity, 
                    ease: "easeInOut" 
                  }}
                  className="absolute top-20 right-20 w-32 h-32 bg-blue-500/10 dark:bg-blue-500/20 rounded-full blur-xl"
                />
                <motion.div
                  animate={{ 
                    y: [0, 30, 0],
                    x: [0, -10, 0] 
                  }}
                  transition={{ 
                    duration: 8, 
                    repeat: Infinity, 
                    ease: "easeInOut" 
                  }}
                  className="absolute bottom-40 left-20 w-24 h-24 bg-purple-500/10 dark:bg-purple-500/20 rounded-full blur-xl"
                />
              </div>

              <div className="max-w-4xl mx-auto text-center relative z-10">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                >
                  {/* Profile Photo */}
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.1 }}
                    className="mb-8 flex justify-center"
                  >
                    <div className="relative">
                      <motion.div
                        animate={{ 
                          rotate: 360,
                          scale: [1, 1.05, 1]
                        }}
                        transition={{ 
                          rotate: { duration: 20, repeat: Infinity, ease: "linear" },
                          scale: { duration: 4, repeat: Infinity, ease: "easeInOut" }
                        }}
                        className="absolute -inset-3 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full blur-lg opacity-30"
                      />
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.3 }}
                        className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-full overflow-hidden border-4 border-white/20 dark:border-gray-800/20 shadow-2xl backdrop-blur-sm"
                      >
                        <Image
                          src="/Bakul.jpg"
                          alt="Bakul Ahmed - CSE Student"
                          fill
                          className="object-cover object-center"
                          priority
                          sizes="(max-width: 640px) 128px, 160px"
                        />
                      </motion.div>
                      {/* Online Status Indicator */}
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute bottom-2 right-2 w-6 h-6 bg-green-500 rounded-full border-3 border-white dark:border-gray-900 shadow-lg"
                      >
                        <div className="w-full h-full bg-green-400 rounded-full animate-ping opacity-75"></div>
                      </motion.div>
                    </div>
                  </motion.div>

                  {/* Badge */}
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="mb-8"
                  >
                    <span className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500/10 to-purple-500/10 dark:from-blue-500/20 dark:to-purple-500/20 border border-blue-200/50 dark:border-blue-800/50 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium backdrop-blur-sm">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                      CSE Student • Bangladesh 🇧🇩
                    </span>
                  </motion.div>
                  
                  {/* Main Heading */}
                  <motion.h1 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="text-4xl sm:text-5xl lg:text-7xl font-bold text-gray-900 dark:text-white mb-6 leading-[1.1] tracking-tight"
                  >
                    Hi, I&apos;m{' '}
                    <span className="relative inline-block">
                      <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                        Bakul Ahmed
                      </span>
                      <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute -inset-2 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 rounded-lg blur-lg -z-10"
                      />
                    </span>
                  </motion.h1>
                  
                  {/* Subtitle */}
                  <motion.p 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                    className="text-xl sm:text-2xl text-gray-600 dark:text-gray-400 mb-10 max-w-3xl mx-auto leading-relaxed font-light"
                  >
                    Crafting digital experiences with{' '}
                    <span className="text-blue-600 dark:text-blue-400 font-medium">code</span>,{' '}
                    <span className="text-purple-600 dark:text-purple-400 font-medium">creativity</span>, and{' '}
                    <span className="text-pink-600 dark:text-pink-400 font-medium">passion</span>
                  </motion.p>

                  {/* CTA Buttons */}
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.8 }}
                    className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
                  >
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Link href="/projects">
                        <button className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300">
                          <span className="relative z-10">View My Work</span>
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                            whileHover={{ scale: 1.02 }}
                          />
                        </button>
                      </Link>
                    </motion.div>
                    
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Link href="/contact">
                        <button className="px-8 py-4 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl font-medium transition-all duration-300 backdrop-blur-sm">
                          Let&apos;s Connect
                        </button>
                      </Link>
                    </motion.div>
                  </motion.div>

                  {/* Tech Stack */}
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 1.0 }}
                    className="max-w-3xl mx-auto"
                  >
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 font-medium uppercase tracking-wider">
                      Technologies I Love
                    </p>
                    <div className="flex flex-wrap justify-center gap-3">
                      {skills.slice(0, 4).map((skill, index) => (
                        <motion.span
                          key={skill}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.5, delay: 1.2 + index * 0.1 }}
                          whileHover={{ scale: 1.1, y: -2 }}
                          className="px-4 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm font-medium shadow-sm hover:shadow-md transition-all duration-300"
                        >
                          {skill}
                        </motion.span>
                      ))}
                    </div>
                  </motion.div>
                </motion.div>
              </div>

              {/* Scroll Indicator */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
                className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
              >
                <motion.div
                  animate={{ y: [0, 10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-6 h-10 border-2 border-gray-400 dark:border-gray-600 rounded-full flex justify-center"
                >
                  <motion.div
                    animate={{ y: [0, 12, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-1 h-3 bg-gray-400 dark:bg-gray-600 rounded-full mt-2"
                  />
                </motion.div>
              </motion.div>
            </section>

            {/* Projects Section - Minimalistic */}
            <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-slate-800/50">
              <div className="max-w-6xl mx-auto">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="text-center mb-12"
                >
                  <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                    Featured Projects
                  </h2>
                  <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                    Projects I&apos;ve built during my journey as a CSE student
                  </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {projects.map((project, index) => (
                    <motion.div
                      key={project.id}
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ y: -5 }}
                      className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-xs font-medium">
                          {project.category}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          project.status === 'Completed' 
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                            : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'
                        }`}>
                          {project.status}
                        </span>
                      </div>
                      
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                        {project.title}
                      </h3>
                      
                      <p className="text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
                        {project.description}
                      </p>
                      
                      <div className="flex flex-wrap gap-2 mb-4">
                        {project.tech.map((tech) => (
                          <span
                            key={tech}
                            className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded text-xs"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                      
                      <button className="flex items-center text-blue-600 dark:text-blue-400 font-medium hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
                        View Details
                        <ArrowTopRightOnSquareIcon className="w-4 h-4 ml-1" />
                      </button>
                    </motion.div>
                  ))}
                </div>

                <div className="text-center mt-10">
                  <Link href="/projects">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="px-6 py-3 border border-blue-600 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white rounded-lg font-medium transition-colors"
                    >
                      View All Projects
                    </motion.button>
                  </Link>
                </div>
              </div>
            </section>

            {/* Blog Section - Minimalistic */}
            <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white dark:bg-slate-900">
              <div className="max-w-6xl mx-auto">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="text-center mb-12"
                >
                  <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                    Latest Articles
                  </h2>
                  <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                    Sharing knowledge and experiences from my CSE journey
                  </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {blogPosts.map((post, index) => (
                    <motion.article
                      key={post.id}
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ y: -5 }}
                      className="bg-gray-50 dark:bg-slate-800 rounded-xl p-6 hover:shadow-lg transition-all duration-300"
                    >
                      <div className="mb-4">
                        <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full text-xs font-medium">
                          {post.category}
                        </span>
                      </div>
                      
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer">
                        {post.title}
                      </h3>
                      
                      <p className="text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
                        {post.excerpt}
                      </p>
                      
                      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center space-x-4">
                          <span className="flex items-center">
                            <CalendarIcon className="w-4 h-4 mr-1" />
                            {new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                          <span className="flex items-center">
                            <ClockIcon className="w-4 h-4 mr-1" />
                            {post.readTime}
                          </span>
                        </div>
                        <span className="flex items-center">
                          <EyeIcon className="w-4 h-4 mr-1" />
                          {post.views}
                        </span>
                      </div>
                    </motion.article>
                  ))}
                </div>

                <div className="text-center mt-10">
                  <Link href="/blog">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="px-6 py-3 border border-purple-600 text-purple-600 dark:text-purple-400 hover:bg-purple-600 hover:text-white dark:hover:bg-purple-600 dark:hover:text-white rounded-lg font-medium transition-colors"
                    >
                      Read All Articles
                    </motion.button>
                  </Link>
                </div>
              </div>
            </section>

            {/* Simple Contact CTA */}
            <section className="py-16 px-4 sm:px-6 lg:px-8 bg-blue-600 dark:bg-blue-700">
              <div className="max-w-4xl mx-auto text-center">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                >
                  <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                    Let&apos;s Connect
                  </h2>
                  <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
                    Always excited to collaborate on new projects or discuss technology
                  </p>
                  <Link href="/contact">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="px-8 py-4 bg-white text-blue-600 hover:bg-gray-100 rounded-lg font-semibold transition-colors shadow-lg"
                    >
                      Get in Touch
                    </motion.button>
                  </Link>
                </motion.div>
              </div>
            </section>

            {/* Simple Footer */}
            <footer className="py-8 px-4 sm:px-6 lg:px-8 bg-gray-900 dark:bg-slate-950 text-white">
              <div className="max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row items-center justify-between">
                  <div className="flex items-center space-x-3 mb-4 md:mb-0">
                    <div className="relative w-8 h-8 rounded-full overflow-hidden border-2 border-gray-600">
                      <Image
                        src="/Bakul.jpg"
                        alt="Bakul Ahmed"
                        fill
                        className="object-cover object-center"
                        sizes="32px"
                      />
                    </div>
                    <span className="font-semibold">Bakul Ahmed</span>
                  </div>
                  <div className="flex items-center space-x-6 text-sm">
                    <a 
                      href="https://github.com/bakul3014" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      GitHub
                    </a>
                    <a 
                      href="https://linkedin.com/in/cyberbokul" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      LinkedIn
                    </a>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-800 text-center text-gray-400 text-sm">
                  <p>&copy; 2024 Bakul Ahmed. CSE Student, Bangladesh.</p>
                </div>
              </div>
            </footer>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
