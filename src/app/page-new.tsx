'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import MinimalisticLoadingScreen from '@/components/MinimalisticLoadingScreen';
import ModernNavbar from '@/components/layout/ModernNavbar';

export default function Homepage() {
  const [showLoading, setShowLoading] = useState(true);
  // const [isVisible, setIsVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Simplified data for CSE students perspective
  const skills = useMemo(() => [
    'React & Next.js',
    'Python & Django',
    'JavaScript & TypeScript',
    'MySQL & PostgreSQL'
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

  // useEffect(() => {
  //   if (!showLoading && mounted) {
  //     setIsVisible(true);
  //   }
  // }, [showLoading, mounted]);

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
    <div className="h-screen overflow-hidden bg-black text-white relative">
      <ModernNavbar />
      
      {/* Liquid Background Animation */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Animated Gradient Blobs */}
        <motion.div
          animate={{ 
            x: [0, 100, 0],
            y: [0, -50, 0],
            scale: [1, 1.2, 1] 
          }}
          transition={{ 
            duration: 20, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
          className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-purple-500/30 to-pink-500/30 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ 
            x: [0, -80, 0],
            y: [0, 60, 0],
            scale: [1, 0.8, 1] 
          }}
          transition={{ 
            duration: 25, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
          className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-blue-500/30 to-cyan-500/30 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ 
            x: [0, 50, 0],
            y: [0, -30, 0],
            scale: [1, 1.1, 1] 
          }}
          transition={{ 
            duration: 15, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-full blur-3xl"
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 h-full flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center h-full py-20">
            
            {/* Left Side - Hero Content */}
            <div className="lg:col-span-7 text-center lg:text-left">
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                {/* Badge */}
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="mb-6"
                >
                  <span className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-full text-sm font-medium">
                    <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
                    CSE Student • Bangladesh 🇧🇩
                  </span>
                </motion.div>
                
                {/* Main Heading */}
                <motion.h1 
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  className="text-4xl sm:text-5xl lg:text-7xl font-bold mb-6 leading-[1.1] tracking-tight"
                >
                  Hi, I&apos;m{' '}
                  <span className="relative inline-block">
                    <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                      Bakul Ahmed
                    </span>
                    <motion.div
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute -inset-2 bg-gradient-to-r from-blue-400/20 via-purple-400/20 to-pink-400/20 rounded-lg blur-lg -z-10"
                    />
                  </span>
                </motion.h1>
                
                {/* Subtitle */}
                <motion.p 
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                  className="text-xl sm:text-2xl text-gray-300 mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed"
                >
                  Crafting digital experiences with{' '}
                  <span className="text-blue-400 font-semibold">code</span>,{' '}
                  <span className="text-purple-400 font-semibold">creativity</span>, and{' '}
                  <span className="text-pink-400 font-semibold">passion</span>
                </motion.p>

                {/* CTA Buttons */}
                <motion.div 
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.7 }}
                  className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8"
                >
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Link href="/projects">
                      <button className="group relative px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-semibold overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300">
                        <span className="relative z-10">View My Work</span>
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        />
                      </button>
                    </Link>
                  </motion.div>
                  
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Link href="/contact">
                      <button className="px-8 py-4 border-2 border-white/30 text-white hover:bg-white/10 rounded-xl font-semibold transition-all duration-300 backdrop-blur-md">
                        Let&apos;s Connect
                      </button>
                    </Link>
                  </motion.div>
                </motion.div>

                {/* Tech Stack Pills */}
                <motion.div 
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.9 }}
                  className="flex flex-wrap gap-3 justify-center lg:justify-start"
                >
                  {skills.map((skill, index) => (
                    <motion.span
                      key={skill}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5, delay: 1.1 + index * 0.1 }}
                      whileHover={{ scale: 1.1, y: -2 }}
                      className="px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-full text-sm font-medium hover:bg-white/20 transition-all duration-300"
                    >
                      {skill}
                    </motion.span>
                  ))}
                </motion.div>
              </motion.div>
            </div>

            {/* Right Side - Profile & Quick Info */}
            <div className="lg:col-span-5 flex flex-col items-center space-y-6">
              
              {/* Profile Image */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="relative"
              >
                <div className="relative w-48 h-48 sm:w-56 sm:h-56">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/50 via-purple-500/50 to-pink-500/50 blur-sm"
                  />
                  <Image
                    src="/Bakul.jpg"
                    alt="Bakul Ahmed"
                    width={224}
                    height={224}
                    className="relative z-10 w-full h-full object-cover rounded-full border-4 border-white/20 backdrop-blur-md shadow-2xl"
                    priority
                  />
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 blur-xl -z-10"
                  />
                </div>
              </motion.div>

              {/* Quick Stats Cards */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="grid grid-cols-2 gap-4 w-full max-w-sm"
              >
                <motion.div
                  whileHover={{ scale: 1.05, y: -2 }}
                  className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 text-center"
                >
                  <div className="text-2xl font-bold text-blue-400">10+</div>
                  <div className="text-sm text-gray-300">Projects</div>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05, y: -2 }}
                  className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 text-center"
                >
                  <div className="text-2xl font-bold text-purple-400">3+</div>
                  <div className="text-sm text-gray-300">Years</div>
                </motion.div>
              </motion.div>

              {/* Quick Links */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.8 }}
                className="flex space-x-4"
              >
                {[
                  { name: 'Projects', href: '/projects', icon: '💼' },
                  { name: 'Blog', href: '/blog', icon: '📝' },
                  { name: 'About', href: '/about', icon: '👨‍💻' },
                ].map((link) => (
                  <Link key={link.name} href={link.href}>
                    <motion.div
                      whileHover={{ scale: 1.1, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex flex-col items-center p-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl hover:bg-white/20 transition-all duration-300"
                    >
                      <span className="text-2xl mb-1">{link.icon}</span>
                      <span className="text-xs text-gray-300">{link.name}</span>
                    </motion.div>
                  </Link>
                ))}
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent pointer-events-none" />
    </div>
  );
}
