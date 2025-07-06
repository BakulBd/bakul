'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function HomePage() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Reduce parallax effect on smaller screens to prevent overlaps
      const isMobile = window.innerWidth < 768;
      const divisor = isMobile ? 200 : 120; // Much less movement on mobile
      
      setMousePosition({
        x: (e.clientX - window.innerWidth / 2) / divisor,
        y: (e.clientY - window.innerHeight / 2) / divisor,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white flex items-center justify-center relative overflow-hidden -mt-16 lg:-mt-20 py-4 sm:py-8">
      {/* Enhanced animated background with depth */}
      <motion.div
        className="absolute inset-0 opacity-30 sm:opacity-40"
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
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${1 + Math.random() * 2}px`,
              height: `${1 + Math.random() * 2}px`,
              background: i % 3 === 0 ? 'rgba(59, 130, 246, 0.4)' : i % 3 === 1 ? 'rgba(139, 92, 246, 0.4)' : 'rgba(255, 255, 255, 0.3)',
            }}
            animate={{
              y: [-20, 20],
              x: [-15, 15],
              opacity: [0.1, 0.6, 0.1],
              scale: [0.3, 1, 0.3],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
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
          transform: `translate(${mousePosition.x * 0.3}px, ${mousePosition.y * 0.3}px)`,
        }}
        transition={{ type: 'spring', stiffness: 50, damping: 15 }}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
      >
        {/* Name headline */}
        <motion.h1
          className="text-4xl xs:text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-bold mb-6 sm:mb-8 tracking-tight leading-none"
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
          className="mb-8 sm:mb-12 md:mb-16 space-y-2 sm:space-y-4"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4, ease: 'easeOut' }}
        >
          <p className="text-lg xs:text-xl sm:text-2xl md:text-3xl lg:text-4xl text-gray-200 font-light leading-tight">
            Premium Website Developer
          </p>
          <p className="text-base xs:text-lg sm:text-xl md:text-2xl text-gray-300 font-extralight">
            & Digital Experience Creator
          </p>
          <motion.p 
            className="text-sm xs:text-base sm:text-lg text-gray-400 mt-4 sm:mt-6 max-w-xs xs:max-w-md sm:max-w-2xl mx-auto leading-relaxed px-2 sm:px-0"
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
          className="mb-8 sm:mb-12"
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-block"
          >
            <Link
              href="/projects"
              className="group relative inline-flex items-center justify-center px-6 xs:px-8 sm:px-12 py-3 xs:py-4 sm:py-5 text-sm xs:text-base sm:text-lg font-semibold text-black bg-white rounded-full transition-all duration-300 hover:bg-gray-100 hover:shadow-2xl hover:shadow-white/25 min-w-[160px] xs:min-w-[180px] sm:min-w-[200px]"
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
                className="ml-2 sm:ml-3 w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6"
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
          className="mt-8 sm:mt-12 md:mt-16 flex flex-col xs:flex-row items-center justify-center gap-4 xs:gap-6 sm:gap-8 text-xs xs:text-sm text-gray-400 flex-wrap"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1, ease: 'easeOut' }}
        >
          <motion.a
            href="/about"
            className="relative hover:text-white transition-colors duration-300 group px-2 py-1"
            whileHover={{ y: -2 }}
            transition={{ duration: 0.2 }}
          >
            <span className="relative z-10 border-b border-transparent group-hover:border-white transition-all duration-300 whitespace-nowrap">
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
            className="relative hover:text-white transition-colors duration-300 group px-2 py-1"
            whileHover={{ y: -2 }}
            transition={{ duration: 0.2 }}
          >
            <span className="relative z-10 border-b border-transparent group-hover:border-white transition-all duration-300 whitespace-nowrap">
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
            className="relative hover:text-white transition-colors duration-300 group px-2 py-1"
            whileHover={{ y: -2 }}
            transition={{ duration: 0.2 }}
          >
            <span className="relative z-10 border-b border-transparent group-hover:border-white transition-all duration-300 whitespace-nowrap">
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
        className="absolute bottom-6 sm:bottom-8 left-1/2 transform -translate-x-1/2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 1.5 }}
      >
        <motion.div
          className="w-5 h-8 sm:w-6 sm:h-10 border-2 border-white/40 rounded-full flex justify-center backdrop-blur-sm"
          whileHover={{ scale: 1.1, borderColor: 'rgba(255, 255, 255, 0.8)' }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="w-0.5 h-2 sm:w-1 sm:h-3 bg-gradient-to-b from-white to-blue-400 rounded-full mt-1.5 sm:mt-2"
            animate={{ y: [0, 8, 0] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </motion.div>
        
        {/* Scroll text */}
        <motion.p
          className="text-[10px] xs:text-xs text-gray-500 mt-2 text-center font-light tracking-wider"
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
