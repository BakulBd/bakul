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

const HERO_PILLS = ['Full stack engineer', 'Design-systems nerd', 'Async-first collaborator'] as const;

const STAT_CARDS: StatCard[] = [
    { label: 'Products shipped', value: '18+', detail: 'SaaS dashboards, fintech, and learning platforms' },
    { label: 'Response window', value: '< 24h', detail: 'Timezone friendly collaboration' },
    { label: 'Experience', value: '3+ yrs', detail: 'Hands-on with modern product teams' },
];

const FOCUS_HIGHLIGHTS: FocusHighlight[] = [
    {
        title: 'Interface polish',
        description: 'Micro interactions, tactile nav, and latency aware UI.',
        icon: SparklesIcon,
    },
    {
        title: 'Systems thinking',
        description: 'Designing APIs, content models, and design tokens that scale.',
        icon: CircleStackIcon,
    },
    {
        title: 'Performance loops',
        description: 'Prefetching, steady themes, and motion tuned for low end hardware.',
        icon: DevicePhoneMobileIcon,
    },
];

const TIMELINE: TimelineItem[] = [
    {
        title: 'Applied AI fellow',
        timeframe: '2025 · Remote',
        description: 'Rapid prototyping of copilots, instructor dashboards, and evaluation tooling.',
        icon: CpuChipIcon,
    },
    {
        title: 'CSE undergrad',
        timeframe: '2023-2026 · Bangladesh',
        description: 'Leading campus initiatives, mentoring peers, and building community tooling.',
        icon: AcademicCapIcon,
    },
    {
        title: 'Freelance builder',
        timeframe: 'Ongoing',
        description: 'Partnering with startups to ship theme aware experiences.',
        icon: RocketLaunchIcon,
    },
];

const CASE_STUDIES: CaseStudy[] = [
    {
        title: 'Commerce OS',
        problem: 'Retail teams needed a single place for merchandising, insights, and checkout.',
        result: '22 percent lift in conversion from a composable storefront.',
        stack: ['Next.js 15', 'Stripe', 'PostgreSQL', 'Tailwind'],
        href: '/projects#commerce-os',
        icon: RocketLaunchIcon,
    },
    {
        title: 'Task HQ',
        problem: 'Distributed ops struggled to see blockers across squads in real time.',
        result: 'Live board with socket updates and trend alerts in under 6 weeks.',
        stack: ['React', 'Node.js', 'Socket.io', 'MongoDB'],
        href: '/projects#task-hq',
        icon: CommandLineIcon,
    },
    {
        title: 'Weather intelligence',
        problem: 'Climate researchers needed granular datasets without jumping between tools.',
        result: 'ML assisted dashboard that cut analysis time by 35 percent.',
        stack: ['React', 'D3', 'Python', 'TensorFlow'],
        href: '/projects#weather-intel',
        icon: LightBulbIcon,
    },
];

const TESTIMONIALS: Testimonial[] = [
    {
        quote:
            'Bakul translated a half-formed brief into a calm system that our non-technical founders actually understand. The weekly loops never slipped.',
        name: 'Safin Rahman',
        role: 'Co-founder, early stage SaaS',
    },
    {
        quote:
            'What impressed me most was the obsession over loading states and docs. Handoffs were so clean that my team shipped extensions without meetings.',
        name: 'Lamia Chowdhury',
        role: 'Product Lead, distributed collective',
    },
    {
        quote: 'He treats performance budgets like product requirements. We shaved 1.2s off LCP and gained trust with stakeholders.',
        name: 'Rehan Sheikh',
        role: 'Engineering Manager, fintech initiative',
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
                            Portfolio snapshot · 2025
                        </div>
                        <div className="space-y-4">
                            <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                                Building lightweight, trustworthy product surfaces for fast-moving teams.
                            </h1>
                            <p className={`text-base leading-relaxed sm:text-lg lg:text-xl ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                                I partner with founders and design pods to ship interfaces that feel instant on any network while keeping the craft warm and human.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {HERO_PILLS.map((pill) => (
                                <span
                                    key={pill}
                                    className={`rounded-full px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${
                                        isDark ? 'bg-white/10 text-slate-200' : 'bg-slate-900/5 text-slate-600'
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
                                Currently shaping calm SaaS tooling, async learning products, and expressive marketing sites for early teams.
                            </p>
                            <div className="flex flex-wrap justify-center gap-2 text-sm">
                                <span className="rounded-full bg-emerald-500/15 px-4 py-1 text-emerald-200">Open to full-time</span>
                                <span className="rounded-full bg-blue-500/15 px-4 py-1 text-blue-200">Remote friendly</span>
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
