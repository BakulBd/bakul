'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function HomePage() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const isMobile = window.innerWidth < 768;
      const divisor = isMobile ? 300 : 150; // Reduced for smoother performance
      
      setMousePosition({
        x: (e.clientX - window.innerWidth / 2) / divisor,
        y: (e.clientY - window.innerHeight / 2) / divisor,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center relative overflow-hidden">
      {/* Optimized animated background */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute inset-0"
          animate={{
            background: [
              'radial-gradient(circle at 25% 25%, rgba(59, 130, 246, 0.08) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(139, 92, 246, 0.06) 0%, transparent 50%)',
              'radial-gradient(circle at 75% 25%, rgba(139, 92, 246, 0.08) 0%, transparent 50%), radial-gradient(circle at 25% 75%, rgba(236, 72, 153, 0.06) 0%, transparent 50%)',
              'radial-gradient(circle at 50% 50%, rgba(236, 72, 153, 0.08) 0%, transparent 50%), radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.06) 0%, transparent 50%)',
            ],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>

      {/* Simplified floating elements for performance */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full opacity-40"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              background: i % 2 === 0 ? '#3b82f6' : '#8b5cf6',
            }}
            animate={{
              y: [-30, 30],
              opacity: [0.2, 0.6, 0.2],
              scale: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 4 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* Cursor interaction effect */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle 400px at ${mousePosition.x * 30 + 50}% ${mousePosition.y * 30 + 50}%, rgba(59, 130, 246, 0.04) 0%, transparent 70%)`,
        }}
        transition={{ type: 'spring', stiffness: 100, damping: 30 }}
      />

      {/* Main content */}
      <motion.div
        className="text-center z-10 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto relative"
        style={{
          transform: `translate3d(${mousePosition.x * 0.3}px, ${mousePosition.y * 0.3}px, 0)`,
        }}
        transition={{ type: 'spring', stiffness: 50, damping: 15 }}
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        viewport={{ once: true }}
      >
        {/* Enhanced name headline */}
        <motion.div
          className="mb-8 sm:mb-12 md:mb-16"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        >
          <motion.h1
            className="text-5xl xs:text-6xl sm:text-7xl md:text-8xl lg:text-9xl xl:text-[10rem] font-black tracking-tighter leading-none relative"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <motion.span
              className="relative inline-block"
              style={{
                background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 25%, #e2e8f0 50%, #f8fafc 75%, #ffffff 100%)',
                backgroundSize: '400% 400%',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 0 40px rgba(255, 255, 255, 0.1))',
              }}
              animate={{
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              Bakul Ahmed
              
              {/* Animated underline */}
              <motion.div
                className="absolute -bottom-2 sm:-bottom-4 md:-bottom-6 left-0 h-1 sm:h-2 md:h-3 rounded-full"
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: '100%', opacity: 1 }}
                transition={{ duration: 2, delay: 1, ease: 'easeOut' }}
                style={{
                  background: 'linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899, #10b981)',
                  backgroundSize: '200% 100%',
                }}
              >
                <motion.div
                  className="absolute inset-0 rounded-full"
                  animate={{
                    backgroundPosition: ['0% 0%', '200% 0%'],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                  style={{
                    background: 'linear-gradient(90deg, rgba(59, 130, 246, 0.8), rgba(139, 92, 246, 0.8), rgba(236, 72, 153, 0.8), rgba(16, 185, 129, 0.8))',
                    backgroundSize: '200% 100%',
                  }}
                />
              </motion.div>
            </motion.span>
          </motion.h1>
        </motion.div>

        {/* Subtitle with better hierarchy */}
        <motion.div
          className="mb-12 sm:mb-16 md:mb-20 space-y-6"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4, ease: 'easeOut' }}
        >
          <motion.div
            className="space-y-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <motion.p 
              className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl text-gray-100 font-light leading-tight"
              whileHover={{ 
                color: '#60a5fa',
                textShadow: '0 0 20px rgba(96, 165, 250, 0.5)'
              }}
              transition={{ duration: 0.3 }}
            >
              Premium Website Developer
            </motion.p>
            <motion.p 
              className="text-xl xs:text-2xl sm:text-3xl md:text-4xl text-gray-200 font-extralight"
              whileHover={{ 
                color: '#a78bfa',
                textShadow: '0 0 20px rgba(167, 139, 250, 0.5)'
              }}
              transition={{ duration: 0.3 }}
            >
              & Digital Experience Creator
            </motion.p>
          </motion.div>
          
          <motion.p 
            className="text-lg xs:text-xl sm:text-2xl text-gray-300 mt-8 max-w-4xl mx-auto leading-relaxed font-light"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            Crafting exceptional web solutions with cutting-edge technologies,
            <br className="hidden sm:block" />
            turning visionary ideas into stunning digital realities
          </motion.p>
          
          {/* Stats */}
          <motion.div
            className="flex flex-wrap justify-center items-center gap-8 mt-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1 }}
          >
            {[
              { label: '5+ Years', desc: 'Experience' },
              { label: '50+ Projects', desc: 'Completed' },
              { label: '30+ Clients', desc: 'Worldwide' },
            ].map((stat, index) => (
              <motion.div
                key={index}
                className="text-center"
                whileHover={{ scale: 1.05, y: -2 }}
                transition={{ duration: 0.2 }}
              >
                <div className="text-lg sm:text-xl font-semibold text-blue-400">
                  {stat.label}
                </div>
                <div className="text-sm text-gray-400 font-light">
                  {stat.desc}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Enhanced CTA button */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.6, ease: 'easeOut' }}
          className="mb-16"
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-block relative group"
          >
            <Link
              href="/projects"
              className="relative inline-flex items-center justify-center px-16 py-6 text-xl font-bold text-black bg-white rounded-full transition-all duration-500 hover:bg-gray-50 min-w-[320px] overflow-hidden"
              style={{
                boxShadow: '0 20px 60px rgba(255, 255, 255, 0.15), 0 0 120px rgba(59, 130, 246, 0.2)',
              }}
            >
              {/* Animated background */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-white via-blue-50 to-white opacity-0 group-hover:opacity-100"
                transition={{ duration: 0.3 }}
              />
              
              {/* Content */}
              <span className="relative z-10 mr-4">View Projects</span>
              
              {/* Arrow with trail effect */}
              <motion.div className="relative z-10">
                <motion.svg
                  className="w-7 h-7"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  whileHover={{ x: 6 }}
                  transition={{ duration: 0.3, type: 'spring', stiffness: 200 }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </motion.svg>
              </motion.div>
              
              {/* Glow effect */}
              <motion.div
                className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-40 blur-2xl -z-10"
                whileHover={{ scale: 1.4 }}
                transition={{ duration: 0.4 }}
              />
            </Link>
          </motion.div>
        </motion.div>

        {/* Clean navigation links */}
        <motion.div
          className="flex flex-wrap items-center justify-center gap-8 text-gray-300"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.8 }}
        >
          {[
            { href: '/about', label: 'About Me', icon: '👨‍💻' },
            { href: '/contact', label: 'Get In Touch', icon: '💬' },
            { href: '/cv/Bakul_Ahmed_CV.pdf', label: 'Download CV', icon: '📄', download: true },
          ].map((link, index) => (
            <motion.a
              key={index}
              href={link.href}
              download={link.download ? 'Bakul_Ahmed_CV.pdf' : undefined}
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 hover:text-white hover:bg-white/5"
              whileHover={{ y: -2, scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              <span className="text-lg">{link.icon}</span>
              <span className="font-medium">{link.label}</span>
            </motion.a>
          ))}
        </motion.div>
      </motion.div>

      {/* Minimalist scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 2 }}
      >
        <motion.div
          className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center"
          whileHover={{ borderColor: 'rgba(255, 255, 255, 0.6)' }}
        >
          <motion.div
            className="w-1 h-3 bg-white rounded-full mt-2"
            animate={{ y: [0, 12, 0] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </motion.div>
        <motion.p
          className="text-xs text-gray-400 mt-3 tracking-wider"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          SCROLL
        </motion.p>
      </motion.div>
    </div>
  );
}
