'use client';

import EnhancedHero from '@/components/sections/EnhancedHero';
import { SectionWrapper, Card, Button, Badge, StatCard } from '@/components/ui';
import { useIntersectionObserver } from '@/hooks/enhanced';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useState, useRef } from 'react';
import { cn } from '@/lib/utils';

// Stats data
const stats = [
	{ label: 'Projects Completed', value: 50, suffix: '+' },
	{ label: 'Happy Clients', value: 30, suffix: '+' },
	{ label: 'Years Experience', value: 5, suffix: '+' },
	{ label: 'Technologies', value: 25, suffix: '+' },
];

// Featured projects
const featuredProjects = [
	{
		title: 'Portfolio CMS',
		description:
			'A modern portfolio website with integrated blog/vlog CMS built with Next.js and Supabase.',
		image: '/file.svg',
		tech: ['Next.js', 'Supabase', 'TypeScript', 'Tailwind CSS'],
		github: 'https://github.com/bakulahmed/portfolio-cms',
		demo: 'https://bakul.dev',
		featured: true,
	},
	{
		title: 'E-Commerce Platform',
		description:
			'Full-stack e-commerce solution with payment integration and admin dashboard.',
		image: '/globe.svg',
		tech: ['React', 'Node.js', 'MongoDB', 'Stripe'],
		github: 'https://github.com/bakulahmed/ecommerce',
		demo: 'https://ecommerce.bakul.dev',
		featured: true,
	},
	{
		title: 'Task Management App',
		description:
			'Collaborative task management application with real-time updates and team features.',
		image: '/window.svg',
		tech: ['Vue.js', 'Firebase', 'Tailwind CSS'],
		github: 'https://github.com/bakulahmed/taskmanager',
		demo: 'https://tasks.bakul.dev',
		featured: true,
	},
];

// Technologies data
const technologies = [
	{
		category: 'Frontend',
		icon: '🎨',
		gradient: 'from-blue-500 to-cyan-500',
		techs: [
			{ name: 'React', level: 95, color: 'text-blue-600', icon: '⚛️' },
			{ name: 'Next.js', level: 90, color: 'text-gray-700', icon: '▲' },
			{ name: 'TypeScript', level: 88, color: 'text-blue-500', icon: '🔷' },
			{ name: 'Tailwind CSS', level: 92, color: 'text-teal-600', icon: '🎨' },
			{ name: 'Vue.js', level: 85, color: 'text-green-600', icon: '💚' },
			{ name: 'Framer Motion', level: 87, color: 'text-purple-600', icon: '🎭' },
		],
	},
	{
		category: 'Backend',
		icon: '⚙️',
		gradient: 'from-emerald-500 to-teal-500',
		techs: [
			{ name: 'Node.js', level: 90, color: 'text-green-600', icon: '🟢' },
			{ name: 'Python', level: 85, color: 'text-yellow-600', icon: '🐍' },
			{ name: 'Express.js', level: 88, color: 'text-gray-700', icon: '🚀' },
			{ name: 'PostgreSQL', level: 86, color: 'text-blue-700', icon: '🐘' },
			{ name: 'MongoDB', level: 82, color: 'text-green-700', icon: '🍃' },
			{ name: 'Redis', level: 80, color: 'text-red-600', icon: '🔴' },
		],
	},
	{
		category: 'Cloud & DevOps',
		icon: '☁️',
		gradient: 'from-purple-500 to-pink-500',
		techs: [
			{ name: 'AWS', level: 85, color: 'text-orange-600', icon: '☁️' },
			{ name: 'Vercel', level: 92, color: 'text-gray-800', icon: '▲' },
			{ name: 'Docker', level: 83, color: 'text-blue-600', icon: '🐳' },
			{ name: 'GitHub Actions', level: 87, color: 'text-gray-700', icon: '⚡' },
			{ name: 'Supabase', level: 89, color: 'text-green-600', icon: '🔋' },
			{ name: 'Firebase', level: 84, color: 'text-yellow-600', icon: '🔥' },
		],
	},
];

