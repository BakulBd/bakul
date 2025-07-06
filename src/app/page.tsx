'use client';

import EnhancedHero from '@/components/sections/EnhancedHero';
import { SectionWrapper, Card, StatCard, Button, Badge } from '@/components/ui';
import { useIntersectionObserver } from '@/hooks/enhanced';
import { useState, useRef } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowRightIcon, EyeIcon, CodeBracketIcon, SparklesIcon, RocketLaunchIcon, HeartIcon } from '@heroicons/react/24/outline';

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

export default function HomePage() {
	const statsRef = useRef<HTMLDivElement>(null);
	const [hasAnimated, setHasAnimated] = useState(false);
	const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
	
	useIntersectionObserver(statsRef, () => {
		if (!hasAnimated) setHasAnimated(true);
	});

	// Mouse tracking for magnetic effects
	const handleMouseMove = (e: React.MouseEvent) => {
		setMousePosition({ x: e.clientX, y: e.clientY });
	};

	// Floating particles component
	const FloatingParticles = () => {
		const particles = Array.from({ length: 50 }, (_, i) => i);
		
		return (
			<div className="fixed inset-0 pointer-events-none overflow-hidden">
				{particles.map((particle) => (
					<motion.div
						key={particle}
						className="absolute w-1 h-1 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full"
						initial={{
							x: Math.random() * window.innerWidth,
							y: Math.random() * window.innerHeight,
							opacity: 0
						}}
						animate={{
							y: [null, Math.random() * window.innerHeight],
							x: [null, Math.random() * window.innerWidth],
							opacity: [0, 0.6, 0],
							scale: [0, 1.5, 0]
						}}
						transition={{
							duration: Math.random() * 20 + 20,
							repeat: Infinity,
							ease: "linear",
							delay: Math.random() * 5
						}}
					/>
				))}
			</div>
		);
	};

	return (
		<div 
			className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 relative overflow-hidden"
			onMouseMove={handleMouseMove}
		>
			{/* Floating Particles */}
			<FloatingParticles />
			
			{/* Gradient Orbs */}
			<div className="fixed inset-0 pointer-events-none">
				<motion.div
					className="absolute top-10 left-10 w-72 h-72 bg-gradient-to-r from-blue-400/10 to-purple-400/10 rounded-full blur-3xl"
					animate={{
						x: [0, 100, 0],
						y: [0, 50, 0],
						scale: [1, 1.2, 1]
					}}
					transition={{
						duration: 20,
						repeat: Infinity,
						ease: "easeInOut"
					}}
				/>
				<motion.div
					className="absolute top-40 right-20 w-96 h-96 bg-gradient-to-r from-purple-400/10 to-pink-400/10 rounded-full blur-3xl"
					animate={{
						x: [0, -80, 0],
						y: [0, 100, 0],
						scale: [1, 0.8, 1]
					}}
					transition={{
						duration: 25,
						repeat: Infinity,
						ease: "easeInOut",
						delay: 5
					}}
				/>
				<motion.div
					className="absolute bottom-20 left-1/3 w-80 h-80 bg-gradient-to-r from-cyan-400/10 to-blue-400/10 rounded-full blur-3xl"
					animate={{
						x: [0, 120, 0],
						y: [0, -60, 0],
						scale: [1, 1.1, 1]
					}}
					transition={{
						duration: 30,
						repeat: Infinity,
						ease: "easeInOut",
						delay: 10
					}}
				/>
			</div>
			{/* Hero Section */}
			<EnhancedHero />

			{/* Stats Section */}
			<SectionWrapper className="py-8 sm:py-12 md:py-16 lg:py-20 relative">
				<div ref={statsRef} className="container mx-auto px-3 sm:px-4 lg:px-6 xl:px-8">
					<motion.div
						initial={{ opacity: 0, y: 50 }}
						whileInView={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.8, ease: 'easeOut' }}
						viewport={{ once: true }}
						className="text-center mb-8 sm:mb-12 md:mb-16"
					>
						<motion.div
							initial={{ scale: 0.8, opacity: 0 }}
							whileInView={{ scale: 1, opacity: 1 }}
							transition={{ duration: 0.6, delay: 0.2 }}
							className="inline-flex items-center px-3 py-1 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 text-blue-700 dark:text-blue-300 text-sm font-medium mb-4 border border-blue-200/50 dark:border-blue-800/50"
						>
							<SparklesIcon className="w-4 h-4 mr-2" />
							Achievements & Impact
						</motion.div>
						<h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent leading-tight">
							Numbers That Tell Our Story
						</h2>
						<p className="text-gray-600 dark:text-gray-400 text-base sm:text-lg md:text-xl max-w-xs sm:max-w-xl md:max-w-2xl lg:max-w-3xl mx-auto leading-relaxed px-2 sm:px-0">
							Every project is a journey of innovation, creativity, and measurable success
						</p>
					</motion.div>
					
					<div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 lg:gap-8 mb-12 sm:mb-16 md:mb-20">
						{stats.map((stat, index) => (
							<motion.div
								key={index}
								initial={{ opacity: 0, y: 50, scale: 0.8 }}
								whileInView={{ opacity: 1, y: 0, scale: 1 }}
								transition={{ 
									duration: 0.6, 
									delay: index * 0.15,
									type: "spring",
									stiffness: 100
								}}
								viewport={{ once: true }}
								whileHover={{ 
									y: -8, 
									scale: 1.03,
									transition: { duration: 0.2 }
								}}
								className="w-full group"
							>
								<StatCard
									label={stat.label}
									value={stat.value}
									suffix={stat.suffix}
									icon={index === 0 ? '🚀' : index === 1 ? '�' : index === 2 ? '⭐' : '⚡'}
									className="h-full min-h-[120px] sm:min-h-[140px] md:min-h-[160px] bg-gradient-to-br from-white/80 to-white/40 dark:from-slate-800/80 dark:to-slate-800/40 backdrop-blur-lg border border-white/20 dark:border-slate-700/20 hover:border-blue-300/50 dark:hover:border-blue-600/50 transition-all duration-300 shadow-lg hover:shadow-2xl hover:shadow-blue-500/10"
								/>
								{/* Magnetic follow effect */}
								<motion.div
									className="absolute inset-0 rounded-lg bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
									animate={{
										x: (mousePosition.x - window.innerWidth / 2) * 0.01,
										y: (mousePosition.y - window.innerHeight / 2) * 0.01,
									}}
									transition={{ type: "spring", stiffness: 50, damping: 10 }}
								/>
							</motion.div>
						))}
					</div>
				</div>
			</SectionWrapper>

			{/* Technologies Section */}
			<SectionWrapper className="py-8 sm:py-12 md:py-16 lg:py-20 bg-gradient-to-br from-indigo-50/30 via-purple-50/20 to-pink-50/30 dark:from-indigo-950/30 dark:via-purple-950/20 dark:to-pink-950/30 relative">
				{/* Animated background pattern */}
				<div className="absolute inset-0 overflow-hidden">
					<div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-purple-400/5 to-pink-400/5 rounded-full animate-pulse" />
					<div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-blue-400/5 to-cyan-400/5 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
				</div>
				
				<div className="container mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 relative">
					<motion.div
						initial={{ opacity: 0, y: 50 }}
						whileInView={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.8, ease: 'easeOut' }}
						viewport={{ once: true }}
						className="text-center mb-8 sm:mb-12 md:mb-16"
					>
						<motion.div
							initial={{ scale: 0.8, opacity: 0 }}
							whileInView={{ scale: 1, opacity: 1 }}
							transition={{ duration: 0.6, delay: 0.2 }}
							className="inline-flex items-center px-3 py-1 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 text-purple-700 dark:text-purple-300 text-sm font-medium mb-4 border border-purple-200/50 dark:border-purple-800/50"
						>
							<RocketLaunchIcon className="w-4 h-4 mr-2" />
							Tech Stack & Tools
						</motion.div>
						<h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent leading-tight">
							Technologies I Love Working With
						</h2>
						<p className="text-gray-600 dark:text-gray-400 text-base sm:text-lg md:text-xl max-w-xs sm:max-w-xl md:max-w-2xl lg:max-w-3xl mx-auto leading-relaxed px-2 sm:px-0">
							My carefully curated toolkit of cutting-edge technologies that power exceptional digital experiences
						</p>
					</motion.div>

					<div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
						{[
							{ name: 'React', icon: '⚛️', color: 'from-blue-500 to-cyan-500', description: 'UI Library' },
							{ name: 'Next.js', icon: '▲', color: 'from-gray-700 to-gray-900', description: 'Framework' },
							{ name: 'TypeScript', icon: '📘', color: 'from-blue-600 to-blue-800', description: 'Language' },
							{ name: 'Node.js', icon: '🟢', color: 'from-green-500 to-green-700', description: 'Runtime' },
							{ name: 'Python', icon: '🐍', color: 'from-yellow-500 to-yellow-700', description: 'Language' },
							{ name: 'PostgreSQL', icon: '🐘', color: 'from-blue-700 to-indigo-700', description: 'Database' },
							{ name: 'MongoDB', icon: '🍃', color: 'from-green-600 to-green-800', description: 'Database' },
							{ name: 'AWS', icon: '☁️', color: 'from-orange-500 to-orange-700', description: 'Cloud' },
							{ name: 'Docker', icon: '🐳', color: 'from-blue-600 to-blue-800', description: 'Container' },
							{ name: 'Git', icon: '📚', color: 'from-red-500 to-red-700', description: 'Version Control' },
							{ name: 'Figma', icon: '🎨', color: 'from-purple-500 to-pink-500', description: 'Design' },
							{ name: 'Tailwind', icon: '💨', color: 'from-cyan-500 to-teal-500', description: 'CSS' },
						].map((tech, index) => (
							<motion.div
								key={tech.name}
								initial={{ opacity: 0, scale: 0.5, y: 20 }}
								whileInView={{ opacity: 1, scale: 1, y: 0 }}
								transition={{ 
									duration: 0.5, 
									delay: index * 0.08,
									type: "spring",
									stiffness: 100
								}}
								viewport={{ once: true }}
								whileHover={{ 
									scale: 1.08, 
									y: -5,
									rotateY: 5,
									transition: { duration: 0.2 }
								}}
								className="group relative"
							>
								{/* Glow effect on hover */}
								<motion.div
									className={`absolute inset-0 rounded-xl bg-gradient-to-r ${tech.color} opacity-0 group-hover:opacity-20 blur-xl transition-all duration-300`}
									whileHover={{ scale: 1.2 }}
								/>
								
								<Card
									variant="glass"
									className="relative p-2 sm:p-3 md:p-4 text-center h-full bg-white/70 dark:bg-slate-800/70 backdrop-blur-md border border-white/20 dark:border-slate-700/20 hover:bg-white/90 dark:hover:bg-slate-800/90 transition-all duration-300 min-h-[80px] sm:min-h-[90px] md:min-h-[100px] lg:min-h-[110px] overflow-hidden"
								>
									{/* Animated shine effect */}
									<motion.div
										className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"
										style={{ transform: 'skewX(-20deg)' }}
									/>
									
									<motion.div 
										className={`text-xl sm:text-2xl md:text-3xl mb-1 sm:mb-2 md:mb-3 bg-gradient-to-r ${tech.color} bg-clip-text text-transparent group-hover:scale-110 transition-transform duration-300`}
										whileHover={{ rotate: [0, -10, 10, 0] }}
										transition={{ duration: 0.3 }}
									>
										{tech.icon}
									</motion.div>
									<h3 className="font-semibold text-xs sm:text-sm md:text-sm text-gray-800 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-white transition-colors leading-tight break-words mb-1">
										{tech.name}
									</h3>
									<p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors">
										{tech.description}
									</p>
								</Card>
							</motion.div>
						))}
					</div>
				</div>
			</SectionWrapper>

			{/* Featured Projects Section */}
			<SectionWrapper className="py-8 sm:py-12 md:py-16 lg:py-20 bg-gradient-to-br from-gray-50/30 via-blue-50/20 to-purple-50/30 dark:from-slate-900/30 dark:via-indigo-950/20 dark:to-purple-950/30 relative">
				{/* Floating gradient orbs */}
				<div className="absolute inset-0 overflow-hidden">
					<motion.div
						className="absolute top-20 left-1/4 w-64 h-64 bg-gradient-to-r from-blue-400/10 to-purple-400/10 rounded-full blur-3xl"
						animate={{
							scale: [1, 1.2, 1],
							opacity: [0.3, 0.6, 0.3],
						}}
						transition={{
							duration: 8,
							repeat: Infinity,
							ease: "easeInOut"
						}}
					/>
					<motion.div
						className="absolute bottom-20 right-1/4 w-64 h-64 bg-gradient-to-r from-purple-400/10 to-pink-400/10 rounded-full blur-3xl"
						animate={{
							scale: [1, 1.3, 1],
							opacity: [0.2, 0.5, 0.2],
						}}
						transition={{
							duration: 10,
							repeat: Infinity,
							ease: "easeInOut",
							delay: 2
						}}
					/>
				</div>
				
				<div className="container mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 relative">
					<motion.div
						initial={{ opacity: 0, y: 50 }}
						whileInView={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.8, ease: 'easeOut' }}
						viewport={{ once: true }}
						className="text-center mb-8 sm:mb-12 md:mb-16"
					>
						<motion.div
							initial={{ scale: 0.8, opacity: 0 }}
							whileInView={{ scale: 1, opacity: 1 }}
							transition={{ duration: 0.6, delay: 0.2 }}
							className="inline-flex items-center px-3 py-1 rounded-full bg-gradient-to-r from-pink-100 to-purple-100 dark:from-pink-900/30 dark:to-purple-900/30 text-pink-700 dark:text-pink-300 text-sm font-medium mb-4 border border-pink-200/50 dark:border-pink-800/50"
						>
							<HeartIcon className="w-4 h-4 mr-2" />
							Featured Work
						</motion.div>
						<h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 bg-clip-text text-transparent leading-tight">
							Featured Projects
						</h2>
						<p className="text-gray-600 dark:text-gray-400 text-base sm:text-lg md:text-xl max-w-xs sm:max-w-xl md:max-w-2xl lg:max-w-3xl mx-auto leading-relaxed px-2 sm:px-0">
							Handpicked showcase of innovative solutions that demonstrate creativity, technical excellence, and impact
						</p>
					</motion.div>

					<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
						{featuredProjects.map((project, index) => (
							<motion.div
								key={index}
								initial={{ opacity: 0, y: 50, rotateX: -20 }}
								whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
								transition={{ 
									duration: 0.6, 
									delay: index * 0.15,
									type: "spring",
									stiffness: 100
								}}
								viewport={{ once: true }}
								whileHover={{ 
									y: -12, 
									scale: 1.02,
									rotateY: 2,
									transition: { duration: 0.3 }
								}}
								className="group w-full perspective-1000"
							>
								<Card
									variant="premium"
									hover
									className="h-full overflow-hidden border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm relative transform-gpu"
								>
									{/* Animated border gradient */}
									<motion.div
										className="absolute inset-0 bg-gradient-to-r from-blue-500/50 via-purple-500/50 to-pink-500/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
										style={{
											background: 'linear-gradient(45deg, #3b82f6, #8b5cf6, #ec4899)',
											padding: '2px',
											borderRadius: '8px'
										}}
									>
										<div className="h-full w-full bg-white dark:bg-slate-800 rounded-lg" />
									</motion.div>
									
									<div className="relative z-10">
										<div className="relative overflow-hidden rounded-t-lg">
											<motion.div
												whileHover={{ scale: 1.1 }}
												transition={{ duration: 0.4 }}
											>
												<Image 
													src={project.image} 
													alt={project.title} 
													width={400} 
													height={250} 
													className="w-full h-40 sm:h-48 md:h-56 object-cover transition-all duration-500" 
												/>
											</motion.div>
											
											{/* Gradient overlay with animation */}
											<motion.div 
												className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
												whileHover={{
													background: [
														"linear-gradient(to top, rgba(0,0,0,0.4), transparent)",
														"linear-gradient(to top, rgba(59,130,246,0.3), transparent)",
														"linear-gradient(to top, rgba(139,92,246,0.3), transparent)"
													]
												}}
												transition={{ duration: 2, repeat: Infinity }}
											/>
											
											<div className="absolute top-2 sm:top-4 right-2 sm:right-4 flex gap-2">
												<motion.div
													whileHover={{ scale: 1.1, rotate: 5 }}
													whileTap={{ scale: 0.95 }}
												>
													<Badge variant="primary" className="backdrop-blur-sm bg-white/20 text-white border-white/30 text-xs sm:text-sm shadow-lg">
														<SparklesIcon className="w-3 h-3 mr-1" />
														Featured
													</Badge>
												</motion.div>
											</div>
										</div>
										
										<div className="p-3 sm:p-4 md:p-6">
											<motion.h3 
												className="text-lg sm:text-xl font-bold mb-2 sm:mb-3 text-gray-800 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-tight"
												whileHover={{ x: 5 }}
												transition={{ duration: 0.2 }}
											>
												{project.title}
											</motion.h3>
											<p className="text-gray-600 dark:text-gray-400 mb-3 sm:mb-4 text-sm sm:text-base line-clamp-3 leading-relaxed">
												{project.description}
											</p>
											
											<div className="flex flex-wrap gap-1.5 sm:gap-2 mb-4 sm:mb-6">
												{project.tech.map((tech, i) => (
													<motion.div
														key={i}
														initial={{ scale: 0.8, opacity: 0 }}
														whileInView={{ scale: 1, opacity: 1 }}
														transition={{ delay: i * 0.1 }}
														whileHover={{ scale: 1.05 }}
													>
														<Badge 
															variant="secondary" 
															size="sm"
															className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors text-xs"
														>
															{tech}
														</Badge>
													</motion.div>
												))}
											</div>
											
											<div className="flex flex-col xs:flex-row gap-2 sm:gap-3">
												<motion.div
													whileHover={{ scale: 1.05 }}
													whileTap={{ scale: 0.95 }}
													className="flex-1"
												>
													<Button
														variant="outline"
														size="sm"
														asChild
														className="w-full group/btn text-xs sm:text-sm border-2 hover:border-blue-300 dark:hover:border-blue-600"
													>
														<a href={project.github} target="_blank" rel="noopener noreferrer">
															<CodeBracketIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
															Code
															<motion.div
																className="ml-1 sm:ml-2"
																whileHover={{ x: 3 }}
																transition={{ duration: 0.2 }}
															>
																<ArrowRightIcon className="w-3 h-3 sm:w-4 sm:h-4" />
															</motion.div>
														</a>
													</Button>
												</motion.div>
												<motion.div
													whileHover={{ scale: 1.05 }}
													whileTap={{ scale: 0.95 }}
													className="flex-1"
												>
													<Button
														variant="primary"
														size="sm"
														asChild
														className="w-full group/btn text-xs sm:text-sm bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
													>
														<a href={project.demo} target="_blank" rel="noopener noreferrer">
															<EyeIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
															Demo
															<motion.div
																className="ml-1 sm:ml-2"
																whileHover={{ x: 3 }}
																transition={{ duration: 0.2 }}
															>
																<ArrowRightIcon className="w-3 h-3 sm:w-4 sm:h-4" />
															</motion.div>
														</a>
													</Button>
												</motion.div>
											</div>
										</div>
									</div>
								</Card>
							</motion.div>
						))}
					</div>
				</div>
			</SectionWrapper>

			{/* Call to Action Section */}
			<SectionWrapper className="py-12 sm:py-16 md:py-20 lg:py-24 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 relative overflow-hidden">
				{/* Animated background elements */}
				<div className="absolute inset-0">
					<motion.div
						className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20"
						animate={{
							background: [
								"linear-gradient(45deg, rgba(59,130,246,0.2), rgba(139,92,246,0.2), rgba(236,72,153,0.2))",
								"linear-gradient(45deg, rgba(139,92,246,0.2), rgba(236,72,153,0.2), rgba(59,130,246,0.2))",
								"linear-gradient(45deg, rgba(236,72,153,0.2), rgba(59,130,246,0.2), rgba(139,92,246,0.2))"
							]
						}}
						transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
					/>
					<div className="absolute inset-0 bg-black/10" />
				</div>
				
				{/* Floating particles for CTA */}
				<div className="absolute inset-0 overflow-hidden">
					{Array.from({ length: 20 }, (_, i) => (
						<motion.div
							key={i}
							className="absolute w-2 h-2 bg-white/30 rounded-full"
							initial={{
								x: Math.random() * 1000,
								y: Math.random() * 400,
								opacity: 0
							}}
							animate={{
								y: [null, Math.random() * 400],
								x: [null, Math.random() * 1000],
								opacity: [0, 0.8, 0],
								scale: [0, 1, 0]
							}}
							transition={{
								duration: Math.random() * 15 + 10,
								repeat: Infinity,
								ease: "linear",
								delay: Math.random() * 5
							}}
						/>
					))}
				</div>
				
				<div className="container mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 relative z-10">
					<motion.div
						initial={{ opacity: 0, y: 50 }}
						whileInView={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.8, ease: 'easeOut' }}
						viewport={{ once: true }}
						className="text-center max-w-4xl mx-auto"
					>
						<motion.h2 
							className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 text-white leading-tight"
							initial={{ scale: 0.8, opacity: 0 }}
							whileInView={{ scale: 1, opacity: 1 }}
							transition={{ duration: 0.6, delay: 0.2 }}
						>
							Ready to Build Something{' '}
							<span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
								Amazing?
							</span>
						</motion.h2>
						
						<motion.p 
							className="text-lg sm:text-xl md:text-2xl text-white/90 mb-8 sm:mb-10 md:mb-12 leading-relaxed max-w-3xl mx-auto"
							initial={{ opacity: 0, y: 20 }}
							whileInView={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.6, delay: 0.4 }}
						>
							Let&apos;s collaborate to transform your ideas into stunning digital experiences that captivate your audience and drive results.
						</motion.p>
						
						<motion.div
							className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center"
							initial={{ opacity: 0, y: 30 }}
							whileInView={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.6, delay: 0.6 }}
						>
							<motion.div
								whileHover={{ scale: 1.05 }}
								whileTap={{ scale: 0.95 }}
							>
								<Button
									size="lg"
									className="bg-white text-blue-600 hover:bg-white/90 hover:text-blue-700 font-semibold px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg rounded-full shadow-2xl hover:shadow-white/20 transition-all duration-300 group min-w-[180px]"
									asChild
								>
									<a href="/contact">
										<motion.span
											whileHover={{ x: -2 }}
											transition={{ duration: 0.2 }}
										>
											Start a Project
										</motion.span>
										<motion.div
											className="ml-2"
											whileHover={{ x: 3 }}
											transition={{ duration: 0.2 }}
										>
											<ArrowRightIcon className="w-5 h-5" />
										</motion.div>
									</a>
								</Button>
							</motion.div>
							
							<motion.div
								whileHover={{ scale: 1.05 }}
								whileTap={{ scale: 0.95 }}
							>
								<Button
									variant="outline"
									size="lg"
									className="border-white/30 text-white hover:bg-white/10 hover:border-white/50 font-semibold px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg rounded-full backdrop-blur-sm transition-all duration-300 group min-w-[180px]"
									asChild
								>
									<a href="/projects">
										<motion.span
											whileHover={{ x: -2 }}
											transition={{ duration: 0.2 }}
										>
											View All Projects
										</motion.span>
										<motion.div
											className="ml-2"
											whileHover={{ x: 3 }}
											transition={{ duration: 0.2 }}
										>
											<EyeIcon className="w-5 h-5" />
										</motion.div>
									</a>
								</Button>
							</motion.div>
						</motion.div>
						
						<motion.div
							className="mt-8 sm:mt-12 md:mt-16 flex justify-center items-center space-x-8 text-white/70"
							initial={{ opacity: 0 }}
							whileInView={{ opacity: 1 }}
							transition={{ duration: 0.8, delay: 0.8 }}
						>
							<motion.div 
								className="text-center"
								whileHover={{ scale: 1.1, y: -2 }}
								transition={{ duration: 0.2 }}
							>
								<div className="text-2xl sm:text-3xl font-bold text-white">24/7</div>
								<div className="text-xs sm:text-sm">Support</div>
							</motion.div>
							<div className="w-px h-8 bg-white/30" />
							<motion.div 
								className="text-center"
								whileHover={{ scale: 1.1, y: -2 }}
								transition={{ duration: 0.2 }}
							>
								<div className="text-2xl sm:text-3xl font-bold text-white">100%</div>
								<div className="text-xs sm:text-sm">Satisfaction</div>
							</motion.div>
							<div className="w-px h-8 bg-white/30" />
							<motion.div 
								className="text-center"
								whileHover={{ scale: 1.1, y: -2 }}
								transition={{ duration: 0.2 }}
							>
								<div className="text-2xl sm:text-3xl font-bold text-white">∞</div>
								<div className="text-xs sm:text-sm">Possibilities</div>
							</motion.div>
						</motion.div>
					</motion.div>
				</div>
			</SectionWrapper>
		</div>
	);
}