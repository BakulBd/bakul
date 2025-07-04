'use client';

import EnhancedHero from '@/components/sections/EnhancedHero';
import { SectionWrapper, Card, Button, Badge, GradientText, StatCard } from '@/components/ui';
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

// Services data
const services = [
  {
    title: 'Frontend Development',
    description: 'Creating responsive, interactive user interfaces with modern frameworks and best practices.',
    icon: '🎨',
    technologies: ['React', 'Next.js', 'TypeScript', 'Tailwind CSS'],
  },
  {
    title: 'Backend Development',
    description: 'Building scalable server-side applications with robust APIs and database integration.',
    icon: '⚙️',
    technologies: ['Node.js', 'Python', 'PostgreSQL', 'MongoDB'],
  },
  {
    title: 'Full Stack Solutions',
    description: 'End-to-end web applications with seamless frontend-backend integration.',
    icon: '🚀',
    technologies: ['Next.js', 'Supabase', 'Vercel', 'AWS'],
  },
  {
    title: 'UI/UX Design',
    description: 'Designing intuitive user experiences with modern design principles and accessibility.',
    icon: '✨',
    technologies: ['Figma', 'Adobe XD', 'Framer', 'Principle'],
  },
];

// Featured projects
const featuredProjects = [
  {
    title: "Portfolio CMS",
    description: "A modern portfolio website with integrated blog/vlog CMS built with Next.js and Supabase.",
    image: "/file.svg",
    tech: ["Next.js", "Supabase", "TypeScript", "Tailwind CSS"],
    github: "https://github.com/bakulahmed/portfolio-cms",
    demo: "https://bakul.dev",
    featured: true,
  },
  {
    title: "E-Commerce Platform",
    description: "Full-stack e-commerce solution with payment integration and admin dashboard.",
    image: "/globe.svg",
    tech: ["React", "Node.js", "MongoDB", "Stripe"],
    github: "https://github.com/bakulahmed/ecommerce",
    demo: "https://ecommerce.bakul.dev",
    featured: true,
  },
  {
    title: "Task Management App",
    description: "Collaborative task management application with real-time updates and team features.",
    image: "/window.svg",
    tech: ["Vue.js", "Firebase", "Tailwind CSS"],
    github: "https://github.com/bakulahmed/taskmanager",
    demo: "https://tasks.bakul.dev",
    featured: true,
  },
];

// Testimonials data
const testimonials = [
  {
    name: "Sarah Johnson",
    role: "Product Manager at TechCorp",
    content: "Bakul delivered an exceptional website that exceeded our expectations. His attention to detail and technical expertise is remarkable.",
    avatar: "/file.svg",
    rating: 5,
  },
  {
    name: "Michael Chen",
    role: "Startup Founder",
    content: "Working with Bakul was a game-changer for our startup. He built a scalable platform that helped us grow rapidly.",
    avatar: "/globe.svg",
    rating: 5,
  },
  {
    name: "Emily Rodriguez",
    role: "Marketing Director",
    content: "The website Bakul created for us significantly improved our conversion rates. Highly recommended!",
    avatar: "/window.svg",
    rating: 5,
  },
];

