'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/enhanced';
import { 
  SunIcon, 
  MoonIcon, 
  Bars3Icon, 
  XMarkIcon,
  HomeIcon,
  UserIcon,
  BriefcaseIcon,
  DocumentTextIcon,
  PhoneIcon
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { label: 'Home', href: '/', icon: HomeIcon },
  { label: 'About', href: '/about', icon: UserIcon },
  { label: 'Projects', href: '/projects', icon: BriefcaseIcon },
  { label: 'Blog', href: '/blog', icon: DocumentTextIcon },
  { label: 'Contact', href: '/contact', icon: PhoneIcon },
];

export function EnhancedNavbar() {
  const pathname = usePathname();
  const { theme, toggleTheme, mounted } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <>
      <motion.header
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
          scrolled
            ? 'bg-background/80 backdrop-blur-md shadow-lg border-b border-border/50'
            : 'bg-transparent'
        )}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link 
                href="/" 
                className="flex items-center space-x-3 group"
                onClick={closeMenu}
              >
                <div className="relative w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 p-0.5 group-hover:scale-105 transition-transform duration-200">
                  <div className="w-full h-full rounded-full bg-background flex items-center justify-center overflow-hidden">
                    <Image 
                      src="/file.svg" 
                      alt="Bakul Logo" 
                      width={32} 
                      height={32} 
                      className="rounded-full object-cover"
                    />
                  </div>
                </div>
                <span className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                  Bakul Ahmed
                </span>
              </Link>
            </motion.div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-1">
              {navItems.map(({ label, href, icon: Icon }) => {
                const isActive = pathname === href;
                return (
                  <motion.div
                    key={href}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Link
                      href={href}
                      className={cn(
                        'relative flex items-center px-4 py-2 rounded-lg font-medium transition-all duration-200 group',
                        isActive
                          ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20'
                          : 'text-foreground/80 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-muted/50'
                      )}
                    >
                      {Icon && (
                        <Icon className="w-4 h-4 mr-2 transition-transform group-hover:scale-110" />
                      )}
                      {label}
                      {isActive && (
                        <motion.div
                          className="absolute -bottom-1 left-1/2 w-6 h-0.5 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-full"
                          layoutId="activeTab"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.2 }}
                          style={{ x: '-50%' }}
                        />
                      )}
                    </Link>
                  </motion.div>
                );
              })}
            </div>

            {/* Theme Toggle & Mobile Menu Button */}
            <div className="flex items-center space-x-2">
              {/* Theme Toggle */}
              {mounted && (
                <motion.button
                  onClick={toggleTheme}
                  className="p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors duration-200"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  aria-label="Toggle theme"
                >
                  <AnimatePresence mode="wait">
                    {theme === 'dark' ? (
                      <motion.div
                        key="sun"
                        initial={{ rotate: -90, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        exit={{ rotate: 90, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <SunIcon className="w-5 h-5 text-yellow-500" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="moon"
                        initial={{ rotate: 90, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        exit={{ rotate: -90, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <MoonIcon className="w-5 h-5 text-blue-500" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>
              )}

              {/* Mobile Menu Button */}
              <motion.button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="lg:hidden p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors duration-200"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                aria-label="Toggle menu"
              >
                <AnimatePresence mode="wait">
                  {isMenuOpen ? (
                    <motion.div
                      key="close"
                      initial={{ rotate: -90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <XMarkIcon className="w-6 h-6" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="menu"
                      initial={{ rotate: 90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: -90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Bars3Icon className="w-6 h-6" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>
          </div>
        </nav>
      </motion.header>

      {/* Mobile Navigation Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeMenu}
            />
            <motion.div
              className="fixed top-16 left-4 right-4 bg-card border border-border rounded-xl shadow-xl z-50 lg:hidden overflow-hidden"
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <nav className="p-4">
                <div className="space-y-2">
                  {navItems.map(({ label, href, icon: Icon }, index) => {
                    const isActive = pathname === href;
                    return (
                      <motion.div
                        key={href}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Link
                          href={href}
                          onClick={closeMenu}
                          className={cn(
                            'flex items-center px-4 py-3 rounded-lg font-medium transition-colors duration-200',
                            isActive
                              ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20'
                              : 'text-foreground/80 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-muted/50'
                          )}
                        >
                          {Icon && (
                            <Icon className="w-5 h-5 mr-3" />
                          )}
                          {label}
                          {isActive && (
                            <div className="ml-auto w-2 h-2 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-full" />
                          )}
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export function EnhancedFooter() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    navigation: [
      { label: 'Home', href: '/' },
      { label: 'About', href: '/about' },
      { label: 'Projects', href: '/projects' },
      { label: 'Blog', href: '/blog' },
      { label: 'Contact', href: '/contact' },
    ],
    social: [
      { 
        label: 'GitHub', 
        href: 'https://github.com/bakulahmed',
        icon: (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
          </svg>
        )
      },
      { 
        label: 'LinkedIn', 
        href: 'https://linkedin.com/in/bakulahmed',
        icon: (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zM7.119 20.452H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
          </svg>
        )
      },
      { 
        label: 'Twitter', 
        href: 'https://twitter.com/bakulahmed',
        icon: (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
          </svg>
        )
      }
    ]
  };

  return (
    <motion.footer
      className="bg-muted/30 border-t border-border mt-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 p-0.5">
                <div className="w-full h-full rounded-full bg-background flex items-center justify-center">
                  <Image src="/file.svg" alt="Bakul" width={24} height={24} />
                </div>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                Bakul Ahmed
              </span>
            </div>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Full Stack Developer passionate about creating innovative digital solutions 
              that make a difference. Specializing in modern web technologies and user experiences.
            </p>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              {footerLinks.navigation.map(({ label, href }) => (
                <li key={href}>
                  <Link 
                    href={href} 
                    className="text-muted-foreground hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Connect */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h3 className="text-lg font-semibold mb-4">Connect</h3>
            <div className="flex space-x-4 mb-6">
              {footerLinks.social.map(({ label, href, icon }) => (
                <motion.a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-muted hover:bg-primary-100 dark:hover:bg-primary-900/20 text-muted-foreground hover:text-primary-600 dark:hover:text-primary-400 transition-all duration-200"
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label={label}
                >
                  {icon}
                </motion.a>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              Let&apos;s build something amazing together!
            </p>
          </motion.div>
        </div>

        <motion.div
          className="border-t border-border mt-8 pt-8 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <p className="text-muted-foreground">
            &copy; {currentYear} Bakul Ahmed. All rights reserved. Built with ❤️ using Next.js & Tailwind CSS.
          </p>
        </motion.div>
      </div>
    </motion.footer>
  );
}
