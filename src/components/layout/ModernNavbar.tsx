'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { AnimatePresence, motion } from 'framer-motion';
import {
    Bars3Icon,
    XMarkIcon,
    HomeIcon,
    UserIcon,
    BriefcaseIcon,
    ChatBubbleLeftRightIcon,
    DocumentTextIcon,
    SunIcon,
    MoonIcon,
} from '@heroicons/react/24/outline';

interface NavigationItem {
    name: string;
    href: string;
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

const NAV_ITEMS: NavigationItem[] = [
    { name: 'Home', href: '/', icon: HomeIcon },
    { name: 'About', href: '/about', icon: UserIcon },
    { name: 'Projects', href: '/projects', icon: BriefcaseIcon },
    { name: 'Blog', href: '/blog', icon: DocumentTextIcon },
    { name: 'Contact', href: '/contact', icon: ChatBubbleLeftRightIcon },
];

const PRIMARY_CTA = { label: "Let's build", href: '/contact' } as const;

const mobileMenuVariants = {
    hidden: { opacity: 0, height: 0 },
    visible: {
        opacity: 1,
        height: 'auto',
        transition: { duration: 0.3, ease: 'easeOut' },
    },
    exit: { opacity: 0, height: 0, transition: { duration: 0.2, ease: 'easeIn' } },
} as const;

export default function ModernNavbar() {
    const [menuOpen, setMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [mounted, setMounted] = useState(false);
    const { setTheme, resolvedTheme } = useTheme();
    const pathname = usePathname();

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 32);
        handleScroll();
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navItems = useMemo(() => NAV_ITEMS, []);
    const isDark = mounted ? resolvedTheme === 'dark' : false;

    const toggleTheme = useCallback(() => {
        if (!mounted) {
            return;
        }
        setTheme(isDark ? 'light' : 'dark');
    }, [isDark, mounted, setTheme]);

    const toggleMenu = useCallback(() => setMenuOpen((prev) => !prev), []);
    const closeMenu = useCallback(() => setMenuOpen(false), []);

    const isActive = useCallback(
        (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href)),
        [pathname]
    );

    const shellBackground = scrolled || menuOpen
        ? 'bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-lg border-b border-blue-100/20 dark:border-slate-700/40'
        : 'bg-white/70 dark:bg-slate-900/70 backdrop-blur-md';

