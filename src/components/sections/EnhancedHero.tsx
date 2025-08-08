'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowDownIcon, 
  SparklesIcon, 
  CodeBracketIcon, 
  PaintBrushIcon,
  LightBulbIcon,
  RocketLaunchIcon
} from '@heroicons/react/24/outline';

export default function EnhancedHero() {
  const [currentSkill, setCurrentSkill] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const skills = [
    { text: 'Full Stack Developer', icon: CodeBracketIcon, color: 'from-blue-500 to-cyan-500' },
    { text: 'UI/UX Designer', icon: PaintBrushIcon, color: 'from-purple-500 to-pink-500' },
    { text: 'Problem Solver', icon: LightBulbIcon, color: 'from-yellow-500 to-orange-500' },
    { text: 'Digital Innovator', icon: RocketLaunchIcon, color: 'from-green-500 to-emerald-500' },
  ];

  const socialLinks = [
    { name: 'GitHub', href: 'https://github.com/bakul3014', color: 'hover:text-gray-900 dark:hover:text-white' },
    { name: 'LinkedIn', href: 'https://linkedin.com/in/cyberbokul', color: 'hover:text-blue-600' },
    { name: 'Twitter', href: 'https://twitter.com/cyberbokul', color: 'hover:text-blue-400' },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSkill((prev) => (prev + 1) % skills.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [skills.length]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const currentSkillData = skills[currentSkill];
  const CurrentIcon = currentSkillData.icon;

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Floating Orbs */}
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-64 h-64 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full blur-3xl"
            animate={{
              x: [0, 100, 0],
              y: [0, -100, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 8 + i * 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{
              left: `${10 + i * 20}%`,
              top: `${20 + i * 15}%`,
            }}
          />
        ))}

        {/* Interactive Cursor Effect */}
        <motion.div
          className="absolute w-96 h-96 bg-gradient-to-r from-purple-500/5 to-pink-500/5 rounded-full blur-3xl pointer-events-none"
          style={{
            left: mousePosition.x - 192,
            top: mousePosition.y - 192,
          }}
          transition={{ type: "spring", damping: 30, stiffness: 100 }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-4xl mx-auto">
          {/* Avatar */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.2 }}
            className="mb-8"
          >
            <div className="relative mx-auto w-32 h-32 sm:w-40 sm:h-40">
              <motion.div
                className="w-full h-full rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600 flex items-center justify-center text-white text-4xl sm:text-5xl font-bold shadow-2xl"
                whileHover={{ 
                  scale: 1.1,
                  boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                BA
                {/* Glow Effect */}
                <motion.div
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 opacity-20 blur-xl"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </motion.div>
            </div>
          </motion.div>

          {/* Main Heading */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-6"
          >
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white mb-4">
              Hi, I&apos;m{' '}
              <motion.span
                className="bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-clip-text text-transparent"
                animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                Bakul Ahmed
              </motion.span>
            </h1>
          </motion.div>

          {/* Dynamic Skills */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mb-8 h-20 flex items-center justify-center"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSkill}
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.8 }}
                transition={{ duration: 0.5 }}
                className="flex items-center space-x-3"
              >
                <motion.div
                  className={`p-3 rounded-full bg-gradient-to-r ${currentSkillData.color}`}
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <CurrentIcon className="w-6 h-6 text-white" />
                </motion.div>
                <span className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-gray-800 dark:text-gray-200">
                  {currentSkillData.text}
                </span>
                <SparklesIcon className="w-6 h-6 text-yellow-500 animate-pulse" />
              </motion.div>
            </AnimatePresence>
          </motion.div>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="text-lg sm:text-xl lg:text-2xl text-gray-600 dark:text-gray-400 mb-10 max-w-3xl mx-auto leading-relaxed"
          >
            Crafting digital experiences that blend{' '}
            <span className="text-purple-600 dark:text-purple-400 font-semibold">creativity</span> with{' '}
            <span className="text-pink-600 dark:text-pink-400 font-semibold">technology</span>.
            Building the future, one line of code at a time.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
          >
            <Link href="/projects">
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 group"
              >
                <span className="flex items-center space-x-2">
                  <span>View My Work</span>
                  <motion.div
                    className="group-hover:translate-x-1 transition-transform"
                  >
                    →
                  </motion.div>
                </span>
              </motion.button>
            </Link>
            
            <Link href="/contact">
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-full font-semibold text-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300"
              >
                Let&apos;s Connect
              </motion.button>
            </Link>
          </motion.div>

          {/* Social Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
            className="flex items-center justify-center space-x-6 mb-12"
          >
            {socialLinks.map((link, index) => (
              <motion.a
                key={link.name}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`text-gray-600 dark:text-gray-400 ${link.color} transition-colors duration-300 font-medium`}
                whileHover={{ y: -2 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 + index * 0.1 }}
              >
                {link.name}
              </motion.a>
            ))}
          </motion.div>

          {/* Scroll Indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4 }}
            className="flex flex-col items-center"
          >
            <span className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              Scroll to explore
            </span>
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <ArrowDownIcon className="w-5 h-5 text-gray-400" />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
