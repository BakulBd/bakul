'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';
import { useTheme } from 'next-themes';
import {
    AcademicCapIcon,
    ArrowTopRightOnSquareIcon,
    CircleStackIcon,
    CommandLineIcon,
    CpuChipIcon,
    DevicePhoneMobileIcon,
    LightBulbIcon,
    RocketLaunchIcon,
    SparklesIcon,
} from '@heroicons/react/24/outline';
import ModernNavbar from '@/components/layout/ModernNavbar';

type StatCard = {
    label: string;
    value: string;
    detail: string;
};

type FocusHighlight = {
    title: string;
    description: string;
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

type TimelineItem = {
    title: string;
    timeframe: string;
    description: string;
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

type CaseStudy = {
    title: string;
    problem: string;
    result: string;
    stack: string[];
    href: string;
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

type Testimonial = {
    quote: string;
    name: string;
    role: string;
};

const HERO_PILLS = ['AI Enthusiast', 'Software Developer', 'Tech Explorer'] as const;

const STAT_CARDS: StatCard[] = [
    { label: 'Projects completed', value: '50+', detail: 'Web apps, AI tools, and full-stack solutions' },
    { label: 'Response time', value: '< 24h', detail: 'Fast and reliable communication' },
    { label: 'Experience', value: '3+ yrs', detail: 'Hands-on software development' },
];

const FOCUS_HIGHLIGHTS: FocusHighlight[] = [
    {
        title: 'AI & Machine Learning',
        description: 'Building intelligent solutions with modern AI frameworks and tools.',
        icon: SparklesIcon,
    },
    {
        title: 'Full-Stack Development',
        description: 'End-to-end web applications with React, Next.js, and Python.',
        icon: CircleStackIcon,
    },
    {
        title: 'Problem Solving',
        description: 'Turning complex challenges into elegant, efficient solutions.',
        icon: DevicePhoneMobileIcon,
    },
];

const TIMELINE: TimelineItem[] = [
    {
        title: 'AI Enthusiast & Explorer',
        timeframe: '2024 - Present',
        description: 'Exploring Machine Learning, deep learning frameworks, and AI-powered applications.',
        icon: CpuChipIcon,
    },
    {
        title: 'CSE Student @ Green University',
        timeframe: '2021 - Present · Bangladesh',
        description: 'Pursuing Computer Science & Engineering with focus on software development and algorithms.',
        icon: AcademicCapIcon,
    },
    {
        title: 'Full-Stack Developer',
        timeframe: 'Ongoing',
        description: 'Building modern web applications and contributing to open-source projects.',
        icon: RocketLaunchIcon,
    },
];

const CASE_STUDIES: CaseStudy[] = [
    {
        title: 'E-Commerce Platform',
        problem: 'Businesses needed a scalable multi-vendor marketplace with real-time analytics.',
        result: 'Built a full-stack solution with payment integration and inventory management.',
        stack: ['Next.js', 'TypeScript', 'PostgreSQL', 'Stripe'],
        href: '/projects#commerce-os',
        icon: RocketLaunchIcon,
    },
    {
        title: 'Task Management Pro',
        problem: 'Teams struggled with real-time collaboration and task tracking across projects.',
        result: 'Developed a live board with socket updates and smart automation features.',
        stack: ['React', 'Node.js', 'Socket.io', 'MongoDB'],
        href: '/projects#task-hq',
        icon: CommandLineIcon,
    },
    {
        title: 'AI Weather Intelligence',
        problem: 'Climate researchers needed ML-powered forecasting with interactive visualizations.',
        result: 'Created a dashboard that improved analysis efficiency by 35 percent.',
        stack: ['React', 'D3.js', 'Python', 'TensorFlow'],
        href: '/projects#weather-intel',
        icon: LightBulbIcon,
    },
];

const TESTIMONIALS: Testimonial[] = [
    {
        quote:
            'Bakul delivered exactly what we needed - a clean, functional platform that our users love. His attention to detail and commitment to quality is exceptional.',
        name: 'Safin Rahman',
        role: 'Startup Founder',
    },
    {
        quote:
            'Working with Bakul was a great experience. He understood our requirements quickly and delivered a polished product ahead of schedule.',
        name: 'Lamia Chowdhury',
        role: 'Product Manager',
    },
    {
        quote: 'His technical skills combined with his problem-solving approach made our project a success. Highly recommend for any development work.',
        name: 'Rehan Sheikh',
        role: 'Tech Lead',
    },
];

const AmbientBackdrop = ({ isDark, muted }: { isDark: boolean; muted: boolean }) => (
    <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className={`absolute inset-0 ${isDark ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-black' : 'bg-gradient-to-br from-white via-slate-50 to-blue-50'}`} />
        {!muted && (
            <>
                <motion.div
                    className="absolute -top-16 right-8 h-64 w-64 rounded-full blur-3xl"
                    animate={{ opacity: [0.3, 0.7, 0.3], scale: [1, 1.1, 1] }}
                    transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
                    style={{
                        background: isDark
                            ? 'radial-gradient(circle, rgba(59,130,246,0.35) 0%, rgba(147,51,234,0.2) 60%, transparent 100%)'
                            : 'radial-gradient(circle, rgba(59,130,246,0.2) 0%, rgba(147,51,234,0.1) 60%, transparent 100%)',
                    }}
                />
                <motion.div
                    className="absolute bottom-0 left-0 h-72 w-72 rounded-full blur-3xl"
                    animate={{ opacity: [0.2, 0.5, 0.2], scale: [1, 0.9, 1] }}
                    transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
                    style={{
                        background: isDark
                            ? 'radial-gradient(circle, rgba(16,185,129,0.25) 0%, rgba(59,130,246,0.15) 60%, transparent 100%)'
                            : 'radial-gradient(circle, rgba(16,185,129,0.18) 0%, rgba(59,130,246,0.1) 60%, transparent 100%)',
                    }}
                />
            </>
        )}
        <div
            className={`absolute inset-0 opacity-60 mix-blend-screen ${
                isDark
                    ? 'bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.18),_transparent_45%)]'
                    : 'bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.12),_transparent_45%)]'
            }`}
        />
    </div>
);

export default function Homepage() {
    const [mounted, setMounted] = useState(false);
    const { resolvedTheme } = useTheme();
    const prefersReducedMotion = useReducedMotion();
    const isDark = mounted ? resolvedTheme === 'dark' : true;
    const mutedMotion = prefersReducedMotion ?? false;

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return null;
    }

    return (
        <div className={`relative min-h-screen overflow-hidden transition-colors duration-500 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            <ModernNavbar />
            <AmbientBackdrop isDark={isDark} muted={mutedMotion} />
            <main className="relative z-10 mx-auto flex max-w-6xl flex-col gap-16 px-4 pb-24 pt-24 sm:px-6 lg:px-8">
                <motion.section
                    className="grid gap-10 lg:grid-cols-[1.1fr,0.9fr]"
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                >
                    <div className="space-y-8">
                        <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/10 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-black/20 backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/60">
                            <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                            🚀 Bakul Ahmed · Portfolio 2025
                        </div>
                        <div className="space-y-4">
                            <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                                AI Enthusiast & Software Developer crafting innovative digital solutions.
                            </h1>
                            <p className={`text-base leading-relaxed sm:text-lg lg:text-xl ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                                Passionate Computer Science student at Green University, Bangladesh. I transform complex problems into elegant, user-friendly applications using modern technologies.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {HERO_PILLS.map((pill) => (
                                <span
                                    key={pill}
                                    className={`rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] border ${
                                        isDark ? 'bg-white/10 text-slate-100 border-white/20' : 'bg-slate-900/10 text-slate-700 border-slate-900/20'
                                    }`}
                                >
                                    {pill}
                                </span>
                            ))}
                        </div>
                        <div className="flex flex-col gap-3 sm:flex-row">
                            <Link
                                href="/projects"
                                className="group inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 px-8 py-3 font-semibold text-white shadow-lg shadow-purple-500/30 transition hover:shadow-purple-500/60"
                            >
                                View featured work
                                <ArrowTopRightOnSquareIcon className="ml-2 h-5 w-5 transition group-hover:translate-x-1" />
                            </Link>
                            <Link
                                href="/contact"
                                className={`inline-flex items-center justify-center rounded-2xl border px-8 py-3 font-semibold transition ${
                                    isDark ? 'border-slate-700 bg-slate-900/60 text-slate-100 hover:border-slate-500' : 'border-slate-200 bg-white/80 text-slate-800 hover:border-slate-400'
                                }`}
                            >
                                Start a project
                            </Link>
                        </div>
                    </div>
                    <div className={`rounded-3xl border ${isDark ? 'border-slate-800/80 bg-slate-900/70' : 'border-slate-200/70 bg-white/80'} p-6 shadow-2xl shadow-black/20 backdrop-blur-xl`}>
                        <div className="relative mx-auto h-56 w-56">
                            {!mutedMotion && (
                                <motion.div
                                    className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-30 blur-2xl"
                                    animate={{ scale: [1, 1.06, 1], rotate: [0, 90, 180] }}
                                    transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
                                />
                            )}
                            <Image
                                src="/Bakul.jpg"
                                alt="Bakul Ahmed"
                                width={224}
                                height={224}
                                className="relative h-full w-full rounded-full border-4 border-white/20 object-cover shadow-lg"
                                priority
                            />
                        </div>
                        <div className="mt-6 space-y-4 text-center">
                            <p className={`text-base ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                                Currently exploring AI/ML, building full-stack applications, and contributing to open-source projects.
                            </p>
                            <div className="flex flex-wrap justify-center gap-2 text-sm">
                                <span className="rounded-full bg-emerald-500/20 px-4 py-1.5 font-medium text-emerald-300 dark:text-emerald-200 border border-emerald-500/30">Open to opportunities</span>
                                <span className="rounded-full bg-blue-500/20 px-4 py-1.5 font-medium text-blue-300 dark:text-blue-200 border border-blue-500/30">Remote friendly</span>
                            </div>
                            <Link
                                href="/cv/Bakul_Ahmed_CV.pdf"
                                className="inline-flex items-center justify-center rounded-xl border border-white/20 px-5 py-2 text-sm font-medium text-white transition hover:bg-white/10"
                                download
                            >
                                Download CV
                                <ArrowTopRightOnSquareIcon className="ml-2 h-4 w-4" />
                            </Link>
                        </div>
                    </div>
                </motion.section>

                <section className="grid gap-8 lg:grid-cols-[1.05fr,0.95fr]">
                    <motion.div
                        className={`rounded-3xl border p-6 shadow-lg ${isDark ? 'border-slate-800/70 bg-slate-900/60' : 'border-slate-200 bg-white/90'}`}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.3 }}
                        transition={{ duration: 0.6 }}
                    >
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-400">Impact at a glance</p>
                        <div className="mt-6 grid gap-4 sm:grid-cols-3">
                            {STAT_CARDS.map((stat) => (
                                <div key={stat.label} className={`rounded-2xl border p-4 ${isDark ? 'border-white/5 bg-white/5' : 'border-slate-200 bg-white'}`}>
                                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{stat.label}</p>
                                    <p className="mt-2 text-3xl font-extrabold">{stat.value}</p>
                                    <p className={`mt-2 text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{stat.detail}</p>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                    <motion.div
                        className={`rounded-3xl border p-6 shadow-lg ${isDark ? 'border-slate-800/70 bg-slate-900/60' : 'border-slate-200 bg-white/90'}`}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.3 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                    >
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-400">Craft priorities</p>
                        <div className="mt-6 space-y-4">
                            {FOCUS_HIGHLIGHTS.map((highlight) => {
                                const Icon = highlight.icon;
                                return (
                                    <div key={highlight.title} className={`rounded-2xl border p-4 ${isDark ? 'border-white/5 bg-white/5' : 'border-slate-200 bg-white'}`}>
                                        <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-white">
                                            <Icon className="h-5 w-5" />
                                        </div>
                                        <h3 className="text-lg font-semibold">{highlight.title}</h3>
                                        <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{highlight.description}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>
                </section>

                <motion.section
                    className="space-y-8"
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: 0.7 }}
                >
                    <div className="text-center">
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-pink-500">Selected collaborations</p>
                        <h2 className="mt-2 text-3xl font-bold">Lean builds with measurable wins</h2>
                        <p className={`mt-2 text-base ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                            Sprints stay light, demos land weekly, and every release has a single metric we rally behind.
                        </p>
                    </div>
                    <div className="grid gap-6 lg:grid-cols-3">
                        {CASE_STUDIES.map((study) => {
                            const Icon = study.icon;
                            return (
                                <Link key={study.title} href={study.href} className="group block" aria-label={study.title}>
                                    <article
                                        className={`flex h-full flex-col justify-between rounded-3xl border p-6 shadow-xl transition-all hover:-translate-y-1 hover:shadow-2xl ${
                                            isDark ? 'border-slate-800/70 bg-slate-900/60' : 'border-slate-200 bg-white'
                                        }`}
                                    >
                                        <div className="space-y-4">
                                            <div className="inline-flex items-center gap-2 text-sm font-semibold text-pink-400">
                                                <Icon className="h-4 w-4" />
                                                {study.title}
                                            </div>
                                            <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{study.problem}</p>
                                            <p className="text-base font-semibold">{study.result}</p>
                                        </div>
                                        <div className="mt-4 flex flex-wrap gap-2 text-xs">
                                            {study.stack.map((tech) => (
                                                <span key={tech} className={`rounded-full px-3 py-1 ${isDark ? 'bg-white/5 text-white/80' : 'bg-slate-100 text-slate-600'}`}>
                                                    {tech}
                                                </span>
                                            ))}
                                        </div>
                                    </article>
                                </Link>
                            );
                        })}
                    </div>
                </motion.section>

                <motion.section
                    className="grid gap-8 lg:grid-cols-[1.1fr,0.9fr]"
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: 0.7 }}
                >
                    <div className={`rounded-3xl border p-6 shadow-lg ${isDark ? 'border-slate-800/70 bg-slate-900/60' : 'border-slate-200 bg-white/90'}`}>
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-purple-400">Experience trail</p>
                        <div className="mt-6 space-y-4">
                            {TIMELINE.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <div key={item.title} className={`rounded-2xl border p-4 ${isDark ? 'border-white/5 bg-white/5' : 'border-slate-200 bg-white'}`}>
                                        <div className="flex items-center gap-3">
                                            <span className="rounded-2xl bg-purple-500/15 p-2 text-purple-200">
                                                <Icon className="h-5 w-5" />
                                            </span>
                                            <div>
                                                <p className="text-lg font-semibold">{item.title}</p>
                                                <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{item.timeframe}</p>
                                            </div>
                                        </div>
                                        <p className={`mt-3 text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{item.description}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    <div className={`rounded-3xl border p-6 shadow-lg ${isDark ? 'border-slate-800/70 bg-slate-900/60' : 'border-slate-200 bg-white/90'}`}>
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-400">How we collaborate</p>
                        <ul className={`mt-6 space-y-4 text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                            <li className="rounded-2xl border border-white/10 bg-white/5 p-4">Async-first rituals with Loom summaries, figma tokens, and shared decision logs.</li>
                            <li className="rounded-2xl border border-white/10 bg-white/5 p-4">Component libraries arrive with docs, empty states, and performance budgets baked in.</li>
                            <li className="rounded-2xl border border-white/10 bg-white/5 p-4">Hand off kits ship with ready-to-run Storybook links plus Tailwind tokens.</li>
                        </ul>
                        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm">
                            <p className="font-semibold">Tooling</p>
                            <p className={`mt-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Next.js · React · Supabase · Stripe · Linear · Notion · Figma · Framer Motion</p>
                        </div>
                    </div>
                </motion.section>

                <motion.section
                    className="space-y-6"
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: 0.7 }}
                >
                    <div className="space-y-1 text-center">
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-rose-400">Proof of calm delivery</p>
                        <h2 className="text-3xl font-bold">Teams keep coming back</h2>
                    </div>
                    <div className="grid gap-6 lg:grid-cols-3">
                        {TESTIMONIALS.map((testimonial) => (
                            <blockquote key={testimonial.name} className={`rounded-3xl border p-6 text-left shadow-lg ${isDark ? 'border-slate-800/70 bg-slate-900/60' : 'border-slate-200 bg-white'}`}>
                                <p className={`text-base leading-relaxed ${isDark ? 'text-slate-200' : 'text-slate-600'}`}>
                                    “{testimonial.quote}”
                                </p>
                                <footer className="mt-4 text-sm font-semibold">
                                    {testimonial.name}
                                    <span className={`block text-xs font-normal ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{testimonial.role}</span>
                                </footer>
                            </blockquote>
                        ))}
                    </div>
                </motion.section>

                <motion.section
                    className={`rounded-3xl border p-8 text-center shadow-2xl ${isDark ? 'border-slate-800/70 bg-slate-950/70' : 'border-slate-200 bg-white'}`}
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.7 }}
                >
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-400">Next collaboration</p>
                    <h2 className="mt-3 text-3xl font-bold">Let’s design a calmer ship path</h2>
                    <p className={`mt-3 text-base ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                        Drop a brief, bring a challenge, or schedule a 20 minute audit. I respond within a day with a plan and sample timeline.
                    </p>
                    <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                        <Link href="/contact" className="inline-flex items-center justify-center rounded-2xl bg-indigo-600 px-8 py-3 font-semibold text-white shadow-indigo-500/40 transition hover:shadow-indigo-500/60">
                            Book a call
                        </Link>
                        <Link href="/projects" className={`inline-flex items-center justify-center rounded-2xl border px-8 py-3 font-semibold ${isDark ? 'border-slate-700 text-slate-100' : 'border-slate-200 text-slate-800'}`}>
                            Browse projects
                        </Link>
                    </div>
                </motion.section>
            </main>
        </div>
    );
}
