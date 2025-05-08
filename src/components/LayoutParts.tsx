'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';

export function Navbar() {
  const pathname = usePathname();

  const navItems = [
    { label: 'About', href: '/about' },
    { label: 'Blog', href: '/blog' },
    { label: 'Projects', href: '/projects' },
    { label: 'Admin', href: '/admin' },
  ];

  return (
    <header className="bg-white dark:bg-gray-900 shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
          <Image src="/file.svg" alt="Bakul Logo" width={40} height={40} className="rounded-full" />
          Bakul
        </Link>
        <nav className="flex items-center space-x-6">
          {navItems.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              className={`transition font-medium ${
                pathname === href
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400'
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

export default function Footer() {
  return (
    <footer className="bg-gray-800 text-white py-4 text-center">
      <p>&copy; {new Date().getFullYear()} Professional Portfolio. All rights reserved.</p>
    </footer>
  );
}

export function LoadingScreen() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white dark:bg-gray-900 z-50">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-indigo-600 dark:text-indigo-400 font-semibold">Loading...</p>
      </div>
    </div>
  );
}
