'use client';
import { useTheme } from "next-themes";
import { SunIcon, MoonIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

const socialLinks = [
  { href: 'https://github.com/bakulahmed', label: 'GitHub' },
  { href: 'https://linkedin.com/in/bakulahmed', label: 'LinkedIn' },
  { href: 'https://twitter.com/bakulahmed', label: 'Twitter' },
];

const navLinks = [
  { href: '/about', label: 'About' },
  { href: '/projects', label: 'Projects' },
  { href: '/blog', label: 'Blog' },
  { href: '/admin', label: 'Admin' },
];

export function Navbar() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // After mounting, we can safely show the UI that depends on the theme
  useEffect(() => {
    setMounted(true);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const toggleMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  // Check if link is active
  const isActive = (path: string) => {
    if (path === '/' && pathname === '/') return true;
    if (path !== '/' && pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <nav className="sticky top-0 z-50 bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and brand */}
          <div className="flex-shrink-0">
            <Link href="/" className="font-bold text-lg flex items-center">
              <span className="text-indigo-600 dark:text-indigo-400">Bakul Ahmed</span>
            </Link>
          </div>
          
          {/* Desktop navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-4">
              {navLinks.map((link) => (
                <Link 
                  key={link.href}
                  href={link.href} 
                  className={`px-3 py-2 rounded-md text-sm transition duration-200 ${
                    isActive(link.href) 
                      ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-medium' 
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
          
          {/* Right side icons */}
          <div className="hidden md:flex items-center space-x-4">
            {mounted && (
              <button
                onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                aria-label="Toggle dark mode"
                className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-200"
              >
                {resolvedTheme === "dark" ? 
                  <SunIcon className="w-5 h-5" /> : 
                  <MoonIcon className="w-5 h-5" />
                }
              </button>
            )}
            
            {socialLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition duration-200"
                aria-label={link.label}
              >
                <span className="sr-only">{link.label}</span>
                <span className="text-sm">{link.label}</span>
              </a>
            ))}
          </div>
          
          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 transition duration-200"
              aria-expanded={mobileMenuOpen}
              aria-label="Main menu"
            >
              <span className="sr-only">{mobileMenuOpen ? 'Close menu' : 'Open menu'}</span>
              {mobileMenuOpen ? (
                <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu, toggle visibility based on menu state */}
      <div 
        className={`${
          mobileMenuOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
        } md:hidden overflow-hidden bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 transition-all duration-300 ease-in-out`}
      >
        <div className="px-2 pt-2 pb-3 space-y-1">
          {navLinks.map((link) => (
            <Link 
              key={link.href}
              href={link.href} 
              className={`block px-3 py-2 rounded-md text-base transition duration-200 ${
                isActive(link.href) 
                  ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-medium' 
                  : 'hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            {mounted && (
              <button
                onClick={() => {
                  setTheme(resolvedTheme === "dark" ? "light" : "dark");
                }}
                className="flex items-center px-3 py-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition duration-200"
                aria-label="Toggle dark mode"
              >
                {resolvedTheme === "dark" ? (
                  <>
                    <SunIcon className="w-5 h-5 mr-2" />
                    <span>Light Mode</span>
                  </>
                ) : (
                  <>
                    <MoonIcon className="w-5 h-5 mr-2" />
                    <span>Dark Mode</span>
                  </>
                )}
              </button>
            )}
          </div>
          <div className="mt-3 space-y-1">
            {socialLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="block px-3 py-2 rounded-md text-base text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition duration-200"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}

export function Footer() {
  return (
    <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex justify-center md:justify-start space-x-6">
            {socialLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400"
                aria-label={link.label}
              >
                {link.label}
              </a>
            ))}
          </div>
          <div className="mt-8 md:mt-0 text-center md:text-right text-sm text-gray-500 dark:text-gray-400">
            <p>&copy; {new Date().getFullYear()} Bakul Ahmed. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}