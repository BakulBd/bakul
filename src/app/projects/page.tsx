'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import ModernNavbar from '@/components/layout/ModernNavbar';
import { 
  ArrowTopRightOnSquareIcon, 
  CodeBracketIcon,
  EyeIcon,
  StarIcon,
  CalendarIcon,
  TagIcon,
  FunnelIcon,
  SparklesIcon,
  RocketLaunchIcon,
  AcademicCapIcon,
  BriefcaseIcon
} from '@heroicons/react/24/outline';

interface Project {
  id: number;
  title: string;
  description: string;
  technologies: string[];
  github: string;
  live: string;
  image: string;
  featured: boolean;
  category: 'web' | 'mobile' | 'fullstack' | 'tool';
  year: string;
  status: 'completed' | 'in-progress' | 'maintained';
  highlights: string[];
}

const ProjectsPage = () => {
  const [filter, setFilter] = useState<'all' | 'web' | 'mobile' | 'fullstack' | 'tool'>('all');
  const [mounted, setMounted] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const isDark = theme === 'dark';

  const projects: Project[] = [
    {
      id: 1,
      title: "E-Commerce Platform",
      description: "A comprehensive full-stack e-commerce solution with advanced features including real-time inventory management, multi-vendor support, and AI-powered product recommendations.",
      technologies: ["Next.js", "TypeScript", "PostgreSQL", "Tailwind CSS", "Stripe", "Redis", "AWS"],
      github: "https://github.com/bakulahmed/ecommerce-platform",
      live: "https://ecommerce-demo.bakul.dev",
      image: "/projects/ecommerce.png",
      featured: true,
      category: 'fullstack',
      year: '2024',
      status: 'completed',
      highlights: ["Multi-vendor marketplace", "Real-time analytics", "AI recommendations", "Payment processing"]
    },
    {
      id: 2,
      title: "Task Management Pro",
      description: "An advanced collaborative task management platform with real-time synchronization, advanced analytics, and intelligent automation features for teams.",
      technologies: ["React", "Node.js", "Socket.io", "MongoDB", "Express", "Chart.js", "Docker"],
      github: "https://github.com/bakulahmed/task-manager",
      live: "https://tasks.bakul.dev",
      image: "/projects/task-manager.png",
      featured: true,
      category: 'web',
      year: '2024',
      status: 'maintained',
      highlights: ["Real-time collaboration", "Smart automation", "Advanced analytics", "Team insights"]
    },
    {
      id: 3,
      title: "Portfolio Studio",
      description: "A modern, high-performance portfolio platform with advanced animations, SEO optimization, and CMS integration for content management.",
      technologies: ["Next.js", "TypeScript", "Framer Motion", "Tailwind CSS", "Sanity CMS"],
      github: "https://github.com/bakulahmed/portfolio",
      live: "https://bakul.dev",
      image: "/projects/portfolio.png",
      featured: false,
      category: 'web',
      year: '2024',
      status: 'maintained',
      highlights: ["Performance optimized", "SEO friendly", "CMS integration", "Responsive design"]
    },
    {
      id: 4,
      title: "Weather Intelligence",
      description: "Advanced weather tracking application with ML-powered forecasting, interactive maps, climate data analysis, and personalized weather insights.",
      technologies: ["React", "D3.js", "OpenWeather API", "Chart.js", "Python", "TensorFlow"],
      github: "https://github.com/bakulahmed/weather-dashboard",
      live: "https://weather.bakul.dev",
      image: "/projects/weather.png",
      featured: false,
      category: 'tool',
      year: '2023',
      status: 'completed',
      highlights: ["ML forecasting", "Interactive maps", "Climate analysis", "Personalized insights"]
    },
    {
      id: 5,
      title: "Mobile Banking App",
      description: "Secure mobile banking application with biometric authentication, real-time transactions, and comprehensive financial management tools.",
      technologies: ["React Native", "Node.js", "PostgreSQL", "JWT", "Expo", "Plaid API"],
      github: "https://github.com/bakulahmed/banking-app",
      live: "https://banking-demo.bakul.dev",
      image: "/projects/banking.png",
      featured: true,
      category: 'mobile',
      year: '2024',
      status: 'in-progress',
      highlights: ["Biometric auth", "Real-time transactions", "Financial insights", "Security focused"]
    },
    {
      id: 6,
      title: "DevTools Suite",
      description: "A comprehensive suite of developer tools including code formatters, API testing, and productivity utilities all in one platform.",
      technologies: ["Vue.js", "Express", "MongoDB", "Docker", "Nginx"],
      github: "https://github.com/bakulahmed/devtools",
      live: "https://tools.bakul.dev",
      image: "/projects/devtools.png",
      featured: false,
      category: 'tool',
      year: '2023',
      status: 'maintained',
      highlights: ["Multiple tools", "Developer focused", "High performance", "Easy to use"]
    }
  ];

  const categories = [
    { key: 'all', label: 'All Projects', icon: SparklesIcon },
    { key: 'fullstack', label: 'Full Stack', icon: RocketLaunchIcon },
    { key: 'web', label: 'Web Apps', icon: CodeBracketIcon },
    { key: 'mobile', label: 'Mobile', icon: BriefcaseIcon },
    { key: 'tool', label: 'Tools', icon: AcademicCapIcon }
  ];

  const filteredProjects = filter === 'all' 
    ? projects 
    : projects.filter(project => project.category === filter);

  const featuredProjects = filteredProjects.filter(project => project.featured);
  const otherProjects = filteredProjects.filter(project => !project.featured);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { 
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return isDark ? 'text-green-400 bg-green-500/20' : 'text-green-600 bg-green-100';
      case 'in-progress':
        return isDark ? 'text-blue-400 bg-blue-500/20' : 'text-blue-600 bg-blue-100';
      case 'maintained':
        return isDark ? 'text-purple-400 bg-purple-500/20' : 'text-purple-600 bg-purple-100';
      default:
        return isDark ? 'text-gray-400 bg-gray-500/20' : 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <motion.div 
      className={`min-h-screen transition-colors duration-500 relative overflow-hidden ${
        isDark 
          ? 'bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white' 
          : 'bg-gradient-to-br from-white via-blue-50 to-purple-50 text-gray-900'
      }`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      <ModernNavbar />
      
      {/* Enhanced Background Effects */}
      <div className="fixed inset-0 -z-10">
        {/* Animated gradient background */}
        <motion.div
          className={`absolute inset-0 transition-opacity duration-1000`}
          animate={{
            background: isDark 
              ? [
                  'radial-gradient(circle at 25% 25%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)',
                  'radial-gradient(circle at 75% 75%, rgba(147, 51, 234, 0.1) 0%, transparent 50%)',
                  'radial-gradient(circle at 50% 50%, rgba(16, 185, 129, 0.1) 0%, transparent 50%)'
                ]
              : [
                  'radial-gradient(circle at 25% 25%, rgba(59, 130, 246, 0.05) 0%, transparent 50%)',
                  'radial-gradient(circle at 75% 75%, rgba(147, 51, 234, 0.05) 0%, transparent 50%)',
                  'radial-gradient(circle at 50% 50%, rgba(16, 185, 129, 0.05) 0%, transparent 50%)'
                ]
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
        
        {/* Floating code symbols */}
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className={`absolute text-2xl font-mono ${
              isDark ? 'text-blue-400/10' : 'text-blue-500/20'
            }`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [-20, 20],
              x: [-10, 10],
              opacity: [0.1, 0.3, 0.1],
              rotate: [0, 360],
            }}
            transition={{
              duration: 8 + Math.random() * 4,
              repeat: Infinity,
              delay: Math.random() * 3,
              ease: 'easeInOut',
            }}
          >
            {['</>', '{}', '[]', '()', '<>', '&&', '||', '=>'][Math.floor(Math.random() * 8)]}
          </motion.div>
        ))}
        
        {/* Grid Pattern */}
        <div className={`absolute inset-0 opacity-20 ${
          isDark 
            ? 'bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)]'
            : 'bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)]'
        } bg-[size:60px_60px]`} />
      </div>

      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {/* Enhanced Hero Section */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className={`inline-flex items-center px-6 py-3 rounded-full border backdrop-blur-sm mb-8 ${
              isDark
                ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-blue-500/30'
                : 'bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20'
            }`}
          >
            <CodeBracketIcon className={`w-5 h-5 mr-2 ${
              isDark ? 'text-blue-400' : 'text-blue-600'
            }`} />
            <span className={`font-medium ${
              isDark ? 'text-blue-300' : 'text-blue-700'
            }`}>Featured Work</span>
          </motion.div>

          <motion.h1
            className={`text-5xl md:text-6xl lg:text-7xl font-black mb-6 bg-gradient-to-r bg-clip-text text-transparent leading-tight ${
              isDark 
                ? 'from-white via-blue-200 to-purple-200' 
                : 'from-gray-900 via-blue-700 to-purple-700'
            }`}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            style={{
              filter: isDark 
                ? 'drop-shadow(0 0 30px rgba(59, 130, 246, 0.3))' 
                : 'drop-shadow(0 0 20px rgba(59, 130, 246, 0.2))',
            }}
          >
            My Projects
          </motion.h1>
          
          <motion.p
            className={`text-xl md:text-2xl max-w-4xl mx-auto leading-relaxed ${
              isDark ? 'text-gray-300' : 'text-gray-600'
            }`}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Explore my latest work and innovative solutions. Each project represents a unique challenge 
            and showcases cutting-edge technologies and design principles.
          </motion.p>
        </motion.div>

        {/* Enhanced Filter Section */}
        <motion.div
          className="mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <div className="flex items-center justify-center mb-8">
            <FunnelIcon className={`w-5 h-5 mr-2 ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`} />
            <span className={`font-medium ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>Filter by Category</span>
          </div>
          
          <div className="flex flex-wrap justify-center gap-3">
            {categories.map((category) => (
              <motion.button
                key={category.key}
                onClick={() => setFilter(category.key as any)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`flex items-center px-6 py-3 rounded-full border backdrop-blur-sm transition-all duration-300 ${
                  filter === category.key
                    ? isDark
                      ? 'bg-blue-500/20 border-blue-500/50 text-blue-300'
                      : 'bg-blue-500/20 border-blue-500/50 text-blue-700'
                    : isDark
                      ? 'bg-gray-800/50 border-gray-700/50 text-gray-300 hover:bg-gray-700/50'
                      : 'bg-white/50 border-gray-300/50 text-gray-700 hover:bg-gray-100/50'
                }`}
              >
                <category.icon className="w-4 h-4 mr-2" />
                {category.label}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Featured Projects Section */}
        <AnimatePresence mode="wait">
          {featuredProjects.length > 0 && (
            <motion.div
              key="featured"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="mb-20"
            >
              <motion.h2 
                className={`text-3xl md:text-4xl font-bold mb-12 text-center bg-gradient-to-r bg-clip-text text-transparent ${
                  isDark 
                    ? 'from-blue-400 to-purple-400' 
                    : 'from-blue-600 to-purple-600'
                }`}
                variants={itemVariants}
              >
                Featured Projects
              </motion.h2>
              
              <div className="grid lg:grid-cols-2 gap-8">
                {featuredProjects.map((project) => (
                  <motion.div
                    key={project.id}
                    variants={itemVariants}
                    whileHover={{ y: -10, scale: 1.02 }}
                    className={`group backdrop-blur-lg rounded-3xl border transition-all duration-500 overflow-hidden ${
                      isDark
                        ? 'bg-gray-900/50 border-gray-700/50 hover:border-gray-600/70 hover:bg-gray-800/60'
                        : 'bg-white/70 border-gray-300/50 hover:border-gray-400/70 hover:bg-white/80'
                    }`}
                    style={{
                      boxShadow: isDark 
                        ? '0 25px 50px -12px rgba(0, 0, 0, 0.5)' 
                        : '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
                    }}
                  >
                    {/* Project Image */}
                    <div className={`aspect-video relative overflow-hidden ${
                      isDark ? 'bg-gradient-to-br from-gray-800 to-gray-900' : 'bg-gradient-to-br from-gray-100 to-gray-200'
                    }`}>
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                        <CodeBracketIcon className={`w-20 h-20 ${
                          isDark ? 'text-gray-600' : 'text-gray-400'
                        }`} />
                      </div>
                      <div className="absolute top-4 right-4 flex gap-2">
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(project.status)}`}>
                          {project.status.replace('-', ' ')}
                        </span>
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                          isDark ? 'text-blue-400 bg-blue-500/20' : 'text-blue-600 bg-blue-100'
                        }`}>
                          {project.year}
                        </span>
                      </div>
                    </div>
                    
                    <div className="p-8">
                      <div className="flex items-start justify-between mb-4">
                        <h3 className={`text-2xl lg:text-3xl font-bold transition-colors ${
                          isDark 
                            ? 'text-white group-hover:text-blue-400' 
                            : 'text-gray-900 group-hover:text-blue-600'
                        }`}>
                          {project.title}
                        </h3>
                        <div className="flex items-center gap-2">
                          <StarIcon className={`w-5 h-5 ${
                            isDark ? 'text-yellow-400' : 'text-yellow-500'
                          }`} />
                          <span className={`text-sm font-medium ${
                            isDark ? 'text-gray-300' : 'text-gray-600'
                          }`}>Featured</span>
                        </div>
                      </div>
                      
                      <p className={`text-lg leading-relaxed mb-6 ${
                        isDark ? 'text-gray-300' : 'text-gray-600'
                      }`}>
                        {project.description}
                      </p>

                      {/* Project Highlights */}
                      <div className="mb-6">
                        <h4 className={`text-sm font-semibold mb-3 ${
                          isDark ? 'text-gray-300' : 'text-gray-700'
                        }`}>Key Features:</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {project.highlights.map((highlight, index) => (
                            <div key={index} className={`flex items-center text-sm ${
                              isDark ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                              <div className={`w-1.5 h-1.5 rounded-full mr-2 ${
                                isDark ? 'bg-blue-400' : 'bg-blue-500'
                              }`} />
                              {highlight}
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mb-8">
                        {project.technologies.map((tech) => (
                          <span
                            key={tech}
                            className={`px-3 py-1.5 text-sm font-medium backdrop-blur-sm rounded-full border ${
                              isDark
                                ? 'bg-blue-500/10 border-blue-500/30 text-blue-300'
                                : 'bg-blue-500/10 border-blue-500/30 text-blue-700'
                            }`}
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                      
                      <div className="flex gap-4">
                        <motion.a
                          href={project.github}
                          target="_blank"
                          rel="noopener noreferrer"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className={`flex items-center gap-2 px-6 py-3 border rounded-xl font-medium transition-all duration-300 ${
                            isDark
                              ? 'bg-gray-800/50 border-gray-700/50 text-white hover:bg-gray-700/50'
                              : 'bg-gray-100/50 border-gray-300/50 text-gray-900 hover:bg-gray-200/50'
                          }`}
                        >
                          <CodeBracketIcon className="w-4 h-4" />
                          View Code
                        </motion.a>
                        
                        <motion.a
                          href={project.live}
                          target="_blank"
                          rel="noopener noreferrer"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                        >
                          <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                          Live Demo
                        </motion.a>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Other Projects Section */}
        <AnimatePresence mode="wait">
          {otherProjects.length > 0 && (
            <motion.div
              key="other"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="mb-20"
            >
              <motion.h2 
                className={`text-3xl md:text-4xl font-bold mb-12 text-center ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}
                variants={itemVariants}
              >
                Other Projects
              </motion.h2>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {otherProjects.map((project) => (
                  <motion.div
                    key={project.id}
                    variants={itemVariants}
                    whileHover={{ y: -5, scale: 1.02 }}
                    className={`group backdrop-blur-sm rounded-2xl border transition-all duration-300 p-6 ${
                      isDark
                        ? 'bg-gray-900/30 border-gray-700/30 hover:border-gray-600/50 hover:bg-gray-800/40'
                        : 'bg-white/60 border-gray-300/40 hover:border-gray-400/60 hover:bg-white/70'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <h3 className={`text-xl font-bold transition-colors ${
                        isDark 
                          ? 'text-white group-hover:text-blue-400' 
                          : 'text-gray-900 group-hover:text-blue-600'
                      }`}>
                        {project.title}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(project.status)}`}>
                          {project.status.replace('-', ' ')}
                        </span>
                      </div>
                    </div>
                    
                    <p className={`text-sm leading-relaxed mb-4 ${
                      isDark ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      {project.description}
                    </p>
                    
                    <div className="flex flex-wrap gap-1 mb-6">
                      {project.technologies.slice(0, 4).map((tech) => (
                        <span
                          key={tech}
                          className={`px-2 py-1 text-xs font-medium rounded ${
                            isDark 
                              ? 'bg-gray-700/50 text-gray-300' 
                              : 'bg-gray-100/70 text-gray-600'
                          }`}
                        >
                          {tech}
                        </span>
                      ))}
                      {project.technologies.length > 4 && (
                        <span className={`px-2 py-1 text-xs font-medium rounded ${
                          isDark 
                            ? 'bg-gray-700/50 text-gray-300' 
                            : 'bg-gray-100/70 text-gray-600'
                        }`}>
                          +{project.technologies.length - 4}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex gap-3">
                      <a
                        href={project.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center gap-1 text-sm font-medium transition-colors ${
                          isDark 
                            ? 'text-gray-400 hover:text-blue-400' 
                            : 'text-gray-600 hover:text-blue-600'
                        }`}
                      >
                        <CodeBracketIcon className="w-4 h-4" />
                        Code
                      </a>
                      
                      <a
                        href={project.live}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center gap-1 text-sm font-medium transition-colors ${
                          isDark 
                            ? 'text-gray-400 hover:text-blue-400' 
                            : 'text-gray-600 hover:text-blue-600'
                        }`}
                      >
                        <EyeIcon className="w-4 h-4" />
                        Demo
                      </a>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Enhanced CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="text-center"
        >
          <div className={`backdrop-blur-lg rounded-3xl border p-12 lg:p-16 ${
            isDark
              ? 'bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/20'
              : 'bg-gradient-to-br from-blue-500/5 to-purple-500/5 border-blue-500/20'
          }`}>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 1 }}
              className={`w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg`}
            >
              <RocketLaunchIcon className="w-10 h-10 text-white" />
            </motion.div>
            
            <h3 className={`text-3xl lg:text-4xl font-bold mb-6 bg-gradient-to-r bg-clip-text text-transparent ${
              isDark 
                ? 'from-white to-blue-200' 
                : 'from-gray-900 to-blue-700'
            }`}>
              Let's Build Something Amazing Together
            </h3>
            
            <p className={`text-xl leading-relaxed mb-10 max-w-3xl mx-auto ${
              isDark ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Have an exciting project in mind? I'd love to collaborate and bring your vision to life 
              with cutting-edge technology and innovative solutions.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.a
                href="/contact"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                <RocketLaunchIcon className="w-5 h-5" />
                Start a Project
              </motion.a>
              
              <motion.a
                href="/about"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`inline-flex items-center gap-2 px-8 py-4 border backdrop-blur-sm rounded-xl font-semibold transition-all duration-300 ${
                  isDark
                    ? 'bg-gray-800/50 border-gray-700/50 text-white hover:bg-gray-700/50'
                    : 'bg-white/50 border-gray-300/50 text-gray-900 hover:bg-gray-100/50'
                }`}
              >
                <AcademicCapIcon className="w-5 h-5" />
                Learn More About Me
              </motion.a>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default ProjectsPage;