// Technologies data
const technologies = [
  {
    category: "Frontend",
    icon: "🎨",
    gradient: "from-blue-500 to-cyan-500",
    bgGradient: "from-blue-50 to-cyan-50 dark:from-blue-950/50 dark:to-cyan-950/50",
    techs: [
      { name: "React", level: 95, color: "text-blue-600" },
      { name: "Next.js", level: 90, color: "text-gray-700" },
      { name: "TypeScript", level: 88, color: "text-blue-500" },
      { name: "Tailwind CSS", level: 92, color: "text-teal-600" },
      { name: "Vue.js", level: 85, color: "text-green-600" },
      { name: "Framer Motion", level: 87, color: "text-purple-600" }
    ]
  },
  {
    category: "Backend",
    icon: "⚙️",
    gradient: "from-emerald-500 to-teal-500",
    bgGradient: "from-emerald-50 to-teal-50 dark:from-emerald-950/50 dark:to-teal-950/50",
    techs: [
      { name: "Node.js", level: 90, color: "text-green-600" },
      { name: "Python", level: 85, color: "text-yellow-600" },
      { name: "Express.js", level: 88, color: "text-gray-700" },
      { name: "PostgreSQL", level: 86, color: "text-blue-700" },
      { name: "MongoDB", level: 82, color: "text-green-700" },
      { name: "Redis", level: 80, color: "text-red-600" }
    ]
  },
  {
    category: "Cloud & DevOps",
    icon: "☁️",
    gradient: "from-purple-500 to-pink-500",
    bgGradient: "from-purple-50 to-pink-50 dark:from-purple-950/50 dark:to-pink-950/50",
    techs: [
      { name: "AWS", level: 85, color: "text-orange-600" },
      { name: "Vercel", level: 92, color: "text-gray-800" },
      { name: "Docker", level: 83, color: "text-blue-600" },
      { name: "GitHub Actions", level: 87, color: "text-gray-700" },
      { name: "Supabase", level: 89, color: "text-green-600" },
      { name: "Firebase", level: 84, color: "text-yellow-600" }
    ]
  },
  {
    category: "Tools & Design",
    icon: "🛠️",
    gradient: "from-orange-500 to-red-500",
    bgGradient: "from-orange-50 to-red-50 dark:from-orange-950/50 dark:to-red-950/50",
    techs: [
      { name: "Figma", level: 88, color: "text-purple-600" },
      { name: "Adobe XD", level: 82, color: "text-pink-600" },
      { name: "VS Code", level: 95, color: "text-blue-600" },
      { name: "Git", level: 93, color: "text-orange-600" },
      { name: "Postman", level: 86, color: "text-orange-500" },
      { name: "Webpack", level: 79, color: "text-blue-500" }
    ]
  }
];

