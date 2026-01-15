'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';
import {
    EnvelopeIcon,
    MapPinIcon,
    PhoneIcon,
    HeartIcon,
    ArrowUpIcon,
} from '@heroicons/react/24/outline';

const QUICK_LINKS = [
    { name: 'Home', href: '/' },
    { name: 'About', href: '/about' },
    { name: 'Projects', href: '/projects' },
    { name: 'Blog', href: '/blog' },
    { name: 'Contact', href: '/contact' },
];

const SOCIAL_LINKS = [
    {
        name: 'GitHub',
        href: 'https://github.com/bakulbd',
        icon: (
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
            </svg>
        ),
    },
    {
        name: 'LinkedIn',
        href: 'https://linkedin.com/in/cyberbokul',
        icon: (
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
        ),
    },
    {
        name: 'Twitter',
        href: 'https://twitter.com/cyberbokul',
        icon: (
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
        ),
    },
];

const TECH_STACK = [
    'React', 'Next.js', 'TypeScript', 'Python', 'Node.js', 'PostgreSQL', 'MongoDB', 'Tailwind CSS'
];

export default function Footer() {
    const [mounted, setMounted] = React.useState(false);
    const { resolvedTheme } = useTheme();

    React.useEffect(() => {
        setMounted(true);
    }, []);

    const isDark = mounted ? resolvedTheme === 'dark' : true;

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const currentYear = new Date().getFullYear();

    if (!mounted) {
        return null;
    }

    return (
        <footer className={`relative overflow-hidden ${isDark ? 'bg-slate-950' : 'bg-slate-100'}`}>
            {/* Background decoration */}
            <div className="absolute inset-0 -z-10">
                <div className={`absolute top-0 left-1/4 w-96 h-96 rounded-full blur-3xl ${isDark ? 'bg-blue-500/5' : 'bg-blue-500/10'}`} />
                <div className={`absolute bottom-0 right-1/4 w-80 h-80 rounded-full blur-3xl ${isDark ? 'bg-purple-500/5' : 'bg-purple-500/10'}`} />
            </div>

            {/* Main Footer Content */}
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-16 pb-8">
                {/* Top Section */}
                <div className="grid gap-12 lg:grid-cols-4 md:grid-cols-2">
                    {/* Brand Section */}
                    <div className="lg:col-span-1">
                        <Link href="/" className="flex items-center gap-3 mb-6">
                            <motion.div
                                whileHover={{ scale: 1.05, rotate: 3 }}
                                className="relative h-12 w-12 overflow-hidden rounded-2xl border-2 border-blue-500/30 shadow-lg shadow-blue-500/20"
                            >
                                <Image src="/Bakul.jpg" alt="Bakul Ahmed" fill className="object-cover" sizes="48px" />
                            </motion.div>
                            <div>
                                <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                    Bakul Ahmed
                                </h3>
                                <p className={`text-xs uppercase tracking-[0.2em] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                                    Software Developer
                                </p>
                            </div>
                        </Link>
                        <p className={`text-sm leading-relaxed mb-6 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                            AI Enthusiast & Software Developer crafting innovative digital solutions. 
                            CSE Student at Green University, Bangladesh.
                        </p>
                        
                        {/* Social Links */}
                        <div className="flex gap-3">
                            {SOCIAL_LINKS.map((social) => (
                                <motion.a
                                    key={social.name}
                                    href={social.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    whileHover={{ scale: 1.1, y: -2 }}
                                    whileTap={{ scale: 0.95 }}
                                    className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-all ${
                                        isDark
                                            ? 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-blue-500/50 hover:text-blue-400 hover:bg-blue-500/10'
                                            : 'border-slate-300 bg-white text-slate-600 hover:border-blue-500/50 hover:text-blue-600 hover:bg-blue-50'
                                    }`}
                                    aria-label={social.name}
                                >
                                    {social.icon}
                                </motion.a>
                            ))}
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className={`text-sm font-semibold uppercase tracking-[0.2em] mb-6 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            Quick Links
                        </h4>
                        <ul className="space-y-3">
                            {QUICK_LINKS.map((link) => (
                                <li key={link.name}>
                                    <Link
                                        href={link.href}
                                        className={`text-sm transition-colors hover:translate-x-1 inline-block ${
                                            isDark
                                                ? 'text-slate-400 hover:text-blue-400'
                                                : 'text-slate-600 hover:text-blue-600'
                                        }`}
                                    >
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div>
                        <h4 className={`text-sm font-semibold uppercase tracking-[0.2em] mb-6 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            Contact
                        </h4>
                        <ul className="space-y-4">
                            <li className="flex items-start gap-3">
                                <EnvelopeIcon className={`h-5 w-5 mt-0.5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                                <a 
                                    href="mailto:bokula88@gmail.com" 
                                    className={`text-sm transition-colors ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}
                                >
                                    bokula88@gmail.com
                                </a>
                            </li>
                            <li className="flex items-start gap-3">
                                <PhoneIcon className={`h-5 w-5 mt-0.5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                                <a 
                                    href="tel:+8801786685665" 
                                    className={`text-sm transition-colors ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}
                                >
                                    +880 1786 685665
                                </a>
                            </li>
                            <li className="flex items-start gap-3">
                                <MapPinIcon className={`h-5 w-5 mt-0.5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                                <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                                    Dhaka, Bangladesh
                                </span>
                            </li>
                        </ul>
                    </div>

                    {/* Tech Stack */}
                    <div>
                        <h4 className={`text-sm font-semibold uppercase tracking-[0.2em] mb-6 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            Tech Stack
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {TECH_STACK.map((tech) => (
                                <span
                                    key={tech}
                                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                                        isDark
                                            ? 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-blue-500/30 hover:text-blue-400'
                                            : 'border-slate-300 bg-white text-slate-600 hover:border-blue-500/30 hover:text-blue-600'
                                    }`}
                                >
                                    {tech}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Divider */}
                <div className={`my-10 h-px ${isDark ? 'bg-slate-800' : 'bg-slate-300'}`} />

                {/* Bottom Section */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className={`flex items-center gap-1 text-sm ${isDark ? 'text-slate-500' : 'text-slate-600'}`}>
                        <span>© {currentYear} Bakul Ahmed. Made with</span>
                        <HeartIcon className="h-4 w-4 text-red-500 animate-pulse" />
                        <span>in Bangladesh</span>
                    </div>

                    <div className={`flex items-center gap-6 text-sm ${isDark ? 'text-slate-500' : 'text-slate-600'}`}>
                        <Link href="/projects" className="hover:text-blue-500 transition-colors">
                            View Projects
                        </Link>
                        <Link href="/cv/Bakul_Ahmed_CV.pdf" className="hover:text-blue-500 transition-colors" download>
                            Download CV
                        </Link>
                        <motion.button
                            onClick={scrollToTop}
                            whileHover={{ scale: 1.1, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-all ${
                                isDark
                                    ? 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-blue-500/50 hover:text-blue-400'
                                    : 'border-slate-300 bg-white text-slate-600 hover:border-blue-500/50 hover:text-blue-600'
                            }`}
                            aria-label="Scroll to top"
                        >
                            <ArrowUpIcon className="h-5 w-5" />
                        </motion.button>
                    </div>
                </div>
            </div>

            {/* GitHub CTA Banner */}
            <div className={`py-8 ${isDark ? 'bg-slate-900/50' : 'bg-slate-200/50'}`}>
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            Check out my work on GitHub
                        </h3>
                        <div className="flex flex-wrap items-center justify-center gap-4">
                            <a
                                href="https://github.com/bakulbd"
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`inline-flex items-center gap-3 px-6 py-3 rounded-xl font-medium transition-all hover:scale-105 ${
                                    isDark
                                        ? 'bg-slate-800 border border-slate-700 text-white hover:bg-slate-700'
                                        : 'bg-white border border-slate-300 text-slate-900 hover:bg-slate-50'
                                }`}
                            >
                                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                                </svg>
                                View GitHub Profile
                            </a>
                            <a
                                href="https://github.com/bakulbd?tab=repositories"
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all hover:scale-105 bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700`}
                            >
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                </svg>
                                Browse Repositories
                            </a>
                        </div>
                        <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-sm">
                            <div className={`flex items-center gap-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                                <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                                50+ Projects
                            </div>
                            <div className={`flex items-center gap-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                                <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                                Open Source Contributor
                            </div>
                            <div className={`flex items-center gap-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                                <span className="w-3 h-3 rounded-full bg-purple-500"></span>
                                Active Developer
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
