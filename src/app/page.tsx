'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function HomePage() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX - window.innerWidth / 2) / 80,
        y: (e.clientY - window.innerHeight / 2) / 80,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white flex items-center justify-center relative overflow-hidden -mt-16 lg:-mt-20">
      {/* Enhanced animated background with depth */}
      <motion.div
        className="absolute inset-0 opacity-40"
        animate={{
          background: [
            'radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(139, 92, 246, 0.05) 0%, transparent 50%)',
            'radial-gradient(circle at 80% 20%, rgba(59, 130, 246, 0.1) 0%, transparent 50%), radial-gradient(circle at 20% 80%, rgba(139, 92, 246, 0.05) 0%, transparent 50%)',
            'radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.08) 0%, transparent 50%), radial-gradient(circle at 50% 50%, rgba(139, 92, 246, 0.03) 0%, transparent 50%)',
          ],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Sophisticated floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${2 + Math.random() * 3}px`,
              height: `${2 + Math.random() * 3}px`,
              background: i % 3 === 0 ? 'rgba(59, 130, 246, 0.3)' : i % 3 === 1 ? 'rgba(139, 92, 246, 0.3)' : 'rgba(255, 255, 255, 0.2)',
            }}
            animate={{
              y: [-30, 30],
              x: [-20, 20],
              opacity: [0.2, 0.8, 0.2],
              scale: [0.5, 1.2, 0.5],
            }}
            transition={{
              duration: 4 + Math.random() * 3,
              repeat: Infinity,
              delay: Math.random() * 3,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* Cursor-following spotlight effect */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle 300px at ${mousePosition.x * 20 + 50}% ${mousePosition.y * 20 + 50}%, rgba(59, 130, 246, 0.05) 0%, transparent 70%)`,
        }}
        transition={{ type: 'spring', stiffness: 50, damping: 30 }}
      />

      {/* Main content */}
      <motion.div
        className="text-center z-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto"
        style={{
          transform: `translate(${mousePosition.x}px, ${mousePosition.y}px)`,
        }}
        transition={{ type: 'spring', stiffness: 50, damping: 15 }}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
      >
        {/* Name headline */}
        <motion.h1
          className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-bold mb-8 tracking-tight"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: 'easeOut' }}
        >
          <motion.span
            className="inline-block bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent"
            whileHover={{ 
              scale: 1.02,
              backgroundImage: 'linear-gradient(45deg, #ffffff, #60a5fa, #3b82f6, #ffffff)',
            }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            Bakul Ahmed
          </motion.span>
        </motion.h1>

        {/* Subtitle */}
        <motion.div
          className="mb-12 sm:mb-16 space-y-4"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4, ease: 'easeOut' }}
        >
          <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl text-gray-200 font-light leading-relaxed">
            Premium Website Developer
          </p>
          <p className="text-lg sm:text-xl md:text-2xl text-gray-300 font-extralight">
            & Digital Experience Creator
          </p>
          <motion.p 
            className="text-base sm:text-lg text-gray-400 mt-6 max-w-2xl mx-auto leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            Crafting exceptional web solutions with cutting-edge technologies,
            <br className="hidden sm:block" />
            turning visionary ideas into stunning digital realities
          </motion.p>
        </motion.div>

        {/* Call-to-action button */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6, ease: 'easeOut' }}
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-block"
          >
            <Link
              href="/projects"
              className="group relative inline-flex items-center justify-center px-8 sm:px-12 py-4 sm:py-5 text-base sm:text-lg font-semibold text-black bg-white rounded-full transition-all duration-300 hover:bg-gray-100 hover:shadow-2xl hover:shadow-white/25"
            >
              <span className="relative z-10">View Projects</span>
              
              {/* Button glow effect */}
              <motion.div
                className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-20 blur-xl"
                whileHover={{ scale: 1.2 }}
                transition={{ duration: 0.3 }}
              />
              
              {/* Enhanced arrow animation */}
              <motion.svg
                className="ml-2 sm:ml-3 w-5 h-5 sm:w-6 sm:h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                whileHover={{ x: 5 }}
                transition={{ duration: 0.2 }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </motion.svg>
            </Link>
          </motion.div>
        </motion.div>

        {/* Quick access links */}
        <motion.div
          className="mt-12 sm:mt-16 flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-8 text-sm text-gray-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1, ease: 'easeOut' }}
        >
          <motion.a
            href="/about"
            className="relative hover:text-white transition-colors duration-300 group"
            whileHover={{ y: -2 }}
            transition={{ duration: 0.2 }}
          >
            <span className="relative z-10 border-b border-transparent group-hover:border-white transition-all duration-300">
              About Me
            </span>
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg opacity-0 group-hover:opacity-100 blur-sm -z-10"
              whileHover={{ scale: 1.2 }}
              transition={{ duration: 0.3 }}
            />
          </motion.a>
          
          <motion.a
            href="/contact"
            className="relative hover:text-white transition-colors duration-300 group"
            whileHover={{ y: -2 }}
            transition={{ duration: 0.2 }}
          >
            <span className="relative z-10 border-b border-transparent group-hover:border-white transition-all duration-300">
              Get In Touch
            </span>
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg opacity-0 group-hover:opacity-100 blur-sm -z-10"
              whileHover={{ scale: 1.2 }}
              transition={{ duration: 0.3 }}
            />
          </motion.a>
          
          <motion.a
            href="/cv/Bakul_Ahmed_CV.pdf"
            download="Bakul_Ahmed_CV.pdf"
            className="relative hover:text-white transition-colors duration-300 group"
            whileHover={{ y: -2 }}
            transition={{ duration: 0.2 }}
          >
            <span className="relative z-10 border-b border-transparent group-hover:border-white transition-all duration-300">
              📄 Download CV
            </span>
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-lg opacity-0 group-hover:opacity-100 blur-sm -z-10"
              whileHover={{ scale: 1.2 }}
              transition={{ duration: 0.3 }}
            />
          </motion.a>
        </motion.div>
      </motion.div>

      {/* Enhanced scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 1.5 }}
      >
        <motion.div
          className="w-6 h-10 border-2 border-white/40 rounded-full flex justify-center backdrop-blur-sm"
          whileHover={{ scale: 1.1, borderColor: 'rgba(255, 255, 255, 0.8)' }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="w-1 h-3 bg-gradient-to-b from-white to-blue-400 rounded-full mt-2"
            animate={{ y: [0, 12, 0] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </motion.div>
        
        {/* Scroll text */}
        <motion.p
          className="text-xs text-gray-500 mt-2 text-center font-light tracking-wider"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 2 }}
        >
          SCROLL
        </motion.p>
      </motion.div>
    </div>
  );
}
