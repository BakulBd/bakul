'use client';

import EnhancedHero from '@/components/sections/EnhancedHero';
import { SectionWrapper, Card, StatCard, Button, Badge } from '@/components/ui';
import { useIntersectionObserver } from '@/hooks/enhanced';
import { useState, useRef } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowRightIcon, EyeIcon, CodeBracketIcon } from '@heroicons/react/24/outline';

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
	useIntersectionObserver(statsRef, () => {
		if (!hasAnimated) setHasAnimated(true);
	});

	return (
		<main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50/50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 relative overflow-x-hidden">
			{/* Hero Section */}
			<EnhancedHero />

			{/* Stats Section */}
			<SectionWrapper>
				<div ref={statsRef} className="container mx-auto px-4">
					<motion.div
						initial={{ opacity: 0, y: 50 }}
						whileInView={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6, ease: 'easeOut' }}
						viewport={{ once: true }}
						className="text-center mb-16"
					>
						<h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
							Achievements & Milestones
						</h2>
						<p className="text-gray-600 dark:text-gray-400 text-lg max-w-2xl mx-auto">
							Numbers that speak to our commitment to excellence and innovation
						</p>
					</motion.div>
					
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
						{stats.map((stat, index) => (
							<motion.div
								key={index}
								initial={{ opacity: 0, y: 30 }}
								whileInView={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.5, delay: index * 0.1 }}
								viewport={{ once: true }}
							>
								<StatCard
									label={stat.label}
									value={stat.value}
									suffix={stat.suffix}
									icon={index === 0 ? '🚀' : index === 1 ? '😊' : index === 2 ? '⏰' : '⚡'}
									className="h-full"
								/>
							</motion.div>
						))}
					</div>
				</div>
			</SectionWrapper>

			{/* Featured Projects Section */}
			<SectionWrapper className="bg-gradient-to-br from-gray-50/50 to-blue-50/50 dark:from-slate-900/50 dark:to-indigo-950/50">
				<div className="container mx-auto px-4">
					<motion.div
						initial={{ opacity: 0, y: 50 }}
						whileInView={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6, ease: 'easeOut' }}
						viewport={{ once: true }}
						className="text-center mb-16"
					>
						<h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
							Featured Projects
						</h2>
						<p className="text-gray-600 dark:text-gray-400 text-lg max-w-2xl mx-auto">
							Explore some of my latest work showcasing modern web development and creative solutions
						</p>
					</motion.div>

					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
						{featuredProjects.map((project, index) => (
							<motion.div
								key={index}
								initial={{ opacity: 0, y: 30 }}
								whileInView={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.5, delay: index * 0.1 }}
								viewport={{ once: true }}
								whileHover={{ y: -10 }}
								className="group"
							>
								<Card
									variant="premium"
									hover
									className="h-full overflow-hidden border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm"
								>
									<div className="relative overflow-hidden rounded-t-lg">
										<Image 
											src={project.image} 
											alt={project.title} 
											width={400} 
											height={250} 
											className="w-full h-56 object-cover transition-transform duration-500 group-hover:scale-110" 
										/>
										<div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
										<div className="absolute top-4 right-4 flex gap-2">
											<Badge variant="primary" className="backdrop-blur-sm bg-white/20 text-white border-white/30">
												Featured
											</Badge>
										</div>
									</div>
									
									<div className="p-6">
										<h3 className="text-xl font-bold mb-3 text-gray-800 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
											{project.title}
										</h3>
										<p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
											{project.description}
										</p>
										
										<div className="flex flex-wrap gap-2 mb-6">
											{project.tech.map((tech, i) => (
												<Badge 
													key={i} 
													variant="secondary" 
													size="sm"
													className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
												>
													{tech}
												</Badge>
											))}
										</div>
										
										<div className="flex gap-3">
											<Button
												variant="outline"
												size="sm"
												asChild
												className="flex-1 group/btn"
											>
												<a href={project.github} target="_blank" rel="noopener noreferrer">
													<CodeBracketIcon className="w-4 h-4 mr-2" />
													Code
													<ArrowRightIcon className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
												</a>
											</Button>
											<Button
												variant="primary"
												size="sm"
												asChild
												className="flex-1 group/btn"
											>
												<a href={project.demo} target="_blank" rel="noopener noreferrer">
													<EyeIcon className="w-4 h-4 mr-2" />
													Demo
													<ArrowRightIcon className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
												</a>
											</Button>
										</div>
									</div>
								</Card>
							</motion.div>
						))}
					</div>
				</div>
			</SectionWrapper>
		</main>
	);
}