export default function HomePage() {
  const statsRef = useRef<HTMLDivElement>(null);
  const [hasAnimated, setHasAnimated] = useState(false);
  
  useIntersectionObserver(statsRef, () => {
    if (!hasAnimated) {
      setHasAnimated(true);
    }
  });

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50/99 via-blue-50/98 to-indigo-50/99 dark:from-slate-950/99 dark:via-slate-900/99 dark:to-indigo-950/99 relative overflow-hidden">
      {/* Premium Background Mesh */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8b5cf640_1px,transparent_1px),linear-gradient(to_bottom,#8b5cf640_1px,transparent_1px)] bg-[size:14px_24px] opacity-20" />
      
      {/* Magical Star Background */}
      <div className="stars-container">
        <div className="stars-layer-1"></div>
        <div className="stars-layer-2"></div>
        <div className="stars-layer-3"></div>
        <div className="constellation"></div>
        <div className="shooting-star"></div>
        <div className="shooting-star"></div>
        <div className="shooting-star"></div>
      </div>

      {/* Enhanced Floating Orbs with Glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        {/* Large magical orbs with enhanced effects */}
        <div className="absolute -top-20 -right-20 sm:-top-40 sm:-right-40 w-60 h-60 sm:w-96 sm:h-96 bg-gradient-to-br from-blue-400/15 via-purple-400/10 to-indigo-400/15 dark:from-blue-400/8 dark:via-purple-400/5 dark:to-indigo-400/8 rounded-full blur-3xl animate-pulse shadow-2xl floating-animation" />
        <div className="absolute top-20 -left-20 sm:top-40 sm:-left-40 w-60 h-60 sm:w-96 sm:h-96 bg-gradient-to-br from-purple-400/15 via-pink-400/10 to-rose-400/15 dark:from-purple-400/8 dark:via-pink-400/5 dark:to-rose-400/8 rounded-full blur-3xl animate-pulse delay-1000 shadow-2xl float-delay-1" />
        <div className="absolute bottom-20 right-20 sm:bottom-40 sm:right-40 w-60 h-60 sm:w-96 sm:h-96 bg-gradient-to-br from-indigo-400/15 via-blue-400/10 to-cyan-400/15 dark:from-indigo-400/8 dark:via-blue-400/5 dark:to-cyan-400/8 rounded-full blur-3xl animate-pulse delay-2000 shadow-2xl float-delay-2" />
        
        {/* Medium floating orbs with premium effects */}
        <div className="absolute top-1/3 left-1/4 w-32 h-32 sm:w-48 sm:h-48 bg-gradient-to-br from-emerald-400/20 via-teal-400/15 to-cyan-400/20 dark:from-emerald-400/10 dark:via-teal-400/8 dark:to-cyan-400/10 rounded-full blur-2xl animate-pulse delay-500 shadow-xl floating-animation" />
        <div className="absolute bottom-1/3 right-1/4 w-32 h-32 sm:w-48 sm:h-48 bg-gradient-to-br from-rose-400/20 via-pink-400/15 to-fuchsia-400/20 dark:from-rose-400/10 dark:via-pink-400/8 dark:to-fuchsia-400/10 rounded-full blur-2xl animate-pulse delay-1500 shadow-xl float-delay-1" />
        
        {/* Small accent orbs with micro-animations */}
        <div className="absolute top-2/3 left-1/3 w-16 h-16 sm:w-24 sm:h-24 bg-gradient-to-br from-amber-400/25 via-yellow-400/20 to-orange-400/25 dark:from-amber-400/12 dark:via-yellow-400/10 dark:to-orange-400/12 rounded-full blur-xl animate-pulse delay-2500 shadow-lg pulse-glow" />
        <div className="absolute top-1/4 right-1/3 w-16 h-16 sm:w-24 sm:h-24 bg-gradient-to-br from-violet-400/25 via-purple-400/20 to-indigo-400/25 dark:from-violet-400/12 dark:via-purple-400/10 dark:to-indigo-400/12 rounded-full blur-xl animate-pulse delay-3000 shadow-lg float-delay-2" />
        
        {/* Ultra subtle gradient mesh */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/2 via-purple-500/2 to-pink-500/2 dark:from-blue-400/1 dark:via-purple-400/1 dark:to-pink-400/1 animate-pulse" />
        
        {/* Floating particles */}
        <div className="particles">
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
        </div>
      </div>
      
      {/* Enhanced Hero Section */}
      <div className="relative">
        <EnhancedHero />
        
        {/* Subtle transition gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white/90 via-white/50 to-transparent dark:from-slate-900/90 dark:via-slate-900/50 pointer-events-none" />
      </div>

      {/* Stats Section - Enhanced Responsive */}
      <SectionWrapper className="relative bg-gradient-to-br from-white/80 via-blue-50/30 to-indigo-50/40 dark:from-slate-900/90 dark:via-indigo-950/30 dark:to-slate-800/40 z-10">
        <div className="relative z-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-6 sm:mb-8 md:mb-12 relative"
          >
            {/* Background glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-purple-600/5 to-indigo-600/5 rounded-3xl blur-3xl" />
            
            <div className="relative z-10">
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold mb-2 sm:mb-3 md:mb-4 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent leading-tight">
                Portfolio Stats
              </h2>
              <p className="text-xs sm:text-sm md:text-base lg:text-lg text-slate-600 dark:text-slate-400 max-w-xl mx-auto px-4 leading-relaxed">
                Numbers that reflect my commitment to excellence
              </p>
            </div>
          </motion.div>

          <div ref={statsRef} className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4 lg:gap-6 max-w-4xl mx-auto">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={hasAnimated ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: index * 0.1, duration: 0.4 }}
                className="w-full"
              >
                <StatCard 
                  label={stat.label}
                  value={stat.value}
                  suffix={stat.suffix}
                  gradient="from-blue-600 via-purple-600 to-indigo-600"
                />
              </motion.div>
            ))}
          </div>
        </div>
      </SectionWrapper>

      {/* Services Section - Enhanced Mobile-First */}
      <SectionWrapper className="relative bg-gradient-to-br from-indigo-50/60 via-white/40 to-purple-50/60 dark:from-indigo-950/60 dark:via-slate-900/40 dark:to-purple-950/60 z-10">
        {/* Optimized background decorations */}
        <div className="absolute top-5 right-5 sm:top-10 sm:right-10 w-8 h-8 sm:w-12 sm:h-12 bg-indigo-200/15 dark:bg-indigo-800/8 rounded-full blur-xl animate-pulse" />
        <div className="absolute bottom-5 left-5 sm:bottom-10 sm:left-10 w-10 h-10 sm:w-16 sm:h-16 bg-purple-200/15 dark:bg-purple-800/8 rounded-full blur-xl animate-pulse delay-1000" />
        
        <div className="relative z-20">
          <div className="text-center mb-6 sm:mb-8 md:mb-12">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold mb-2 sm:mb-3 md:mb-4 leading-tight"
            >
              <GradientText className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">Services & Expertise</GradientText>
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-xs sm:text-sm md:text-base lg:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto px-4 leading-relaxed"
            >
              Comprehensive web development services with modern technologies
            </motion.p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 max-w-6xl mx-auto">
            {services.map((service, index) => (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05, duration: 0.4 }}
                className="w-full h-full"
              >
                <Card
                  variant="default"
                  hover
                  className="h-full min-h-[200px] sm:min-h-[220px] bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm border border-white/80 dark:border-slate-700/80 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group overflow-hidden flex flex-col"
                >
                  {/* Shiny overlay */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/8 to-transparent opacity-0 group-hover:opacity-100 group-hover:translate-x-full transition-all duration-700 -skew-x-12" />
                  
                  <div className="relative z-10 p-4 sm:p-5 lg:p-6 flex flex-col h-full">
                    {/* Header - Fixed Height to Prevent Overlap */}
                    <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4 mb-4 min-h-[80px] sm:min-h-[70px]">
                      <div className={`text-2xl sm:text-3xl lg:text-4xl p-3 sm:p-3.5 rounded-xl shadow-lg bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-600 text-white group-hover:scale-105 transition-transform duration-300 flex-shrink-0 self-start`}>
                        {service.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-300 leading-tight">
                          {service.title}
                        </h3>
                        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-2">
                          {service.description}
                        </p>
                      </div>
                    </div>
                    
                    {/* Technologies - Flexible Layout */}
                    <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-auto">
                      {service.technologies.map((tech) => (
                        <Badge 
                          key={tech} 
                          variant="secondary"
                          className="bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-700/50 hover:scale-105 transition-all duration-200 px-2 sm:px-2.5 py-1 text-xs sm:text-sm font-medium"
                        >
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </SectionWrapper>

      {/* Technologies Section - Fully Optimized */}
      <SectionWrapper className="relative bg-gradient-to-br from-slate-50/80 via-white/60 to-gray-50/80 dark:from-slate-950/80 dark:via-slate-900/60 dark:to-gray-950/80 z-10">
        <div className="relative z-20">
          <div className="text-center mb-6 sm:mb-8 md:mb-12 relative">
            {/* Enhanced background effects */}
            <div className="absolute inset-0 bg-gradient-to-r from-slate-700/5 via-gray-600/5 to-slate-800/5 dark:from-slate-200/5 dark:via-gray-300/5 dark:to-slate-100/5 rounded-3xl blur-3xl" />
            
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold mb-2 sm:mb-3 md:mb-4 leading-tight relative z-10"
            >
              <GradientText className="bg-gradient-to-r from-slate-700 via-gray-600 to-slate-800 dark:from-slate-200 dark:via-gray-300 dark:to-slate-100">
                Technologies I Love Working With
              </GradientText>
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-xs sm:text-sm md:text-base lg:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto px-4 leading-relaxed relative z-10"
            >
              Modern technologies that I use to build exceptional digital experiences
            </motion.p>
          </div>

          {/* Enhanced Responsive Grid Layout */}
          <div className="space-y-4 sm:space-y-6 md:space-y-8 max-w-6xl mx-auto">
            {technologies.map((category, categoryIndex) => (
              <motion.div
                key={category.category}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: categoryIndex * 0.05, duration: 0.4 }}
                className="w-full"
              >
                <Card 
                  variant="default" 
                  hover 
                  className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm border border-gray-200/70 dark:border-slate-700/70 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group overflow-hidden"
                >
                  {/* Enhanced shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/8 to-transparent opacity-0 group-hover:opacity-100 group-hover:translate-x-full transition-all duration-1000 -skew-x-12" />
                  
                  <div className="relative z-10 p-3 sm:p-4 md:p-6">
                    {/* Category Header - Optimized */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 pb-3 sm:pb-4 mb-4 sm:mb-6 border-b border-gray-100 dark:border-slate-700">
                      <div className={`text-2xl sm:text-3xl md:text-4xl p-2 sm:p-3 rounded-lg sm:rounded-xl shadow-md bg-gradient-to-r ${category.gradient} text-white group-hover:scale-105 transition-transform duration-300 flex-shrink-0`}>
                        {category.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300 leading-tight">
                          {category.category}
                        </h3>
                        <p className="text-xs sm:text-sm md:text-base text-slate-600 dark:text-slate-400">
                          {category.techs.length} Technologies
                        </p>
                      </div>
                    </div>

                    {/* Technologies List - Vertical Layout to Prevent Overlaps */}
                    <div className="space-y-3 sm:space-y-4">
                      {category.techs.map((tech, techIndex) => (
                        <motion.div
                          key={tech.name}
                          initial={{ opacity: 0, x: -20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: (categoryIndex * 0.05) + (techIndex * 0.03), duration: 0.4 }}
                          className="group/tech w-full"
                        >
                          <div className="bg-gradient-to-r from-white/95 via-gray-50/95 to-white/95 dark:from-slate-700/90 dark:via-slate-600/90 dark:to-slate-700/90 rounded-xl p-3 sm:p-4 border border-gray-200/80 dark:border-slate-600/60 hover:border-gray-300 dark:hover:border-slate-500 transition-all duration-300 hover:shadow-lg group-hover/tech:shadow-xl relative overflow-hidden backdrop-blur-sm">
                            {/* Premium shine effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover/tech:opacity-100 group-hover/tech:translate-x-full transition-all duration-700 -skew-x-12" />
                            
                            {/* Content Layout - No Overlap */}
                            <div className="relative z-10 flex items-center justify-between gap-3 sm:gap-4">
                              {/* Tech Name and Level */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-2">
                                  <span className={cn(
                                    "font-bold text-sm sm:text-base md:text-lg group-hover/tech:scale-105 transition-transform duration-300 truncate", 
                                    tech.color, 
                                    "dark:opacity-90"
                                  )} title={tech.name}>
                                    {tech.name}
                                  </span>
                                  <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-semibold ml-2 flex-shrink-0">
                                    {tech.level}%
                                  </span>
                                </div>
                                
                                {/* Progress Bar - Full Width with Proper Spacing */}
                                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 sm:h-2.5 overflow-hidden shadow-inner relative">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    whileInView={{ width: `${tech.level}%` }}
                                    viewport={{ once: true }}
                                    transition={{ 
                                      delay: (categoryIndex * 0.05) + (techIndex * 0.03) + 0.1, 
                                      duration: 0.8, 
                                      ease: "easeOut" 
                                    }}
                                    className={cn("h-full bg-gradient-to-r rounded-full shadow-lg relative overflow-hidden", category.gradient)}
                                  >
                                    {/* Subtle shimmer effect */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse opacity-40" />
                                  </motion.div>
                                </div>
                              </div>
                              
                              {/* Success Indicator */}
                              <div className="flex-shrink-0 ml-3">
                                <div className="w-6 h-6 sm:w-7 sm:h-7 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-md group-hover/tech:scale-110 transition-transform duration-300">
                                  ✓
                                </div>
                              </div>
                            </div>
                            
                            {/* Floating glow effects */}
                            <div className="absolute top-1 right-1 w-1 h-1 bg-blue-400/40 rounded-full opacity-0 group-hover/tech:opacity-100 group-hover/tech:animate-ping transition-opacity duration-500" />
                            <div className="absolute bottom-1 left-1 w-1 h-1 bg-purple-400/40 rounded-full opacity-0 group-hover/tech:opacity-100 group-hover/tech:animate-ping transition-opacity duration-500 delay-200" />
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Optimized CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-6 sm:mt-8 md:mt-12 text-center"
          >
            <Card variant="default" className="max-w-xl mx-auto bg-gradient-to-r from-slate-50/90 to-gray-50/90 dark:from-slate-800/90 dark:to-gray-800/90 border-slate-200 dark:border-slate-600 shadow-lg hover:shadow-xl transition-all duration-300 group overflow-hidden">
              {/* Shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/8 to-transparent opacity-0 group-hover:opacity-100 group-hover:translate-x-full transition-all duration-700 -skew-x-12" />
              
              <div className="relative z-10 p-4 sm:p-6 md:p-8 text-center">
                <h4 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-slate-900 dark:text-white mb-2 sm:mb-3">
                  Ready to Build Something Amazing?
                </h4>
                <p className="text-slate-600 dark:text-slate-400 mb-3 sm:mb-4 text-xs sm:text-sm md:text-base leading-relaxed">
                  Let&apos;s discuss how these technologies can bring your project to life
                </p>
                <Button asChild className="bg-gradient-to-r from-slate-600 to-gray-600 hover:from-slate-700 hover:to-gray-700 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 text-sm sm:text-base">
                  <Link href="/contact" className="flex items-center gap-2 justify-center">
                    Start Your Project
                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </Link>
                </Button>
              </div>
            </Card>
          </motion.div>
        </div>
      </SectionWrapper>

      {/* Featured Projects Section - Mobile Optimized */}
      <SectionWrapper className="relative bg-gradient-to-br from-purple-50/60 via-white/40 to-pink-50/60 dark:from-purple-950/60 dark:via-slate-900/40 dark:to-pink-950/60 z-10">
        <div className="relative z-20">
          <div className="text-center mb-6 sm:mb-8 md:mb-12">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold mb-2 sm:mb-3 md:mb-4 leading-tight"
            >
              <GradientText className="bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600">Featured Projects</GradientText>
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-xs sm:text-sm md:text-base lg:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto px-4 leading-relaxed"
            >
              Recent projects that showcase my skills and creativity
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 max-w-7xl mx-auto">
            {featuredProjects.map((project, index) => (
              <motion.div
                key={project.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05, duration: 0.4 }}
                className="w-full h-full"
              >
                <Card 
                  variant="premium" 
                  hover 
                  className="h-full min-h-[400px] sm:min-h-[450px] bg-white/98 dark:bg-slate-800/98 backdrop-blur-xl border border-white/90 dark:border-slate-700/90 shadow-xl hover:shadow-purple-500/25 dark:hover:shadow-purple-400/25 hover:-translate-y-2 hover:scale-[1.01] transition-all duration-500 group overflow-hidden flex flex-col"
                >
                  {/* Premium glow effects */}
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-pink-500/5 to-rose-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent opacity-0 group-hover:opacity-100 group-hover:translate-x-full transition-all duration-1000 -skew-x-12" />
                  
                  {/* Floating particles */}
                  <div className="absolute top-2 left-2 w-1 h-1 bg-purple-400/40 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping transition-opacity duration-500" />
                  <div className="absolute bottom-2 right-2 w-1 h-1 bg-pink-400/40 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping transition-opacity duration-500 delay-300" />
                  
                  <div className="relative z-10 p-4 sm:p-5 lg:p-6 h-full flex flex-col">
                    {/* Project Image - Fixed Height */}
                    <div className="relative h-32 sm:h-40 lg:h-48 bg-gradient-to-br from-purple-100/90 via-pink-100/90 to-rose-100/90 dark:from-purple-900/40 dark:via-pink-900/40 dark:to-rose-900/40 rounded-xl mb-4 overflow-hidden flex-shrink-0 shadow-inner group-hover:shadow-lg transition-shadow duration-500">
                      <Image 
                        src={project.image} 
                        alt={project.title}
                        fill
                        className="object-contain p-4 sm:p-6 group-hover:scale-105 group-hover:rotate-1 transition-transform duration-500 filter group-hover:brightness-110"
                      />
                      {project.featured && (
                        <Badge className="absolute top-2 sm:top-3 right-2 sm:right-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-none shadow-lg text-xs px-2 py-1 animate-pulse">
                          ⭐ Featured
                        </Badge>
                      )}
                      
                      {/* Image overlay glow */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/5 via-transparent to-transparent group-hover:from-black/10 transition-all duration-500" />
                    </div>
                    
                    {/* Project Content - Flexible Layout */}
                    <div className="flex-1 flex flex-col space-y-3 min-h-0">
                      <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-300 leading-tight line-clamp-2">
                        {project.title}
                      </h3>
                      <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-3 flex-1">
                        {project.description}
                      </p>
                      
                      {/* Tech Stack - Responsive */}
                      <div className="flex flex-wrap gap-1.5 py-2">
                        {project.tech.slice(0, 3).map((tech) => (
                          <Badge 
                            key={tech} 
                            variant="secondary"
                            className="bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700/50 hover:scale-105 transition-all duration-200 px-2 py-1 text-xs"
                          >
                            {tech}
                          </Badge>
                        ))}
                        {project.tech.length > 3 && (
                          <Badge variant="secondary" className="text-xs px-2 py-1">
                            +{project.tech.length - 3}
                          </Badge>
                        )}
                      </div>
                      
                      {/* Action Buttons - Fixed Position */}
                      <div className="flex gap-2 pt-2 mt-auto flex-shrink-0">
                        <Button variant="outline" size="sm" asChild className="flex-1 text-xs sm:text-sm hover:scale-105 transition-transform duration-200 px-3 py-2">
                          <Link href={project.github} target="_blank" className="flex items-center gap-1.5 justify-center">
                            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                            </svg>
                            <span className="hidden sm:inline">Code</span>
                          </Link>
                        </Button>
                        <Button size="sm" asChild className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-xs sm:text-sm hover:scale-105 transition-all duration-200 px-3 py-2">
                          <Link href={project.demo} target="_blank" className="flex items-center gap-1.5 justify-center">
                            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            <span className="hidden sm:inline">Demo</span>
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
            className="text-center mt-6 sm:mt-8"
          >
            <Button asChild className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 text-sm sm:text-base px-4 sm:px-6 py-2 sm:py-3">
              <Link href="/projects" className="flex items-center gap-2">
                View All Projects
                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </Button>
          </motion.div>
        </div>
      </SectionWrapper>

      {/* Testimonials Section */}
      <SectionWrapper className="relative bg-gradient-to-br from-emerald-50/90 via-white/80 to-teal-50/90 dark:from-emerald-950/90 dark:via-slate-900/80 dark:to-teal-950/90 py-24 lg:py-32 backdrop-blur-sm">
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-20 lg:mb-24">
            <motion.h2 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl lg:text-5xl xl:text-6xl font-bold mb-8"
            >
              <GradientText className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600">What Clients Say</GradientText>
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-xl lg:text-2xl text-slate-600 dark:text-slate-400 max-w-4xl mx-auto leading-relaxed"
            >
              Don&apos;t just take my word for it - here&apos;s what my clients have to say about working with me and the results we&apos;ve achieved together
            </motion.p>
          </div>

          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-10 lg:gap-12">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2, duration: 0.7 }}
              >
                <Card 
                  variant="premium" 
                  hover 
                  className="h-full hover:shadow-emerald-500/20 dark:hover:shadow-emerald-400/20 hover:-translate-y-4 relative overflow-hidden"
                >
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-teal-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  <div className="relative z-10">
                    {/* Client Info */}
                    <div className="flex items-center gap-6 mb-8">
                      <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 rounded-2xl flex items-center justify-center overflow-hidden shadow-xl group-hover:shadow-2xl group-hover:scale-110 transition-all duration-500 relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
                        <Image 
                          src={testimonial.avatar} 
                          alt={testimonial.name}
                          width={64}
                          height={64}
                          className="rounded-xl object-cover relative z-10"
                        />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-xl lg:text-2xl group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors duration-300">
                          {testimonial.name}
                        </h4>
                        <p className="text-slate-600 dark:text-slate-400 font-semibold text-lg">
                          {testimonial.role}
                        </p>
                      </div>
                    </div>
                    
                    {/* Testimonial Content */}
                    <p className="text-slate-700 dark:text-slate-300 mb-8 italic leading-relaxed text-xl">
                      &quot;{testimonial.content}&quot;
                    </p>
                    
                    {/* Rating Stars */}
                    <div className="flex gap-2">
                      {Array.from({ length: testimonial.rating }).map((_, i) => (
                        <svg
                          key={i}
                          className="w-6 h-6 text-yellow-400 group-hover:text-yellow-500 transition-colors duration-300 drop-shadow-lg"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                  
                  {/* Decorative corner element */}
                  <div className="absolute top-4 right-4 w-4 h-4 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-pulse" />
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </SectionWrapper>

      {/* CTA Section */}
      <SectionWrapper className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white py-24 lg:py-32 overflow-hidden">
        {/* Enhanced Background Patterns */}
        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,.15)_50%,transparent_75%)] bg-[length:30px_30px] opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/60 via-purple-600/60 to-pink-600/60" />
        
        {/* Floating Elements */}
        <div className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full blur-xl animate-pulse" />
        <div className="absolute top-32 right-16 w-16 h-16 bg-white/10 rounded-full blur-xl animate-pulse delay-1000" />
        <div className="absolute bottom-20 left-20 w-24 h-24 bg-white/10 rounded-full blur-xl animate-pulse delay-2000" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-5xl mx-auto">
            <motion.h2 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-5xl lg:text-6xl xl:text-7xl font-bold mb-8 leading-tight"
            >
              Ready to Start Your <span className="bg-gradient-to-r from-yellow-300 via-orange-300 to-red-300 bg-clip-text text-transparent">Amazing</span> Project?
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-2xl lg:text-3xl text-blue-100 max-w-4xl mx-auto mb-12 leading-relaxed font-light"
            >
              Let&apos;s work together to bring your innovative ideas to life. I&apos;m here to help you build something extraordinary that makes a real impact.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-8 justify-center"
            >
              <Button variant="secondary" size="lg" asChild className="bg-white text-indigo-600 hover:bg-gray-50 border-none shadow-2xl hover:shadow-3xl hover:scale-110 transition-all duration-500 px-12 py-6 rounded-2xl text-xl font-semibold">
                <Link href="/contact" className="flex items-center gap-3">
                  Get In Touch
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild className="border-white/80 text-white hover:bg-white hover:text-indigo-600 border-3 shadow-2xl hover:shadow-3xl hover:scale-110 transition-all duration-500 px-12 py-6 rounded-2xl text-xl font-semibold backdrop-blur-sm">
                <Link href="/projects" className="flex items-center gap-3">
                  View My Work
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </Button>
            </motion.div>
          </div>
        </div>
      </SectionWrapper>

      {/* Latest Blog Posts */}
      <SectionWrapper className="relative bg-gradient-to-br from-slate-50/90 via-white/80 to-gray-50/90 dark:from-slate-900/95 dark:via-slate-800/80 dark:to-gray-900/95 py-24 lg:py-32 backdrop-blur-sm">
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-20 lg:mb-24">
            <motion.h2 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl lg:text-5xl xl:text-6xl font-bold mb-8"
            >
              <GradientText className="bg-gradient-to-r from-slate-700 via-gray-700 to-slate-600 dark:from-slate-200 dark:via-gray-200 dark:to-slate-300">Latest Blog Posts</GradientText>
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-xl lg:text-2xl text-slate-600 dark:text-slate-400 max-w-4xl mx-auto leading-relaxed"
            >
              Thoughts, tutorials, and insights about web development, technology trends, and building amazing digital experiences
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <Card 
              variant="premium" 
              hover 
              className="max-w-3xl mx-auto mb-12 hover:shadow-slate-500/20 dark:hover:shadow-slate-400/20 hover:-translate-y-2 relative overflow-hidden"
            >
              {/* Enhanced background decoration */}
              <div className="absolute inset-0 bg-gradient-to-br from-slate-500/5 via-gray-500/5 to-slate-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="p-16 lg:p-20 relative z-10">
                <div className="w-24 h-24 bg-gradient-to-br from-slate-600 via-gray-600 to-slate-700 dark:from-slate-300 dark:via-gray-300 dark:to-slate-400 rounded-3xl flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform duration-500 shadow-xl relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
                  <svg className="w-12 h-12 text-white dark:text-slate-900 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                
                <h3 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white mb-6 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors duration-300">
                  Coming Soon: Blog & Insights
                </h3>
                
                <p className="text-slate-600 dark:text-slate-400 mb-10 text-xl lg:text-2xl leading-relaxed">
                  Blog posts will be loaded dynamically from your CMS, featuring the latest insights, tutorials, and industry trends
                </p>
                
                <Button asChild size="lg" className="bg-gradient-to-r from-slate-600 via-gray-600 to-slate-700 dark:from-slate-300 dark:via-gray-300 dark:to-slate-400 hover:from-slate-700 hover:via-gray-700 hover:to-slate-800 dark:hover:from-slate-200 dark:hover:via-gray-200 dark:hover:to-slate-300 text-white dark:text-slate-900 border-none shadow-2xl hover:shadow-3xl hover:scale-110 transition-all duration-500 px-12 py-6 rounded-2xl text-xl font-semibold">
                  <Link href="/blog" className="flex items-center gap-3">
                    Read All Posts
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </Link>
                </Button>
              </div>
              
              {/* Decorative corner elements */}
              <div className="absolute top-6 right-6 w-4 h-4 bg-gradient-to-r from-slate-500 to-gray-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-pulse" />
              <div className="absolute bottom-6 left-6 w-3 h-3 bg-gradient-to-r from-gray-500 to-slate-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-pulse delay-300" />
            </Card>
          </motion.div>
        </div>
      </SectionWrapper>
    </main>
  );
}