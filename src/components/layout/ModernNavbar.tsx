'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bars3Icon, 
  XMarkIcon, 
  HomeIcon, 
  UserIcon, 
  BriefcaseIcon, 
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  SunIcon,
  MoonIcon
} from '@heroicons/react/24/outline';

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

export default function ModernNavbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme, resolvedTheme } = useTheme();
  const pathname = usePathname();

  // Ensure component is mounted before rendering theme-dependent content
  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted ? resolvedTheme === 'dark' : false;

  const navigation: NavigationItem[] = [
    { name: 'Home', href: '/', icon: HomeIcon },
    { name: 'About', href: '/about', icon: UserIcon },
    { name: 'Projects', href: '/projects', icon: BriefcaseIcon },
    { name: 'Blog', href: '/blog', icon: DocumentTextIcon },
    { name: 'Contact', href: '/contact', icon: ChatBubbleLeftRightIcon },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ${
        scrolled 
          ? 'bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-lg border-b border-gray-200/20 dark:border-gray-700/20' 
          : 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 z-10">
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
              className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-blue-200 dark:border-blue-800 shadow-lg"
            >
              <Image
                src="/Bakul.jpg"
                alt="Bakul Ahmed"
                fill
                className="object-cover object-center"
                sizes="40px"
              />
            </motion.div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              Bakul Ahmed
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.name} href={item.href}>
                  <motion.div
                    whileHover={{ y: -2 }}
                    whileTap={{ y: 0 }}
                    className={`relative px-4 py-2 rounded-full transition-all duration-200 flex items-center space-x-2 ${
                      isActive(item.href)
                        ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                        : 'text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{item.name}</span>
                    {isActive(item.href) && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-blue-500/10 rounded-full"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                  </motion.div>
                </Link>
              );
            })}
            
            {/* Professional Theme Toggle */}
            <motion.button
              whileHover={{ scale: mounted ? 1.05 : 1 }}
              whileTap={{ scale: mounted ? 0.95 : 1 }}
              onClick={toggleTheme}
              disabled={!mounted}
              className={`relative p-2.5 rounded-xl transition-all duration-300 ${
                mounted
                  ? `${
                      isDark
                        ? 'bg-gray-800/90 text-yellow-400 hover:bg-gray-700/90 border border-gray-700/50 shadow-lg shadow-gray-900/30'
                        : 'bg-gray-100/90 text-gray-700 hover:bg-gray-200/90 border border-gray-200/50 shadow-lg shadow-gray-200/30'
                    }`
                  : 'bg-gray-200/50 text-gray-400 border border-gray-300/30'
              } backdrop-blur-sm`}
              aria-label={mounted ? `Switch to ${isDark ? 'light' : 'dark'} mode` : 'Loading theme toggle'}
            >
              {!mounted ? (
                <div className="w-5 h-5 animate-pulse bg-gray-400/50 rounded"></div>
              ) : (
                <motion.div
                  key={isDark ? 'dark' : 'light'}
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {isDark ? (
                    <SunIcon className="w-5 h-5" />
                  ) : (
                    <MoonIcon className="w-5 h-5" />
                  )}
                </motion.div>
              )}
            </motion.button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-2">
            <motion.button
              whileHover={{ scale: mounted ? 1.05 : 1 }}
              whileTap={{ scale: mounted ? 0.95 : 1 }}
              onClick={toggleTheme}
              disabled={!mounted}
              className={`p-2 rounded-xl transition-all duration-300 ${
                mounted
                  ? `${
                      isDark
                        ? 'bg-gray-800/90 text-yellow-400 hover:bg-gray-700/90'
                        : 'bg-gray-100/90 text-gray-700 hover:bg-gray-200/90'
                    }`
                  : 'bg-gray-200/50 text-gray-400'
              } shadow-sm`}
              aria-label={mounted ? `Switch to ${isDark ? 'light' : 'dark'} mode` : 'Loading theme toggle'}
            >
              {!mounted ? (
                <div className="w-5 h-5 animate-pulse bg-gray-400/50 rounded"></div>
              ) : (
                <motion.div
                  key={isDark ? 'dark' : 'light'}
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {isDark ? (
                    <SunIcon className="w-5 h-5" />
                  ) : (
                    <MoonIcon className="w-5 h-5" />
                  )}
                </motion.div>
              )}
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Toggle menu"
            >
              {isOpen ? (
                <XMarkIcon className="w-6 h-6" />
              ) : (
                <Bars3Icon className="w-6 h-6" />
              )}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden bg-white/98 dark:bg-slate-900/98 backdrop-blur-xl border-t border-gray-200/30 dark:border-gray-700/30 shadow-lg"
          >
            <div className="px-4 py-4 space-y-2">
              {navigation.map((item, index) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Link href={item.href} onClick={() => setIsOpen(false)}>
                      <div className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                        isActive(item.href)
                          ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}>
                        <Icon className="w-5 h-5" />
                        <span className="font-medium">{item.name}</span>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