    return (
        <motion.nav
            initial={{ y: -96, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className={`fixed inset-x-0 top-0 z-[100] ${shellBackground}`}
        >
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                <Link href="/" className="flex items-center gap-3" aria-label="Return to homepage">
                    <motion.div
                        whileHover={{ scale: 1.08, rotate: 4 }}
                        whileTap={{ scale: 0.92 }}
                        className="relative h-10 w-10 overflow-hidden rounded-2xl border border-white/30 shadow-lg shadow-blue-500/20"
                    >
                        <Image src="/Bakul.jpg" alt="Bakul Ahmed" fill className="object-cover" sizes="40px" />
                    </motion.div>
                    <div className="flex flex-col text-sm">
                        <span className="text-base font-semibold text-slate-900 dark:text-white">Bakul Ahmed</span>
                        <span className="text-[11px] uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">Product engineer</span>
                    </div>
                </Link>

                <div className="hidden items-center gap-1 md:flex">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.href);
                        return (
                            <Link key={item.name} href={item.href} className="relative" aria-label={item.name}>
                                {active && (
                                    <motion.div
                                        layoutId="nav-active-ring"
                                        className="absolute inset-[-2px] rounded-full border border-blue-500/40 shadow-[0_0_25px_rgba(59,130,246,0.25)]"
                                        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                                    />
                                )}
                                <motion.div
                                    whileHover={{ y: -2 }}
                                    whileTap={{ y: 0 }}
                                    className={`relative z-10 flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                                        active
                                            ? 'bg-blue-500/10 text-blue-600 dark:text-blue-300'
                                            : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                                    }`}
                                >
                                    <Icon className="h-4 w-4" />
                                    {item.name}
                                </motion.div>
                            </Link>
                        );
                    })}
                    <motion.div
                        key={isDark ? 'dark-toggle' : 'light-toggle'}
                        whileHover={{ scale: mounted ? 1.05 : 1 }}
                        whileTap={{ scale: mounted ? 0.95 : 1 }}
                        className="ml-2"
                    >
                        <button
                            onClick={toggleTheme}
                            disabled={!mounted}
                            className={`group relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl border transition-all ${
                                mounted
                                    ? isDark
                                        ? 'border-slate-700 bg-slate-900 text-amber-300'
                                        : 'border-slate-200 bg-white text-slate-700'
                                    : 'border-slate-200/60 bg-slate-100 text-slate-400'
                            }`}
                            aria-label={mounted ? `Switch to ${isDark ? 'light' : 'dark'} mode` : 'Loading theme toggle'}
                        >
                            {!mounted ? (
                                <div className="h-4 w-4 animate-pulse rounded bg-slate-400/60" />
                            ) : isDark ? (
                                <SunIcon className="h-5 w-5" />
                            ) : (
                                <MoonIcon className="h-5 w-5" />
                            )}
                        </button>
                    </motion.div>
                    <Link
                        href={PRIMARY_CTA.href}
                        className="relative ml-2 inline-flex items-center gap-2 rounded-full border border-blue-500/60 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition hover:shadow-blue-500/60"
                    >
                        <span>{PRIMARY_CTA.label}</span>
                        <span className="h-1.5 w-1.5 rounded-full bg-white" />
                    </Link>
                </div>

                <div className="flex items-center gap-2 md:hidden">
                    <button
                        onClick={toggleTheme}
                        disabled={!mounted}
                        className={`rounded-2xl p-2 transition ${
                            mounted
                                ? isDark
                                    ? 'bg-slate-800 text-amber-300'
                                    : 'bg-white text-slate-700 shadow'
                                : 'bg-slate-100 text-slate-400'
                        }`}
                        aria-label={mounted ? `Switch to ${isDark ? 'light' : 'dark'} mode` : 'Loading theme toggle'}
                    >
                        {!mounted ? <div className="h-5 w-5 animate-pulse rounded bg-slate-400/50" /> : isDark ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
                    </button>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={toggleMenu}
                        aria-label="Toggle navigation menu"
                        aria-expanded={menuOpen}
                        className="rounded-2xl border border-slate-200/50 p-2 text-slate-900 dark:border-slate-700/70 dark:text-white"
                    >
                        {menuOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
                    </motion.button>
                </div>
            </div>

            <AnimatePresence>
                {menuOpen && (
                    <motion.div
                        variants={mobileMenuVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="border-t border-slate-200/40 bg-white/95 px-4 py-4 shadow-inner dark:border-slate-700/40 dark:bg-slate-900/95 md:hidden"
                    >
                        <div className="space-y-2">
                            {navItems.map((item, index) => {
                                const Icon = item.icon;
                                const active = isActive(item.href);
                                return (
                                    <motion.div key={item.name} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }}>
                                        <Link
                                            href={item.href}
                                            onClick={closeMenu}
                                            className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-base transition ${
                                                active
                                                    ? 'border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-300'
                                                    : 'border-transparent text-slate-700 hover:border-slate-200 dark:text-slate-200 dark:hover:border-slate-700'
                                            }`}
                                        >
                                            <span className="flex items-center gap-3">
                                                <Icon className="h-5 w-5" />
                                                {item.name}
                                            </span>
                                            {active && <span className="text-xs uppercase tracking-[0.3em] text-blue-500">Now</span>}
                                        </Link>
                                    </motion.div>
                                );
                            })}
                            <Link
                                href={PRIMARY_CTA.href}
                                onClick={closeMenu}
                                className="block rounded-2xl bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 px-4 py-3 text-center text-sm font-semibold text-white"
                            >
                                {PRIMARY_CTA.label}
                            </Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.nav>
    );
}