export default function HomePage() {
	const statsRef = useRef<HTMLDivElement>(null);
	const [hasAnimated, setHasAnimated] = useState(false);
	useIntersectionObserver(statsRef, () => {
		if (!hasAnimated) setHasAnimated(true);
	});

	return (
		<main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50/50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 relative overflow-x-hidden">
			{/* Advanced Particle Field */}
			<div className="particle-field">
				{[...Array(15)].map((_, i) => (
					<div
						key={i}
						className="particle"
						style={{
							left: `${Math.random() * 100}%`,
							animationDelay: `${Math.random() * 20}s`,
							animationDuration: `${15 + Math.random() * 10}s`
						}}
					/>
				))}
			</div>

			{/* Premium Galaxy Background with Advanced Effects */}
			<div className="fixed inset-0 pointer-events-none z-0">
				{/* Deep space gradient */}
				<div className="absolute inset-0 bg-gradient-to-br from-slate-900/5 via-indigo-900/10 to-purple-900/5 dark:from-slate-900/90 dark:via-indigo-900/95 dark:to-purple-900/90" />
				
				{/* Animated galaxy background */}
				<div className="absolute inset-0 opacity-30 dark:opacity-60">
					<div className="stars"></div>
					<div className="twinkling"></div>
					<div className="clouds"></div>
					<div className="galaxy-core"></div>
				</div>
				
				{/* Nebula effects */}
				<div className="absolute inset-0">
					<div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-radial from-purple-500/20 via-blue-500/10 to-transparent rounded-full blur-3xl animate-pulse" />
					<div className="absolute top-3/4 right-1/4 w-80 h-80 bg-gradient-radial from-pink-500/20 via-purple-500/10 to-transparent rounded-full blur-3xl animate-pulse delay-1000" />
					<div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-gradient-radial from-cyan-500/20 via-blue-500/10 to-transparent rounded-full blur-3xl animate-pulse delay-2000" />
				</div>
				
				{/* Cosmic dust particles */}
				<div className="absolute inset-0">
					<div className="cosmic-particles"></div>
					<div className="shooting-stars"></div>
				</div>
			</div>

			{/* Enhanced Background Elements */}
			<div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.12)_0,transparent_50%),radial-gradient(circle_at_70%_80%,rgba(147,51,234,0.12)_0,transparent_50%)] pointer-events-none" />

			{/* Premium Floating Orbs with Advanced Galaxy Effects */}
			<div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
				{/* Primary cosmic orbs with liquid morphing */}
				<div className="absolute -top-32 -right-32 w-96 h-96 bg-gradient-to-br from-blue-400/20 via-purple-400/12 to-indigo-400/20 rounded-full blur-3xl animate-pulse">
					<div className="absolute inset-4 bg-gradient-to-br from-white/25 to-transparent rounded-full animate-liquid-morph"></div>
					<div className="absolute inset-8 bg-gradient-to-br from-blue-300/30 to-purple-300/20 rounded-full animate-energy-flow"></div>
				</div>
				<div className="absolute top-1/4 -left-32 w-96 h-96 bg-gradient-to-br from-purple-400/20 via-pink-400/12 to-rose-400/20 rounded-full blur-3xl animate-pulse delay-1000">
					<div className="absolute inset-4 bg-gradient-to-br from-white/25 to-transparent rounded-full animate-liquid-morph" style={{ animationDelay: '2s' }}></div>
					<div className="absolute inset-8 bg-gradient-to-br from-purple-300/30 to-pink-300/20 rounded-full animate-energy-flow" style={{ animationDelay: '1s' }}></div>
				</div>
				<div className="absolute bottom-32 right-32 w-96 h-96 bg-gradient-to-br from-indigo-400/20 via-blue-400/12 to-cyan-400/20 rounded-full blur-3xl animate-pulse delay-2000">
					<div className="absolute inset-4 bg-gradient-to-br from-white/25 to-transparent rounded-full animate-liquid-morph" style={{ animationDelay: '3s' }}></div>
					<div className="absolute inset-8 bg-gradient-to-br from-indigo-300/30 to-cyan-300/20 rounded-full animate-energy-flow" style={{ animationDelay: '2s' }}></div>
				</div>
				
				{/* Secondary orbital elements */}
				<div className="absolute top-1/6 right-1/5 w-48 h-48 bg-gradient-to-br from-emerald-400/15 via-teal-400/8 to-green-400/15 rounded-full blur-2xl animate-quantum-shift">
					<div className="absolute inset-3 bg-gradient-to-br from-white/20 to-transparent rounded-full animate-holographic"></div>
				</div>
				<div className="absolute bottom-1/5 left-1/6 w-32 h-32 bg-gradient-to-br from-orange-400/15 via-yellow-400/8 to-amber-400/15 rounded-full blur-xl animate-quantum-shift delay-1500">
					<div className="absolute inset-2 bg-gradient-to-br from-white/20 to-transparent rounded-full animate-holographic" style={{ animationDelay: '1s' }}></div>
				</div>
				
				{/* Enhanced floating particles with rainbow effects */}
				<div className="absolute top-1/2 left-1/2 w-3 h-3 bg-gradient-to-br from-white to-blue-300 rounded-full animate-bounce-slow shadow-2xl opacity-80 animate-text-rainbow border border-white/20" />
				<div className="absolute top-1/3 right-1/3 w-2 h-2 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full animate-bounce-slow delay-1000 shadow-xl opacity-90 animate-energy-flow border border-purple-200/30" />
				<div className="absolute bottom-1/3 left-1/4 w-2.5 h-2.5 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-full animate-bounce-slow delay-2000 shadow-xl opacity-85 animate-liquid-morph border border-blue-200/30" />
				<div className="absolute top-2/3 right-1/4 w-2 h-2 bg-gradient-to-br from-pink-400 to-rose-400 rounded-full animate-bounce-slow delay-3000 shadow-lg opacity-75 animate-holographic border border-pink-200/30" />
				<div className="absolute top-1/4 left-1/6 w-1.5 h-1.5 bg-gradient-to-br from-cyan-400 to-teal-400 rounded-full animate-bounce-slow shadow-lg opacity-70 animate-quantum-shift border border-cyan-200/30" style={{ animationDelay: '4s' }} />
				<div className="absolute bottom-1/4 right-1/6 w-2.5 h-2.5 bg-gradient-to-br from-indigo-400 to-purple-400 rounded-full animate-bounce-slow shadow-xl opacity-80 animate-energy-flow border border-indigo-200/30" style={{ animationDelay: '5s' }} />
				
				{/* Crystal gleam particles */}
				<div className="absolute top-1/5 left-2/3 w-1 h-1 bg-white rounded-full animate-crystal-gleam opacity-60 shadow-sm" />
				<div className="absolute bottom-1/5 right-2/3 w-1 h-1 bg-white rounded-full animate-crystal-gleam opacity-70 shadow-sm" style={{ animationDelay: '2s' }} />
				<div className="absolute top-3/5 left-1/5 w-1 h-1 bg-white rounded-full animate-crystal-gleam opacity-50 shadow-sm" style={{ animationDelay: '4s' }} />
				
				{/* Premium enhanced light rays */}
				<div className="absolute top-0 left-1/4 w-px h-40 bg-gradient-to-b from-white/30 via-blue-300/20 to-transparent animate-pulse">
					<div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent animate-crystal-gleam"></div>
				</div>
				<div className="absolute top-0 right-1/3 w-px h-32 bg-gradient-to-b from-purple-400/40 via-pink-300/25 to-transparent animate-pulse delay-1000">
					<div className="absolute inset-0 bg-gradient-to-b from-purple-200/15 to-transparent animate-crystal-gleam" style={{ animationDelay: '1s' }}></div>
				</div>
				<div className="absolute bottom-0 left-1/3 w-px h-36 bg-gradient-to-t from-blue-400/35 via-cyan-300/20 to-transparent animate-pulse delay-2000">
					<div className="absolute inset-0 bg-gradient-to-t from-blue-200/15 to-transparent animate-crystal-gleam" style={{ animationDelay: '2s' }}></div>
				</div>
				<div className="absolute top-0 left-3/4 w-px h-28 bg-gradient-to-b from-emerald-400/30 via-teal-300/18 to-transparent animate-pulse delay-3000">
					<div className="absolute inset-0 bg-gradient-to-b from-emerald-200/12 to-transparent animate-crystal-gleam" style={{ animationDelay: '3s' }}></div>
				</div>
				
				{/* Holographic energy rings */}
				<div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 border border-white/10 rounded-full animate-holographic opacity-30"></div>
				<div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 border border-purple-300/15 rounded-full animate-holographic opacity-25" style={{ animationDelay: '1s' }}></div>
				<div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 border border-blue-300/20 rounded-full animate-holographic opacity-35" style={{ animationDelay: '2s' }}></div>
			</div>

			{/* Custom CSS for Galaxy Effects */}
			<style jsx>{`
				@keyframes rotate {
					from { transform: rotate(0deg); }
					to { transform: rotate(360deg); }
				}
				
				@keyframes move-twink-back {
					from { background-position: 0 0; }
					to { background-position: -10000px 5000px; }
				}
				
				@keyframes move-clouds-back {
					from { background-position: 0 0; }
					to { background-position: 10000px 0; }
				}
				
				@keyframes galaxy-pulse {
					0%, 100% { opacity: 0.6; transform: scale(1) rotate(0deg); }
					25% { opacity: 0.8; transform: scale(1.05) rotate(90deg); }
					50% { opacity: 1; transform: scale(1.1) rotate(180deg); }
					75% { opacity: 0.8; transform: scale(1.05) rotate(270deg); }
				}
				
				@keyframes cosmic-float {
					0%, 100% { transform: translateY(0px) rotate(0deg) scale(1); }
					25% { transform: translateY(-15px) rotate(90deg) scale(1.1); }
					50% { transform: translateY(-10px) rotate(180deg) scale(0.9); }
					75% { transform: translateY(5px) rotate(270deg) scale(1.05); }
				}
				
				@keyframes shooting-star {
					0% { transform: translateX(-200px) translateY(-200px) rotate(45deg); opacity: 0; box-shadow: 0 0 0 transparent; }
					5% { opacity: 1; box-shadow: 0 0 20px rgba(255,255,255,0.8); }
					10% { box-shadow: 0 0 40px rgba(147,51,234,0.6), 0 0 80px rgba(59,130,246,0.4); }
					85% { opacity: 1; }
					95% { opacity: 0.3; box-shadow: 0 0 10px rgba(255,255,255,0.3); }
					100% { transform: translateX(1200px) translateY(1200px) rotate(45deg); opacity: 0; box-shadow: 0 0 0 transparent; }
				}
				
				@keyframes aurora {
					0%, 100% { opacity: 0.3; transform: translateX(-50%) scaleY(1); }
					25% { opacity: 0.6; transform: translateX(-40%) scaleY(1.2); }
					50% { opacity: 0.8; transform: translateX(-60%) scaleY(0.8); }
					75% { opacity: 0.5; transform: translateX(-45%) scaleY(1.1); }
				}
				
				@keyframes float-gentle {
					0%, 100% { transform: translateY(0px) scale(1); }
					50% { transform: translateY(-20px) scale(1.05); }
				}
				
				@keyframes glow-pulse {
					0%, 100% { box-shadow: 0 0 20px rgba(147,51,234,0.3), 0 0 40px rgba(59,130,246,0.2); }
					50% { box-shadow: 0 0 40px rgba(147,51,234,0.6), 0 0 80px rgba(59,130,246,0.4), 0 0 120px rgba(236,72,153,0.2); }
				}
				
				@keyframes text-shimmer {
					0% { background-position: -200% center; }
					100% { background-position: 200% center; }
				}
				
				@keyframes morph {
					0%, 100% { border-radius: 60% 40% 30% 70%/60% 30% 70% 40%; }
					50% { border-radius: 30% 60% 70% 40%/50% 60% 30% 60%; }
				}
				
				@keyframes gradient-shift {
					0%, 100% { background-position: 0% 50%; }
					50% { background-position: 100% 50%; }
				}
				
				@keyframes bounce-slow {
					0%, 100% { transform: translateY(0); }
					50% { transform: translateY(-10px); }
				}
				
				@keyframes scale-pulse {
					0%, 100% { transform: scale(1); }
					50% { transform: scale(1.05); }
				}
				
				@keyframes float-smooth {
					0%, 100% { transform: translateY(0px) rotate(0deg); }
					50% { transform: translateY(-15px) rotate(2deg); }
				}
				
				@keyframes shimmer-wave {
					0% { transform: translateX(-100%); }
					100% { transform: translateX(100%); }
				}
				
				@keyframes color-cycle {
					0%, 100% { filter: hue-rotate(0deg); }
					25% { filter: hue-rotate(90deg); }
					50% { filter: hue-rotate(180deg); }
					75% { filter: hue-rotate(270deg); }
				}
				
				@keyframes magnetic-pull {
					0%, 100% { transform: scale(1) rotate(0deg); }
					50% { transform: scale(1.1) rotate(5deg); }
				}
				
				@keyframes breath {
					0%, 100% { transform: scale(1) rotateY(0deg); }
					50% { transform: scale(1.03) rotateY(5deg); }
				}

				@keyframes liquid-morph {
					0%, 100% { 
						border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%;
						transform: rotate(0deg) scale(1);
					}
					25% { 
						border-radius: 40% 60% 70% 30% / 40% 70% 30% 60%;
						transform: rotate(90deg) scale(1.1);
					}
					50% { 
						border-radius: 70% 30% 40% 60% / 70% 40% 60% 30%;
						transform: rotate(180deg) scale(0.9);
					}
					75% { 
						border-radius: 30% 70% 60% 40% / 30% 60% 40% 70%;
						transform: rotate(270deg) scale(1.05);
					}
				}

				@keyframes energy-flow {
					0%, 100% { 
						box-shadow: 
							0 0 20px rgba(59, 130, 246, 0.5),
							0 0 40px rgba(59, 130, 246, 0.3),
							0 0 60px rgba(59, 130, 246, 0.1);
					}
					33% { 
						box-shadow: 
							0 0 30px rgba(147, 51, 234, 0.7),
							0 0 60px rgba(147, 51, 234, 0.4),
							0 0 90px rgba(147, 51, 234, 0.2);
					}
					66% { 
						box-shadow: 
							0 0 25px rgba(236, 72, 153, 0.6),
							0 0 50px rgba(236, 72, 153, 0.3),
							0 0 75px rgba(236, 72, 153, 0.1);
					}
				}

				@keyframes text-rainbow {
					0%, 100% { 
						background: linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1);
						-webkit-background-clip: text;
						background-clip: text;
						-webkit-text-fill-color: transparent;
					}
					25% { 
						background: linear-gradient(45deg, #4ecdc4, #45b7d1, #96ceb4);
						-webkit-background-clip: text;
						background-clip: text;
						-webkit-text-fill-color: transparent;
					}
					50% { 
						background: linear-gradient(45deg, #45b7d1, #96ceb4, #ff6b6b);
						-webkit-background-clip: text;
						background-clip: text;
						-webkit-text-fill-color: transparent;
					}
					75% { 
						background: linear-gradient(45deg, #96ceb4, #ff6b6b, #4ecdc4);
						-webkit-background-clip: text;
						background-clip: text;
						-webkit-text-fill-color: transparent;
					}
				}

				@keyframes holographic {
					0%, 100% { 
						filter: hue-rotate(0deg) brightness(1) contrast(1);
						background-position: 0% 50%;
					}
					25% { 
						filter: hue-rotate(90deg) brightness(1.2) contrast(1.1);
						background-position: 100% 50%;
					}
					50% { 
						filter: hue-rotate(180deg) brightness(0.9) contrast(1.2);
						background-position: 200% 50%;
					}
					75% { 
						filter: hue-rotate(270deg) brightness(1.1) contrast(0.9);
						background-position: 300% 50%;
					}
				}

				@keyframes crystal-gleam {
					0%, 100% { 
						background: linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%);
						transform: translateX(-100%) skewX(-25deg);
					}
					50% { 
						background: linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%);
						transform: translateX(100%) skewX(-25deg);
					}
				}

				@keyframes quantum-shift {
					0%, 100% { 
						opacity: 1;
						transform: scale(1) rotate(0deg);
						filter: blur(0px);
					}
					25% { 
						opacity: 0.8;
						transform: scale(1.02) rotate(1deg);
						filter: blur(0.5px);
					}
					50% { 
						opacity: 0.9;
						transform: scale(0.98) rotate(-1deg);
						filter: blur(0.3px);
					}
					75% { 
						opacity: 0.95;
						transform: scale(1.01) rotate(0.5deg);
						filter: blur(0.2px);
					}
				}

				.stars, .twinkling, .clouds {
					position: absolute;
					top: 0;
					left: 0;
					right: 0;
					bottom: 0;
				}

				.stars {
					background: #000 url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="20" cy="20" r="0.5" fill="white" opacity="0.8"/><circle cx="80" cy="10" r="0.3" fill="white" opacity="0.6"/><circle cx="50" cy="50" r="0.4" fill="white" opacity="0.9"/><circle cx="90" cy="80" r="0.2" fill="white" opacity="0.7"/><circle cx="10" cy="90" r="0.6" fill="white" opacity="0.5"/><circle cx="70" cy="30" r="0.3" fill="white" opacity="0.8"/><circle cx="30" cy="70" r="0.4" fill="white" opacity="0.6"/></svg>') repeat;
					background-size: 200px 200px;
					animation: move-twink-back 200s linear infinite;
				}

				.twinkling {
					background: transparent url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="25" cy="25" r="0.3" fill="white" opacity="0.4"><animate attributeName="opacity" values="0.4;1;0.4" dur="3s" repeatCount="indefinite"/></circle><circle cx="75" cy="15" r="0.2" fill="white" opacity="0.6"><animate attributeName="opacity" values="0.6;0.2;0.6" dur="2s" repeatCount="indefinite"/></circle><circle cx="45" cy="55" r="0.4" fill="white" opacity="0.3"><animate attributeName="opacity" values="0.3;0.9;0.3" dur="4s" repeatCount="indefinite"/></circle></svg>') repeat;
					background-size: 300px 300px;
					animation: move-twink-back 100s linear infinite;
				}

				.clouds {
					background: transparent url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><ellipse cx="30" cy="30" rx="8" ry="3" fill="rgba(255,255,255,0.1)" transform="rotate(20)"/><ellipse cx="70" cy="60" rx="12" ry="4" fill="rgba(147,51,234,0.1)" transform="rotate(-30)"/><ellipse cx="50" cy="80" rx="6" ry="2" fill="rgba(59,130,246,0.1)" transform="rotate(45)"/></svg>') repeat;
					background-size: 500px 500px;
					animation: move-clouds-back 200s linear infinite;
				}
				
				.galaxy-core {
					position: absolute;
					top: 50%;
					left: 50%;
					width: 400px;
					height: 400px;
					margin: -200px 0 0 -200px;
					background: radial-gradient(circle, rgba(147,51,234,0.3) 0%, rgba(59,130,246,0.2) 30%, transparent 70%);
					border-radius: 50%;
					animation: galaxy-pulse 8s ease-in-out infinite, rotate 120s linear infinite;
				}
				
				.cosmic-particles {
					position: absolute;
					width: 100%;
					height: 100%;
				}
				
				.cosmic-particles::before,
				.cosmic-particles::after {
					content: '';
					position: absolute;
					width: 2px;
					height: 2px;
					background: white;
					border-radius: 50%;
					box-shadow: 
						100px 200px 0 rgba(255,255,255,0.5),
						300px 100px 0 rgba(147,51,234,0.7),
						500px 400px 0 rgba(59,130,246,0.6),
						700px 50px 0 rgba(236,72,153,0.5),
						200px 600px 0 rgba(255,255,255,0.4),
						800px 300px 0 rgba(139,92,246,0.6),
						150px 450px 0 rgba(59,130,246,0.3),
						600px 150px 0 rgba(255,255,255,0.7),
						450px 350px 0 rgba(147,51,234,0.4);
					animation: cosmic-float 20s ease-in-out infinite;
				}
				
				.cosmic-particles::after {
					animation-delay: -10s;
					transform: scale(0.5);
				}
				
				.shooting-stars {
					position: absolute;
					width: 100%;
					height: 100%;
				}
				
				.shooting-stars::before,
				.shooting-stars::after {
					content: '';
					position: absolute;
					width: 2px;
					height: 2px;
					background: linear-gradient(45deg, transparent, rgba(255,255,255,0.8), transparent);
					animation: shooting-star 15s linear infinite;
				}
				
				.shooting-stars::after {
					animation-delay: 7s;
					top: 30%;
					left: 20%;
				}
				
				.animate-spin-slow {
					animation: rotate 20s linear infinite;
				}
				
				.bg-gradient-radial {
					background: radial-gradient(circle, var(--tw-gradient-stops));
				}
				
				.animate-morph {
					animation: morph 8s ease-in-out infinite;
				}
				
				.animate-gradient {
					background-size: 400% 400%;
					animation: gradient-shift 8s ease infinite;
				}
				
				.animate-bounce-slow {
					animation: bounce-slow 3s ease-in-out infinite;
				}
				
				.animate-scale-pulse {
					animation: scale-pulse 4s ease-in-out infinite;
				}
				
				.animate-liquid-morph {
					animation: liquid-morph 12s ease-in-out infinite;
				}
				
				.animate-energy-flow {
					animation: energy-flow 6s ease-in-out infinite;
				}
				
				.animate-text-rainbow {
					animation: text-rainbow 8s ease-in-out infinite;
				}
				
				.animate-holographic {
					background-size: 400% 400%;
					animation: holographic 10s ease-in-out infinite;
				}
				
				.animate-crystal-gleam {
					animation: crystal-gleam 3s linear infinite;
				}
				
				.animate-quantum-shift {
					animation: quantum-shift 4s ease-in-out infinite;
				}
				
				.glass-card {
					background: rgba(255, 255, 255, 0.05);
					backdrop-filter: blur(20px);
					border: 1px solid rgba(255, 255, 255, 0.1);
				}
				
				.magnetic-hover:hover {
					transform: translateY(-12px) scale(1.03);
					box-shadow: 
						0 25px 50px rgba(0, 0, 0, 0.15),
						0 0 30px rgba(59, 130, 246, 0.3),
						0 0 60px rgba(147, 51, 234, 0.2);
				}
				
				.shimmer-effect {
					position: relative;
					overflow: hidden;
				}
				
				.shimmer-effect::before {
					content: '';
					position: absolute;
					top: 0;
					left: -100%;
					width: 100%;
					height: 100%;
					background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
					animation: crystal-gleam 3s infinite;
				}
				
				.gradient-border {
					position: relative;
					background: linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4);
					background-size: 400% 400%;
					animation: gradientShift 8s ease infinite;
					padding: 2px;
					border-radius: 24px;
				}
				
				.gradient-border-content {
					background: white;
					border-radius: 22px;
					padding: 20px;
				}
				
				.dark .gradient-border-content {
					background: rgb(15, 23, 42);
				}
				
				.hover-glow:hover {
					box-shadow: 0 0 30px rgba(147,51,234,0.4), 0 0 60px rgba(59,130,246,0.3), 0 0 90px rgba(236,72,153,0.2);
					transform: translateY(-8px) scale(1.02);
				}
				
				.text-shimmer {
					background: linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent);
					background-size: 200% 100%;
					animation: text-shimmer 3s ease-in-out infinite;
				}

				/* Premium Glass Effects */
				.glass-card {
					background: rgba(255, 255, 255, 0.1);
					backdrop-filter: blur(20px);
					border: 1px solid rgba(255, 255, 255, 0.2);
					box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
				}

				.glass-card-dark {
					background: rgba(15, 23, 42, 0.8);
					backdrop-filter: blur(20px);
					border: 1px solid rgba(148, 163, 184, 0.2);
					box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.5);
				}

				/* Magnetic Hover Effects */
				.magnetic-hover {
					transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
				}

				.magnetic-hover:hover {
					transform: translateY(-12px) scale(1.05);
					box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25),
								0 0 0 1px rgba(255, 255, 255, 0.1),
								0 0 40px rgba(59, 130, 246, 0.3);
				}

				/* Shimmer Effects */
				.shimmer-effect {
					position: relative;
					overflow: hidden;
				}

				.shimmer-effect::before {
					content: '';
					position: absolute;
					top: 0;
					left: -100%;
					width: 100%;
					height: 100%;
					background: linear-gradient(
						90deg,
						transparent,
						rgba(255, 255, 255, 0.1),
						transparent
					);
					transition: left 0.8s;
				}

				.shimmer-effect:hover::before {
					left: 100%;
				}

				/* Gradient Border Effects */
				.gradient-border {
					position: relative;
					padding: 3px;
					background: linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4);
					background-size: 400% 400%;
					animation: gradientShift 8s ease infinite;
					border-radius: 24px;
				}

				.gradient-border-content {
					background: rgba(255, 255, 255, 0.95);
					border-radius: 21px;
					padding: 20px;
				}

				.dark .gradient-border-content {
					background: rgba(15, 23, 42, 0.95);
				}

				/* Neon Glow Effects */
				.neon-glow {
					text-shadow: 
						0 0 5px currentColor,
						0 0 10px currentColor,
						0 0 15px currentColor,
						0 0 20px #ff6b6b,
						0 0 35px #ff6b6b,
						0 0 40px #ff6b6b;
					animation: neonFlicker 2s infinite alternate;
				}

				@keyframes neonFlicker {
					0%, 100% { opacity: 1; }
					50% { opacity: 0.8; }
				}

				/* Holographic Text Effects */
				.holographic-text {
					background: linear-gradient(
						45deg,
						#ff6b6b 0%,
						#4ecdc4 25%,
						#45b7d1 50%,
						#96ceb4 75%,
						#ff6b6b 100%
					);
					background-size: 400% 400%;
					-webkit-background-clip: text;
					background-clip: text;
					-webkit-text-fill-color: transparent;
					animation: holographicShift 3s ease-in-out infinite;
				}

				@keyframes holographicShift {
					0%, 100% { background-position: 0% 50%; }
					50% { background-position: 100% 50%; }
				}

				/* Premium Particle Effects */
				.particle-field {
					position: absolute;
					width: 100%;
					height: 100%;
					pointer-events: none;
				}

				.particle {
					position: absolute;
					width: 2px;
					height: 2px;
					background: rgba(255, 255, 255, 0.8);
					border-radius: 50%;
					animation: particleFloat 20s infinite linear;
				}

				@keyframes particleFloat {
					0% {
						transform: translateY(100vh) translateX(0) rotate(0deg);
						opacity: 0;
					}
					10% {
						opacity: 1;
					}
					90% {
						opacity: 1;
					}
					100% {
						transform: translateY(-100vh) translateX(100px) rotate(360deg);
						opacity: 0;
					}
				}

				/* Advanced 3D Effects */
				.card-3d {
					transform-style: preserve-3d;
					transition: transform 0.6s cubic-bezier(0.23, 1, 0.32, 1);
				}

				.card-3d:hover {
					transform: rotateX(10deg) rotateY(10deg) translateZ(20px);
				}

				/* Liquid Morphing Backgrounds */
				.liquid-bg {
					background: linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1);
					background-size: 400% 400%;
					animation: liquidMorph 8s ease-in-out infinite;
					border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%;
				}

				@keyframes liquidMorph {
					0%, 100% {
						background-position: 0% 50%;
						border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%;
					}
					50% {
						background-position: 100% 50%;
						border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%;
					}
				}

				/* Enhanced Energy Effects */
				.energy-pulse {
					animation: energyPulse 4s ease-in-out infinite;
				}

				@keyframes energyPulse {
					0%, 100% {
						box-shadow: 
							0 0 20px rgba(59, 130, 246, 0.5),
							0 0 40px rgba(59, 130, 246, 0.3),
							0 0 60px rgba(59, 130, 246, 0.1),
							inset 0 0 20px rgba(59, 130, 246, 0.1);
					}
					50% {
						box-shadow: 
							0 0 40px rgba(147, 51, 234, 0.8),
							0 0 80px rgba(147, 51, 234, 0.5),
							0 0 120px rgba(147, 51, 234, 0.3),
							inset 0 0 40px rgba(147, 51, 234, 0.2);
					}
				}
				
				.animate-float-smooth {
					animation: float-smooth 6s ease-in-out infinite;
				}
				
				.animate-magnetic {
					animation: magnetic-pull 4s ease-in-out infinite;
				}
				
				.animate-breath {
					animation: breath 5s ease-in-out infinite;
				}
				
				.animate-color-cycle {
					animation: color-cycle 10s ease-in-out infinite;
				}
				
				.shimmer-effect {
					position: relative;
					overflow: hidden;
				}
				
				.shimmer-effect::before {
					content: '';
					position: absolute;
					top: 0;
					left: -100%;
					width: 100%;
					height: 100%;
					background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
					animation: shimmer-wave 3s ease-in-out infinite;
					z-index: 1;
				}
				
				.glass-card {
					background: rgba(255, 255, 255, 0.1);
					backdrop-filter: blur(20px);
					border: 1px solid rgba(255, 255, 255, 0.2);
				}
				
				.dark .glass-card {
					background: rgba(0, 0, 0, 0.2);
					border: 1px solid rgba(255, 255, 255, 0.1);
				}
				
				.magnetic-hover {
					transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
				}
				
				.magnetic-hover:hover {
					transform: translateY(-12px) scale(1.05) rotateX(5deg);
					box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
				}
				
				.gradient-border {
					position: relative;
					background: linear-gradient(45deg, #667eea 0%, #764ba2 100%);
					padding: 2px;
					border-radius: 24px;
				}
				
				.gradient-border-content {
					background: white;
					border-radius: 22px;
					padding: 24px;
				}
				
				.dark .gradient-border-content {
					background: rgb(15 23 42);
				}
			`}</style>

			{/* Hero Section - Enhanced with Premium Effects */}
			<section className="relative z-10 overflow-hidden">
				{/* Premium hero background overlay */}
				<div className="absolute inset-0 bg-gradient-to-br from-transparent via-blue-50/20 to-purple-50/30 dark:from-transparent dark:via-blue-950/30 dark:to-purple-950/40 pointer-events-none" />
				
				{/* Holographic grid overlay */}
				<div className="absolute inset-0 opacity-20 dark:opacity-40 pointer-events-none">
					<div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.1)_1px,transparent_1px)] bg-[size:50px_50px] animate-holographic" />
				</div>
				
				{/* Energy field rings */}
				<div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
					<div className="w-[800px] h-[800px] border border-blue-300/20 rounded-full animate-energy-flow opacity-30" />
					<div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-purple-300/25 rounded-full animate-energy-flow opacity-40" style={{ animationDelay: '1s' }} />
					<div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border border-indigo-300/30 rounded-full animate-energy-flow opacity-50" style={{ animationDelay: '2s' }} />
				</div>
				
				{/* Quantum particles */}
				<div className="absolute inset-0 pointer-events-none">
					<div className="absolute top-1/4 left-1/6 w-2 h-2 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full animate-quantum-shift opacity-60 shadow-lg" />
					<div className="absolute top-1/3 right-1/5 w-1.5 h-1.5 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full animate-quantum-shift opacity-70 shadow-md" style={{ animationDelay: '1s' }} />
					<div className="absolute bottom-1/3 left-1/4 w-2.5 h-2.5 bg-gradient-to-br from-indigo-400 to-cyan-400 rounded-full animate-quantum-shift opacity-65 shadow-lg" style={{ animationDelay: '2s' }} />
					<div className="absolute top-2/3 right-1/3 w-1 h-1 bg-gradient-to-br from-cyan-400 to-teal-400 rounded-full animate-quantum-shift opacity-55 shadow-sm" style={{ animationDelay: '3s' }} />
					<div className="absolute bottom-1/4 right-1/6 w-1.5 h-1.5 bg-gradient-to-br from-emerald-400 to-green-400 rounded-full animate-quantum-shift opacity-60 shadow-md" style={{ animationDelay: '4s' }} />
				</div>
				
				<EnhancedHero />
				
				{/* Enhanced gradient overlay with shimmer */}
				<div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-white/98 via-white/80 to-transparent dark:from-slate-900/98 dark:via-slate-900/80 pointer-events-none">
					<div className="absolute inset-0 bg-gradient-to-t from-blue-50/50 via-transparent to-transparent dark:from-blue-950/30 animate-crystal-gleam" />
				</div>
			</section>

			{/* Stats Section - Enhanced Layout */}
			<SectionWrapper className="relative bg-gradient-to-br from-white/95 via-blue-50/40 to-indigo-50/60 dark:from-slate-900/98 dark:via-indigo-950/40 dark:to-slate-800/60 z-10 overflow-hidden">
				{/* Premium Background Elements */}
				<div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.1),transparent_50%)] pointer-events-none" />
				<div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-3xl animate-morph" />
				<div className="absolute bottom-0 right-1/4 w-80 h-80 bg-gradient-to-br from-indigo-400/10 to-cyan-400/10 rounded-full blur-3xl animate-morph delay-1000" />
				
				<div className="container mx-auto px-4 py-24 lg:py-32 relative z-10">
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						className="text-center mb-20"
					>
						<h2 className="text-5xl md:text-7xl font-black mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent tracking-tight animate-gradient">
							Portfolio Stats
						</h2>
						<p className="text-xl md:text-2xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed">
							Numbers that reflect my commitment to{' '}
							<span className="font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
								excellence
							</span>
						</p>
					</motion.div>
					<div
						ref={statsRef}
						className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 max-w-6xl mx-auto"
					>
						{stats.map((stat, index) => (
							<motion.div
								key={stat.label}
								initial={{ opacity: 0, y: 20 }}
								animate={hasAnimated ? { opacity: 1, y: 0 } : {}}
								transition={{ delay: index * 0.15, duration: 0.6 }}
								className="group"
							>
								<div className="transition-all duration-700 group-hover:-translate-y-8 group-hover:scale-115 magnetic-hover shimmer-effect animate-quantum-shift">
									<div className="gradient-border animate-liquid-morph" style={{ animationDelay: `${index * 0.3}s` }}>
										<div className="gradient-border-content">
											<StatCard
												label={stat.label}
												value={stat.value}
												suffix={stat.suffix}
												gradient="from-blue-600 via-purple-600 to-indigo-600"
												className="animate-energy-flow"
												style={{ animationDelay: `${index * 0.2}s` }}
											/>
										</div>
									</div>
								</div>
							</motion.div>
						))}
					</div>
				</div>
			</SectionWrapper>

			{/* Services Section - Premium Addition */}
			<SectionWrapper className="relative bg-gradient-to-br from-indigo-50/80 via-white/70 to-blue-50/80 dark:from-indigo-950/80 dark:via-slate-900/70 dark:to-blue-950/80 z-10 overflow-hidden">
				{/* Premium Background Elements */}
				<div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.1),transparent_50%)] pointer-events-none" />
				<div className="absolute top-1/2 left-1/4 w-96 h-96 bg-gradient-to-br from-indigo-400/8 to-blue-400/8 rounded-full blur-3xl animate-morph delay-1500" />
				<div className="absolute bottom-1/2 right-1/4 w-80 h-80 bg-gradient-to-bl from-blue-400/8 to-cyan-400/8 rounded-full blur-3xl animate-morph delay-2500" />
				
				<div className="container mx-auto px-4 py-24 lg:py-32">
					<div className="text-center mb-20">
						<motion.h2
							initial={{ opacity: 0, y: 20 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true }}
							className="text-5xl md:text-7xl font-black mb-6 bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent tracking-tight animate-gradient"
						>
							My Services
						</motion.h2>
						<motion.p
							initial={{ opacity: 0, y: 20 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true }}
							transition={{ delay: 0.1 }}
							className="text-xl md:text-2xl text-slate-600 dark:text-slate-400 max-w-4xl mx-auto leading-relaxed"
						>
							Comprehensive solutions to bring your{' '}
							<span className="font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
								digital vision to life
							</span>
						</motion.p>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 lg:gap-12 max-w-7xl mx-auto">
						{[
							{
								title: 'Web Development',
								description: 'Custom websites and web applications built with modern technologies and best practices.',
								icon: '🌐',
								gradient: 'from-blue-500 to-cyan-500',
								features: ['React/Next.js', 'TypeScript', 'Responsive Design', 'Performance Optimization']
							},
							{
								title: 'Full-Stack Development',
								description: 'End-to-end solutions including backend APIs, databases, and seamless integrations.',
								icon: '⚡',
								gradient: 'from-indigo-500 to-purple-500',
								features: ['API Development', 'Database Design', 'Authentication', 'Cloud Deployment']
							},
							{
								title: 'UI/UX Design',
								description: 'Beautiful, intuitive interfaces that provide exceptional user experiences.',
								icon: '🎨',
								gradient: 'from-purple-500 to-pink-500',
								features: ['User Research', 'Wireframing', 'Prototyping', 'Design Systems']
							}
						].map((service, index) => (
							<motion.div
								key={service.title}
								initial={{ opacity: 0, y: 30 }}
								whileInView={{ opacity: 1, y: 0 }}
								viewport={{ once: true }}
								transition={{ delay: index * 0.15, duration: 0.6 }}
								className="group"
							>
								<Card
									variant="premium"
									hover
									className="h-full glass-card backdrop-blur-xl border-0 shadow-2xl hover:shadow-indigo-500/30 dark:hover:shadow-indigo-400/30 hover:-translate-y-8 hover:scale-[1.05] transition-all duration-700 rounded-3xl overflow-hidden magnetic-hover shimmer-effect animate-breath"
								>
									<div className="p-8 lg:p-10 h-full flex flex-col">
										{/* Service Icon */}
										<div className={`text-7xl p-8 rounded-3xl shadow-2xl bg-gradient-to-r ${service.gradient} text-white mb-8 w-fit group-hover:scale-150 group-hover:rotate-12 transition-all duration-700 animate-magnetic mx-auto shimmer-effect`}>
											{service.icon}
										</div>
										
										{/* Service Content */}
										<div className="text-center flex-1 flex flex-col">
											<h3 className="text-3xl font-black text-slate-900 dark:text-white group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-indigo-600 group-hover:to-blue-600 group-hover:bg-clip-text transition-all duration-500 mb-4">
												{service.title}
											</h3>
											<p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed mb-6 flex-1">
												{service.description}
											</p>
											
											{/* Features */}
											<div className="space-y-3">
												{service.features.map((feature) => (
													<div
														key={feature}
														className="flex items-center justify-center gap-3 text-sm font-semibold text-slate-700 dark:text-slate-300"
													>
														<div className={`w-2 h-2 rounded-full bg-gradient-to-r ${service.gradient}`} />
														{feature}
													</div>
												))}
											</div>
										</div>
									</div>
								</Card>
							</motion.div>
						))}
					</div>
				</div>
			</SectionWrapper>

			{/* Technologies Section - Premium Enhanced with Holographic Effects */}
			<SectionWrapper className="relative bg-gradient-to-br from-slate-50/95 via-white/80 to-gray-50/90 dark:from-slate-950/95 dark:via-slate-900/80 dark:to-gray-950/90 z-10 overflow-hidden">
				{/* Advanced Background Elements */}
				<div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(71,85,105,0.12),transparent_50%)] pointer-events-none" />
				<div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(59,130,246,0.05)_25%,transparent_25%),linear-gradient(-45deg,rgba(147,51,234,0.05)_25%,transparent_25%)] bg-[size:60px_60px] animate-holographic opacity-30" />
				
				{/* Floating tech orbs */}
				<div className="absolute top-1/4 right-0 w-96 h-96 bg-gradient-to-bl from-slate-400/12 to-gray-400/12 rounded-full blur-3xl animate-liquid-morph" />
				<div className="absolute bottom-1/4 left-0 w-80 h-80 bg-gradient-to-tr from-gray-400/12 to-slate-400/12 rounded-full blur-3xl animate-liquid-morph delay-1500" />
				<div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-br from-blue-400/8 to-purple-400/8 rounded-full blur-2xl animate-energy-flow" />
				
				{/* Quantum grid overlay */}
				<div className="absolute inset-0 opacity-20">
					<div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(71,85,105,0.1)_1px,transparent_1px)] bg-[size:40px_40px] animate-quantum-shift" />
				</div>
				
				<div className="container mx-auto px-4 py-24 lg:py-32 relative">
					<div className="text-center mb-20">
						<motion.h2
							initial={{ opacity: 0, y: 20 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true }}
							className="text-5xl md:text-7xl font-black mb-6 bg-gradient-to-r from-slate-700 via-gray-600 to-slate-800 dark:from-slate-200 dark:via-gray-300 dark:to-slate-100 bg-clip-text text-transparent tracking-tight animate-text-rainbow"
						>
							Technologies I Love
						</motion.h2>
						<motion.p
							initial={{ opacity: 0, y: 20 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true }}
							transition={{ delay: 0.1 }}
							className="text-xl md:text-2xl text-slate-600 dark:text-slate-400 max-w-4xl mx-auto leading-relaxed"
						>
							Modern technologies I use to build{' '}
							<span className="font-bold bg-gradient-to-r from-slate-700 to-gray-600 dark:from-slate-300 dark:to-gray-200 bg-clip-text text-transparent animate-holographic">
								exceptional digital experiences
							</span>
						</motion.p>
					</div>

					<div className="grid gap-10 lg:gap-16 max-w-7xl mx-auto">
						{technologies.map((category, categoryIndex) => (
							<motion.div
								key={category.category}
								initial={{ opacity: 0, y: 30 }}
								whileInView={{ opacity: 1, y: 0 }}
								viewport={{ once: true }}
								transition={{ delay: categoryIndex * 0.15, duration: 0.6 }}
								className="group relative"
							>
								{/* Holographic border effect */}
								<div className="absolute -inset-1 bg-gradient-to-r from-blue-400/20 via-purple-400/20 to-pink-400/20 rounded-3xl blur-sm animate-holographic opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
								
								<Card
									variant="default"
									hover
									className="glass-card backdrop-blur-xl border-0 shadow-2xl hover:shadow-4xl transition-all duration-700 rounded-3xl overflow-hidden magnetic-hover shimmer-effect animate-breath relative"
								>
									{/* Crystal gleam overlay */}
									<div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-crystal-gleam opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
									
									<div className="p-10 lg:p-14 relative">
										{/* Enhanced Category Header */}
										<div className="flex items-center gap-8 mb-10 pb-8 border-b border-gray-100 dark:border-slate-700 relative">
											{/* Energy ring around icon */}
											<div className="relative">
												<div className="absolute -inset-2 border border-blue-300/30 rounded-3xl animate-energy-flow opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
												<div
													className={`text-7xl p-8 rounded-3xl shadow-2xl bg-gradient-to-r ${category.gradient} text-white group-hover:scale-150 group-hover:rotate-12 transition-all duration-700 animate-liquid-morph shimmer-effect relative overflow-hidden`}
												>
													{/* Holographic overlay on icon */}
													<div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-purple-300/20 animate-holographic opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
													<span className="relative z-10">{category.icon}</span>
												</div>
											</div>
											<div>
												<h3 className="text-4xl font-black text-slate-900 dark:text-white group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 group-hover:bg-clip-text transition-all duration-500 animate-text-rainbow">
													{category.category}
												</h3>
												<p className="text-xl text-slate-600 dark:text-slate-400 mt-2 group-hover:text-purple-500 transition-colors duration-300">
													{category.techs.length} Technologies
												</p>
											</div>
										</div>

										{/* Enhanced Technologies Grid */}
										<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-10">
											{category.techs.map((tech, techIndex) => (
												<motion.div
													key={tech.name}
													initial={{ opacity: 0, scale: 0.8 }}
													whileInView={{ opacity: 1, scale: 1 }}
													viewport={{ once: true }}
													transition={{
														delay: techIndex * 0.08,
														duration: 0.4,
													}}
													className="flex flex-col items-center text-center group/tech cursor-pointer relative"
												>
													{/* Quantum field around tech item */}
													<div className="absolute -inset-4 border border-purple-300/20 rounded-2xl animate-quantum-shift opacity-0 group-hover/tech:opacity-100 transition-opacity duration-500" />
													
													<div className="w-24 h-24 flex items-center justify-center rounded-3xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-slate-700 dark:to-slate-800 shadow-xl mb-4 transition-all duration-500 group-hover/tech:scale-125 group-hover/tech:shadow-2xl group-hover/tech:-translate-y-3 hover-glow relative overflow-hidden animate-energy-flow">
														{/* Holographic tech icon overlay */}
														<div className="absolute inset-0 bg-gradient-to-br from-blue-300/10 via-purple-300/10 to-pink-300/10 animate-holographic opacity-0 group-hover/tech:opacity-100 transition-opacity duration-500" />
														<span className="text-3xl animate-liquid-morph relative z-10">{tech.icon}</span>
													</div>
													<span
														className={cn(
															'text-base font-bold mb-2 transition-all duration-300 animate-text-rainbow',
															tech.color,
															'group-hover/tech:scale-110'
														)}
													>
														{tech.name}
													</span>
													<div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-3 mb-2 overflow-hidden relative">
														{/* Holographic progress bar */}
														<div className="absolute inset-0 bg-gradient-to-r from-blue-300/20 via-purple-300/20 to-pink-300/20 animate-crystal-gleam" />
														<div
															className={cn(
																'h-3 rounded-full bg-gradient-to-r transition-all duration-1000 shadow-inner relative z-10 animate-holographic',
																category.gradient
															)}
															style={{ width: `${tech.level}%` }}
														>
															{/* Energy flow within progress bar */}
															<div className="absolute inset-0 bg-gradient-to-r from-white/20 via-transparent to-white/20 animate-crystal-gleam" />
														</div>
													</div>
													<span className="text-sm font-semibold text-slate-500 dark:text-slate-400 group-hover/tech:text-purple-500 transition-colors duration-300">
														{tech.level}%
													</span>
												</motion.div>
											))}
										</div>
									</div>
								</Card>
							</motion.div>
						))}
					</div>
				</div>
			</SectionWrapper>

			{/* Projects Section - Enhanced Cards */}
			<SectionWrapper className="relative bg-gradient-to-br from-purple-50/80 via-white/70 to-pink-50/80 dark:from-purple-950/80 dark:via-slate-900/70 dark:to-pink-950/80 z-10 overflow-hidden">
				{/* Premium Background Elements */}
				<div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(168,85,247,0.1),transparent_50%)] pointer-events-none" />
				<div className="absolute top-1/3 left-1/4 w-96 h-96 bg-gradient-to-br from-purple-400/10 to-pink-400/10 rounded-full blur-3xl animate-morph delay-1000" />
				<div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-gradient-to-bl from-pink-400/10 to-rose-400/10 rounded-full blur-3xl animate-morph delay-2000" />
				
				<div className="container mx-auto px-4 py-24 lg:py-32">
					<div className="text-center mb-20">
						<motion.h2
							initial={{ opacity: 0, y: 20 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true }}
							className="text-5xl md:text-7xl font-black mb-6 bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 bg-clip-text text-transparent tracking-tight animate-gradient"
						>
							Featured Projects
						</motion.h2>
						<motion.p
							initial={{ opacity: 0, y: 20 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true }}
							transition={{ delay: 0.1 }}
							className="text-xl md:text-2xl text-slate-600 dark:text-slate-400 max-w-4xl mx-auto leading-relaxed"
						>
							Recent projects that showcase my{' '}
							<span className="font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
								skills and creativity
							</span>
						</motion.p>
					</div>

					<div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-10 lg:gap-14 max-w-8xl mx-auto">
						{featuredProjects.map((project, index) => (
							<motion.div
								key={project.title}
								initial={{ opacity: 0, y: 30 }}
								whileInView={{ opacity: 1, y: 0 }}
								viewport={{ once: true }}
								transition={{ delay: index * 0.15, duration: 0.6 }}
								className="group"
							>
								<Card
									variant="premium"
									hover
									className="h-full bg-white/98 dark:bg-slate-800/98 backdrop-blur-xl border-0 shadow-2xl hover:shadow-purple-500/25 dark:hover:shadow-purple-400/25 hover:-translate-y-6 hover:scale-[1.03] transition-all duration-700 rounded-3xl overflow-hidden hover-glow"
								>
									<div className="p-10 h-full flex flex-col">
										{/* Project Image */}
										<div className="relative h-56 lg:h-64 bg-gradient-to-br from-purple-100/90 via-pink-100/90 to-rose-100/90 dark:from-purple-900/40 dark:via-pink-900/40 dark:to-rose-900/40 rounded-3xl mb-8 overflow-hidden shadow-inner group-hover:shadow-xl transition-all duration-700">
											<Image
												src={project.image}
												alt={project.title}
												fill
												className="object-contain p-10 group-hover:scale-125 group-hover:rotate-6 transition-transform duration-700"
											/>
											{project.featured && (
												<Badge className="absolute top-6 right-6 bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-none shadow-xl text-base px-4 py-2 animate-pulse rounded-2xl">
													⭐ Featured
												</Badge>
											)}
										</div>

										{/* Project Content */}
										<div className="flex-1 flex flex-col">
											<h3 className="text-3xl font-black text-slate-900 dark:text-white group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-purple-600 group-hover:to-pink-600 group-hover:bg-clip-text transition-all duration-500 mb-4">
												{project.title}
											</h3>
											<p className="text-xl text-slate-600 dark:text-slate-400 leading-relaxed mb-8 flex-1">
												{project.description}
											</p>

											{/* Tech Stack */}
											<div className="flex flex-wrap gap-3 mb-8">
												{project.tech.map((tech) => (
													<Badge
														key={tech}
														variant="secondary"
														className="bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700/50 hover:scale-110 transition-all duration-300 text-base px-4 py-2 rounded-xl font-semibold"
													>
														{tech}
													</Badge>
												))}
											</div>

											{/* Action Buttons */}
											<div className="flex gap-5">
												<Button
													variant="outline"
													size="lg"
													asChild
													className="flex-1 hover:scale-110 hover:shadow-xl transition-all duration-300 border-2 py-4 rounded-2xl text-lg font-bold"
												>
													<Link
														href={project.github}
														target="_blank"
														className="flex items-center gap-3 justify-center"
													>
														<svg
															className="w-6 h-6"
															fill="currentColor"
															viewBox="0 0 24 24"
														>
															<path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
														</svg>
														Code
													</Link>
												</Button>
												<Button
													size="lg"
													asChild
													className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 hover:scale-110 hover:shadow-xl transition-all duration-300 py-4 rounded-2xl text-lg font-bold"
												>
													<Link
														href={project.demo}
														target="_blank"
														className="flex items-center gap-3 justify-center"
													>
														<svg
															className="w-6 h-6"
															fill="none"
															stroke="currentColor"
															viewBox="0 0 24 24"
														>
															<path
																strokeLinecap="round"
																strokeLinejoin="round"
																strokeWidth={2}
																d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
															/>
														</svg>
														Demo
													</Link>
												</Button>
											</div>
										</div>
									</div>
								</Card>
							</motion.div>
						))}
					</div>

					<motion.div
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						className="text-center mt-20"
					>
						<Button
							asChild
							size="lg"
							className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-2xl hover:shadow-3xl hover:scale-125 transition-all duration-500 px-16 py-6 rounded-3xl text-2xl font-black animate-scale-pulse"
						>
							<Link
								href="/projects"
								className="flex items-center gap-4"
							>
								View All Projects
								<svg
									className="w-8 h-8"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M17 8l4 4m0 0l-4 4m4-4H3"
									/>
								</svg>
							</Link>
						</Button>
					</motion.div>
				</div>
			</SectionWrapper>

			{/* CTA Section - Premium Holographic Enhanced */}
			<SectionWrapper className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white overflow-hidden">
				{/* Advanced holographic background */}
				<div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,.15)_50%,transparent_75%)] bg-[length:60px_60px] opacity-40 animate-holographic" />
				<div className="absolute inset-0 bg-gradient-to-br from-blue-600/50 via-purple-600/50 to-pink-600/50 animate-energy-flow" />
				
				{/* Quantum field overlay */}
				<div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.1)_1px,transparent_1px),radial-gradient(circle_at_70%_70%,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:80px_80px] animate-quantum-shift opacity-30" />
				
				{/* Premium floating elements */}
				<div className="absolute top-1/4 left-1/4 w-32 h-32 bg-gradient-to-br from-white/20 to-transparent rounded-full blur-xl animate-liquid-morph" />
				<div className="absolute bottom-1/3 right-1/3 w-24 h-24 bg-gradient-to-br from-yellow-300/30 to-transparent rounded-full blur-lg animate-energy-flow delay-1000" />
				<div className="absolute top-1/2 right-1/4 w-20 h-20 bg-gradient-to-br from-pink-300/25 to-transparent rounded-full blur-md animate-crystal-gleam delay-2000" />

				<div className="container mx-auto px-4 py-24 lg:py-32 relative z-10">
					<div className="text-center max-w-5xl mx-auto">
						<motion.h2
							initial={{ opacity: 0, y: 30 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true }}
							className="text-5xl lg:text-7xl font-black mb-8 leading-tight tracking-tight animate-text-rainbow"
						>
							Ready to Start Your{' '}
							<span className="bg-gradient-to-r from-yellow-300 via-orange-300 to-red-300 bg-clip-text text-transparent animate-holographic inline-block transform hover:scale-110 transition-transform duration-500">
								AMAZING
							</span>{' '}
							Project?
						</motion.h2>
						<motion.p
							initial={{ opacity: 0, y: 30 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true }}
							transition={{ delay: 0.2 }}
							className="text-2xl lg:text-3xl text-blue-100 max-w-4xl mx-auto mb-12 leading-relaxed animate-crystal-gleam"
						>
							Let&apos;s work together to bring your innovative ideas to life. I&apos;m
							here to help you build something extraordinary.
						</motion.p>
						<motion.div
							initial={{ opacity: 0, y: 30 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true }}
							transition={{ delay: 0.4 }}
							className="flex flex-col sm:flex-row gap-10 justify-center"
						>
							<div className="relative group">
								{/* Holographic border for primary button */}
								<div className="absolute -inset-2 bg-gradient-to-r from-yellow-300 via-orange-300 to-red-300 rounded-3xl blur-sm animate-energy-flow opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
								<Button
									variant="secondary"
									size="lg"
									asChild
									className="bg-white text-indigo-600 hover:bg-gray-50 border-none shadow-2xl hover:shadow-3xl hover:scale-125 transition-all duration-700 px-20 py-8 rounded-3xl text-3xl font-black animate-liquid-morph magnetic-hover shimmer-effect relative"
								>
									<Link
										href="/contact"
										className="flex items-center gap-5"
									>
										<svg
											className="w-10 h-10 animate-quantum-shift"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
											/>
										</svg>
										Get In Touch
									</Link>
								</Button>
							</div>
							<div className="relative group">
								{/* Holographic border for secondary button */}
								<div className="absolute -inset-2 bg-gradient-to-r from-blue-300 via-purple-300 to-pink-300 rounded-3xl blur-sm animate-crystal-gleam opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
								<Button
									variant="outline"
									size="lg"
									asChild
									className="border-white/80 text-white hover:bg-white hover:text-indigo-600 border-4 shadow-2xl hover:shadow-3xl hover:scale-125 transition-all duration-700 px-20 py-8 rounded-3xl text-3xl font-black backdrop-blur-sm animate-energy-flow magnetic-hover shimmer-effect relative"
								>
									<Link
										href="/projects"
										className="flex items-center gap-5"
									>
										<svg
											className="w-10 h-10 animate-holographic"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M17 8l4 4m0 0l-4 4m4-4H3"
											/>
										</svg>
										View My Work
									</Link>
								</Button>
							</div>
						</motion.div>
						
						{/* Premium decorative elements */}
						<motion.div
							initial={{ opacity: 0, scale: 0.8 }}
							whileInView={{ opacity: 1, scale: 1 }}
							viewport={{ once: true }}
							transition={{ delay: 0.6 }}
							className="mt-16 flex justify-center space-x-8"
						>
							<div className="w-4 h-4 bg-gradient-to-br from-yellow-300 to-orange-300 rounded-full animate-quantum-shift opacity-80" />
							<div className="w-3 h-3 bg-gradient-to-br from-blue-300 to-purple-300 rounded-full animate-liquid-morph opacity-70" style={{ animationDelay: '1s' }} />
							<div className="w-5 h-5 bg-gradient-to-br from-pink-300 to-red-300 rounded-full animate-energy-flow opacity-60" style={{ animationDelay: '2s' }} />
							<div className="w-2 h-2 bg-gradient-to-br from-green-300 to-teal-300 rounded-full animate-crystal-gleam opacity-75" style={{ animationDelay: '3s' }} />
							<div className="w-4 h-4 bg-gradient-to-br from-purple-300 to-indigo-300 rounded-full animate-holographic opacity-65" style={{ animationDelay: '4s' }} />
						</motion.div>
					</div>
				</div>
			</SectionWrapper>
		</main>
	);
}