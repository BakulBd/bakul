'use client';

import EnhancedHero from '@/components/sections/EnhancedHero';
import { SectionWrapper, Card, Button, Badge, GradientText, SectionCard, StatCard } from '@/components/ui';
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
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/10 dark:bg-blue-400/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-40 -left-40 w-80 h-80 bg-purple-400/10 dark:bg-purple-400/5 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute bottom-40 right-40 w-80 h-80 bg-indigo-400/10 dark:bg-indigo-400/5 rounded-full blur-3xl animate-pulse delay-2000" />
      </div>
      
      {/* Enhanced Hero Section */}
      <EnhancedHero />

      {/* Stats Section */}
      <SectionWrapper className="relative bg-gradient-to-br from-white via-blue-50/80 to-indigo-100/80 dark:from-slate-900/95 dark:via-indigo-950/80 dark:to-slate-800/95 py-28 lg:py-36 backdrop-blur-sm">
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-24 lg:mb-28"
          >
            <h2 className="text-4xl lg:text-5xl xl:text-6xl font-bold mb-8 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Portfolio Stats
            </h2>
            <p className="text-xl lg:text-2xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed">
              Numbers that reflect my commitment to excellence and passion for development
            </p>
          </motion.div>

          <div ref={statsRef} className="grid grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-14">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 30 }}
                animate={hasAnimated ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: index * 0.2, duration: 0.6, ease: "easeOut" }}
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

      {/* Services Section */}
      <SectionWrapper className="relative bg-gradient-to-br from-indigo-50/90 via-white/80 to-purple-50/90 dark:from-indigo-950/90 dark:via-slate-900/80 dark:to-purple-950/90 py-28 lg:py-36 backdrop-blur-sm">
        {/* Enhanced background decorations */}
        <div className="absolute top-10 right-10 w-24 h-24 bg-indigo-200/40 dark:bg-indigo-800/30 rounded-full blur-2xl animate-pulse" />
        <div className="absolute bottom-10 left-10 w-32 h-32 bg-purple-200/40 dark:bg-purple-800/30 rounded-full blur-2xl animate-pulse delay-1000" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-24 lg:mb-28">
            <motion.h2 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl lg:text-5xl xl:text-6xl font-bold mb-8"
            >
              <GradientText className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">Services & Expertise</GradientText>
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-xl lg:text-2xl text-slate-600 dark:text-slate-400 max-w-4xl mx-auto leading-relaxed"
            >
              I offer comprehensive web development services, from concept to deployment, with a focus on modern technologies and industry best practices
            </motion.p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 lg:gap-16">
            {services.map((service, index) => (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2, duration: 0.8 }}
              >
                <SectionCard
                  title={service.title}
                  subtitle={service.description}
                  icon={service.icon}
                  gradient="from-indigo-500 via-purple-500 to-pink-600"
                  bgGradient="from-indigo-500/8 via-purple-500/8 to-pink-500/8"
                  className="h-full hover:shadow-indigo-500/20 dark:hover:shadow-indigo-400/20 hover:-translate-y-6"
                >
                  <div className="flex flex-wrap gap-4">
                    {service.technologies.map((tech) => (
                      <Badge 
                        key={tech} 
                        variant="secondary"
                        className="bg-gradient-to-r from-indigo-100 via-purple-100 to-pink-100 dark:from-indigo-900/50 dark:via-purple-900/50 dark:to-pink-900/50 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-700/50 hover:scale-110 transition-all duration-400 px-5 py-3 text-sm font-semibold rounded-full shadow-lg hover:shadow-xl"
                      >
                        {tech}
                      </Badge>
                    ))}
                  </div>
                </SectionCard>
              </motion.div>
            ))}
          </div>
        </div>
      </SectionWrapper>

      {/* Technologies Section */}
      <SectionWrapper className="relative bg-gradient-to-br from-slate-50/95 via-white/90 to-gray-50/95 dark:from-slate-950/95 dark:via-slate-900/90 dark:to-gray-950/95 py-20 sm:py-24 md:py-28 lg:py-32 xl:py-40 backdrop-blur-sm">
        {/* Background decorative elements */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-blue-200/20 dark:bg-blue-800/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-purple-200/20 dark:bg-purple-800/10 rounded-full blur-3xl animate-pulse delay-1000" />
        
        <div className="relative z-10">
          <div className="text-center mb-16 sm:mb-20 md:mb-24 lg:mb-32">
            <motion.h2 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-6 lg:mb-8 leading-tight"
            >
              <GradientText className="bg-gradient-to-r from-slate-700 via-gray-600 to-slate-800 dark:from-slate-200 dark:via-gray-300 dark:to-slate-100">
                Technologies I Love Working With
              </GradientText>
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-lg sm:text-xl lg:text-2xl text-slate-600 dark:text-slate-400 max-w-4xl mx-auto leading-relaxed px-4"
            >
              A comprehensive toolkit of cutting-edge technologies and frameworks that I master to build exceptional digital experiences
            </motion.p>
          </div>

          {/* Enhanced Grid Layout with better spacing */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 md:gap-12 lg:gap-16 xl:gap-20">
            {technologies.map((category, categoryIndex) => (
              <motion.div
                key={category.category}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: categoryIndex * 0.15, duration: 0.8 }}
                className="w-full"
              >
                <Card 
                  variant="premium" 
                  hover 
                  className={`h-full bg-gradient-to-br ${category.bgGradient} hover:shadow-2xl hover:-translate-y-3 border-white/70 dark:border-slate-700/70 relative overflow-hidden min-h-[600px] lg:min-h-[700px]`}
                >
                  {/* Enhanced gradient overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${category.bgGradient} opacity-0 group-hover:opacity-40 transition-opacity duration-500`} />
                  
                  <div className="relative z-10 h-full flex flex-col">
                    {/* Category Header - Fixed height to prevent overlap */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-8 lg:mb-12 min-h-[120px]">
                      <div className={`text-5xl lg:text-6xl bg-gradient-to-r ${category.gradient} p-5 lg:p-6 rounded-2xl lg:rounded-3xl shadow-2xl group-hover:scale-105 transition-transform duration-500 relative overflow-hidden flex-shrink-0`}>
                        <div className="absolute inset-0 bg-white/20 dark:bg-black/20" />
                        <span className="relative z-10">{category.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white mb-2 lg:mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300 leading-tight">
                          {category.category}
                        </h3>
                        <p className="text-base lg:text-xl text-slate-600 dark:text-slate-400 font-medium">
                          {category.techs.length} Advanced Technologies
                        </p>
                      </div>
                    </div>

                    {/* Technologies List - Improved spacing */}
                    <div className="flex-1 space-y-6 lg:space-y-8">
                      {category.techs.map((tech, techIndex) => (
                        <motion.div
                          key={tech.name}
                          initial={{ opacity: 0, x: -20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: (categoryIndex * 0.15) + (techIndex * 0.08), duration: 0.6 }}
                          className="group/tech p-1"
                        >
                          {/* Technology Header - Better responsive layout */}
                          <div className="flex items-center justify-between mb-3 lg:mb-4 gap-4">
                            <span className={cn(
                              "font-bold text-lg sm:text-xl lg:text-2xl group-hover/tech:scale-105 transition-transform duration-300 flex-shrink-0", 
                              tech.color, 
                              "dark:opacity-90"
                            )}>
                              {tech.name}
                            </span>
                            <div className="flex items-center gap-2 lg:gap-3 flex-shrink-0">
                              <span className="text-slate-600 dark:text-slate-400 font-semibold text-base lg:text-xl whitespace-nowrap">
                                {tech.level}%
                              </span>
                              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-xs lg:text-sm shadow-lg flex-shrink-0">
                                ✓
                              </div>
                            </div>
                          </div>
                          
                          {/* Enhanced Skill Progress Bar with better sizing */}
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 lg:h-4 overflow-hidden shadow-inner mb-2 lg:mb-3">
                            <motion.div
                              initial={{ width: 0 }}
                              whileInView={{ width: `${tech.level}%` }}
                              viewport={{ once: true }}
                              transition={{ 
                                delay: (categoryIndex * 0.15) + (techIndex * 0.08) + 0.3, 
                                duration: 1.2, 
                                ease: "easeOut" 
                              }}
                              className={cn("h-full bg-gradient-to-r rounded-full shadow-lg relative overflow-hidden", category.gradient)}
                            >
                              {/* Enhanced animated shine effect */}
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse opacity-60" />
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent animate-ping opacity-40" />
                            </motion.div>
                          </div>
                          
                          {/* Experience indicator - Better spacing */}
                          <div className="flex justify-between text-xs lg:text-sm text-slate-500 dark:text-slate-400 px-1">
                            <span>Beginner</span>
                            <span>Expert</span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Enhanced floating decoration */}
                  <div className="absolute top-4 lg:top-6 right-4 lg:right-6 w-3 h-3 lg:w-4 lg:h-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-pulse" />
                  <div className="absolute bottom-4 lg:bottom-6 left-4 lg:left-6 w-2 h-2 lg:w-3 lg:h-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-pulse delay-300" />
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Call to Action for Technologies */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-12 sm:mt-16 lg:mt-20 xl:mt-24"
          >
            <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-lg border border-white/70 dark:border-slate-700/70 rounded-2xl lg:rounded-3xl p-8 sm:p-10 lg:p-12 max-w-3xl mx-auto shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
              <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white mb-4 lg:mb-6">
                Let&apos;s Build Something Amazing Together
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-base sm:text-lg lg:text-xl mb-6 lg:mb-8 leading-relaxed px-2">
                Ready to leverage these technologies for your next project?
              </p>
              <Button asChild size="lg" className="bg-gradient-to-r from-slate-600 via-gray-600 to-slate-700 hover:from-slate-700 hover:via-gray-700 hover:to-slate-800 text-white border-none shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 px-8 sm:px-10 py-3 sm:py-4 rounded-xl lg:rounded-2xl text-base lg:text-lg font-semibold">
                <Link href="/contact" className="flex items-center gap-2 lg:gap-3">
                  Start a Project
                  <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </SectionWrapper>

      {/* Featured Projects Section */}
      <SectionWrapper className="relative bg-gradient-to-br from-purple-50/90 via-white/80 to-pink-50/90 dark:from-purple-950/90 dark:via-slate-900/80 dark:to-pink-950/90 py-24 lg:py-32 backdrop-blur-sm">
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-20 lg:mb-24">
            <motion.h2 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl lg:text-5xl xl:text-6xl font-bold mb-8"
            >
              <GradientText className="bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600">Featured Projects</GradientText>
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-xl lg:text-2xl text-slate-600 dark:text-slate-400 max-w-4xl mx-auto leading-relaxed"
            >
              Here are some of my recent projects that showcase my skills, creativity, and passion for building exceptional digital experiences
            </motion.p>
          </div>

          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-10 lg:gap-12">
            {featuredProjects.map((project, index) => (
              <motion.div
                key={project.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2, duration: 0.7 }}
              >
                <Card 
                  variant="premium" 
                  hover 
                  className="h-full hover:shadow-purple-500/20 dark:hover:shadow-purple-400/20 hover:-translate-y-6 overflow-hidden"
                >
                  {/* Project Image */}
                  <div className="relative h-64 lg:h-72 bg-gradient-to-br from-purple-100 via-pink-100 to-rose-100 dark:from-purple-900/40 dark:via-pink-900/40 dark:to-rose-900/40 overflow-hidden rounded-2xl mb-6">
                    <Image 
                      src={project.image} 
                      alt={project.title}
                      fill
                      className="object-contain p-10 group-hover:scale-110 transition-transform duration-700"
                    />
                    {project.featured && (
                      <Badge className="absolute top-6 right-6 bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-none shadow-xl z-10">
                        ⭐ Featured
                      </Badge>
                    )}
                    
                    {/* Enhanced overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent group-hover:from-black/40 transition-all duration-500 rounded-2xl" />
                  </div>
                  
                  {/* Project Content */}
                  <div className="space-y-6">
                    <h3 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-300">
                      {project.title}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-lg">
                      {project.description}
                    </p>
                    
                    {/* Tech Stack */}
                    <div className="flex flex-wrap gap-3">
                      {project.tech.map((tech) => (
                        <Badge 
                          key={tech} 
                          variant="secondary"
                          className="bg-gradient-to-r from-purple-100 via-pink-100 to-rose-100 dark:from-purple-900/40 dark:via-pink-900/40 dark:to-rose-900/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700/50 hover:scale-110 transition-all duration-300 px-4 py-2 text-sm font-semibold rounded-full shadow-md hover:shadow-lg"
                        >
                          {tech}
                        </Badge>
                      ))}
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex gap-4 pt-4">
                      <Button variant="outline" size="sm" asChild className="flex-1 hover:scale-105 transition-transform duration-300">
                        <Link href={project.github} target="_blank" className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                          </svg>
                          Code
                        </Link>
                      </Button>
                      <Button size="sm" asChild className="flex-1 bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 hover:from-purple-700 hover:via-pink-700 hover:to-rose-700 hover:scale-105 transition-all duration-300">
                        <Link href={project.demo} target="_blank" className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          Demo
                        </Link>
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-20"
          >
            <Button asChild size="lg" className="bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 hover:from-purple-700 hover:via-pink-700 hover:to-rose-700 text-white border-none shadow-2xl hover:shadow-3xl hover:scale-110 transition-all duration-500 px-10 py-4 rounded-2xl text-lg font-semibold">
              <Link href="/projects" className="flex items-center gap-3">
                View All Projects
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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