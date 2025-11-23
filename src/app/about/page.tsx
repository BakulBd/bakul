'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import {
  SparklesIcon,
  CircleStackIcon,
  DevicePhoneMobileIcon,
  HandRaisedIcon,
  BoltIcon,
  ChatBubbleBottomCenterIcon,
  GlobeAsiaAustraliaIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import ModernNavbar from '@/components/layout/ModernNavbar';

export default function AboutPage() {
  const [activeSection, setActiveSection] = useState('story');
  const [hoveredSkill, setHoveredSkill] = useState<string | null>(null);
  const [hoveredExperience, setHoveredExperience] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const isDark = theme === 'dark';

  const skills = [
    { 
      name: 'React & Next.js', 
      level: 95, 
      color: 'from-blue-500 to-cyan-500',
      icon: '⚛️',
      description: 'Expert in building modern, scalable React applications with Next.js framework'
    },
    { 
      name: 'TypeScript', 
      level: 92, 
      color: 'from-blue-600 to-indigo-600',
      icon: '📘',
      description: 'Proficient in type-safe development and advanced TypeScript patterns'
    },
    { 
      name: 'Python & Django', 
      level: 88, 
      color: 'from-green-500 to-emerald-500',
      icon: '🐍',
      description: 'Experienced in backend development, API design, and data processing'
    },
    { 
      name: 'Database Design', 
      level: 85, 
      color: 'from-yellow-500 to-orange-500',
      icon: '🗄️',
      description: 'Skilled in PostgreSQL, MongoDB, and database optimization techniques'
    },
    { 
      name: 'UI/UX Design', 
      level: 90, 
      color: 'from-purple-500 to-pink-500',
      icon: '🎨',
      description: 'Creating intuitive user interfaces with modern design principles'
    },
    { 
      name: 'Cloud Services', 
      level: 82, 
      color: 'from-orange-500 to-red-500',
      icon: '☁️',
      description: 'AWS, Docker, and modern DevOps practices for scalable deployments'
    },
  ];

  const experiences = [
    {
      title: 'Computer Science Student',
      company: 'Leading University in Bangladesh',
      period: '2021 - Present',
      description: 'Pursuing Bachelor\'s in Computer Science & Engineering with focus on software development, algorithms, and modern web technologies. Maintaining excellent academic performance while building real-world projects.',
      icon: '🎓',
      technologies: ['Data Structures', 'Algorithms', 'Software Engineering', 'Database Systems', 'Web Development']
    },
    {
      title: 'Full-Stack Developer',
      company: 'Freelance & Contract Work',
      period: '2023 - Present',
      description: 'Developing end-to-end web applications for startups and local businesses. Specializing in React/Next.js frontends with Python/Django backends, delivering scalable solutions that drive business growth.',
      icon: '💻',
      technologies: ['React', 'Next.js', 'TypeScript', 'Python', 'Django', 'PostgreSQL']
    },
    {
      title: 'Open Source Contributor',
      company: 'GitHub Community',
      period: '2022 - Present',
      description: 'Contributing to open-source projects and building developer tools. Passionate about sharing knowledge through code contributions and helping the developer community grow.',
      icon: '🌟',
      technologies: ['Git', 'Open Source', 'Documentation', 'Code Review', 'Community Building']
    },
    {
      title: 'Problem Solver',
      company: 'Competitive Programming',
      period: '2021 - Present',
      description: 'Active participant in programming contests and online judges. Developed strong analytical thinking and algorithmic problem-solving skills through consistent practice and competition.',
      icon: '🏆',
      technologies: ['Algorithms', 'Data Structures', 'Problem Solving', 'Optimization', 'Mathematical Thinking']
    }
  ];

  const principles = [
    {
      title: 'Clarity over noise',
      detail: 'Every engagement starts with shared success metrics, decision logs, and crisp documentation.',
      icon: SparklesIcon,
      accent: 'from-blue-500/20 to-purple-500/10',
    },
    {
      title: 'Systems with soul',
      detail: 'Design tokens, content models, and API contracts stay in sync so interfaces feel effortless.',
      icon: CircleStackIcon,
      accent: 'from-emerald-500/20 to-teal-500/10',
    },
    {
      title: 'Async empathy',
      detail: 'Loom recaps, annotated Figma files, and structured handoffs keep remote teams confident.',
      icon: DevicePhoneMobileIcon,
      accent: 'from-amber-500/20 to-orange-500/10',
    },
  ];

  const collabStack = [
    { label: 'Product strategy', detail: 'Figjam workshops, product briefs, and KPI tracking.', icon: HandRaisedIcon },
    { label: 'Design & delivery', detail: 'Figma, Framer Motion, and custom design systems.', icon: BoltIcon },
    { label: 'Engineering', detail: 'Next.js, TypeScript, Python, Postgres, and edge-ready infra.', icon: CircleStackIcon },
    { label: 'Communication', detail: 'Linear, Notion, Slack, and async-first rituals.', icon: ChatBubbleBottomCenterIcon },
  ];

  const availability = [
    { label: 'Location', value: 'Sylhet, Bangladesh · Remote-first', icon: GlobeAsiaAustraliaIcon },
    { label: 'Rhythm', value: '2-week build sprints with mid-week demos', icon: ClockIcon },
  ];

  return (
    <motion.div 
      className={`min-h-screen relative overflow-hidden transition-all duration-1000 ${
        isDark 
          ? 'bg-gradient-to-br from-gray-950 via-slate-900 to-black text-white' 
          : 'bg-gradient-to-br from-white via-slate-50 to-gray-100 text-gray-900'
      }`}
      animate={{ 
        backgroundColor: isDark 
          ? ['#020617', '#0f172a', '#000000', '#020617'] 
          : ['#ffffff', '#f8fafc', '#f1f5f9', '#ffffff'] 
      }}
      transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
    >
      <ModernNavbar />
      
      {/* Enhanced Background Effects */}
      <div className="absolute inset-0 -z-10">
        {/* Animated gradient background */}
        <motion.div
          className="absolute inset-0"
          animate={{
            background: isDark
              ? [
                  'radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(139, 92, 246, 0.12) 0%, transparent 50%)',
                  'radial-gradient(circle at 80% 20%, rgba(139, 92, 246, 0.15) 0%, transparent 50%), radial-gradient(circle at 20% 80%, rgba(236, 72, 153, 0.12) 0%, transparent 50%)',
                  'radial-gradient(circle at 50% 50%, rgba(236, 72, 153, 0.15) 0%, transparent 50%), radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.12) 0%, transparent 50%)',
                ]
              : [
                  'radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.08) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(139, 92, 246, 0.06) 0%, transparent 50%)',
                  'radial-gradient(circle at 80% 20%, rgba(139, 92, 246, 0.08) 0%, transparent 50%), radial-gradient(circle at 20% 80%, rgba(236, 72, 153, 0.06) 0%, transparent 50%)',
                  'radial-gradient(circle at 50% 50%, rgba(236, 72, 153, 0.08) 0%, transparent 50%), radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.06) 0%, transparent 50%)',
                ],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* Professional floating particles */}
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className={`absolute w-2 h-2 rounded-full ${
              isDark ? 'opacity-30' : 'opacity-20'
            }`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              background: i % 3 === 0 ? '#3b82f6' : i % 3 === 1 ? '#8b5cf6' : '#ec4899',
            }}
            animate={{
              y: [-30, 30],
              x: [-20, 20],
              opacity: isDark ? [0.2, 0.6, 0.2] : [0.1, 0.4, 0.1],
              scale: [0.5, 1.2, 0.5],
            }}
            transition={{
              duration: 4 + Math.random() * 3,
              repeat: Infinity,
              delay: Math.random() * 2,
              ease: 'easeInOut',
            }}
          />
        ))}

        {/* Ambient glow effects */}
        <motion.div
          animate={{
            opacity: isDark ? [0.05, 0.15, 0.05] : [0.02, 0.08, 0.02],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className={`absolute top-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl ${
            isDark 
              ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20' 
              : 'bg-gradient-to-r from-blue-300/30 to-purple-300/30'
          }`}
        />
      </div>

      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {/* Enhanced Hero Section */}
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          <motion.h1
            className={`text-5xl md:text-7xl font-black mb-8 tracking-tighter ${
              isDark 
                ? 'bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent'
                : 'bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent'
            }`}
            animate={{
              backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            style={{
              backgroundSize: '200% 200%',
              filter: isDark 
                ? 'drop-shadow(0 0 40px rgba(147, 51, 234, 0.3))' 
                : 'drop-shadow(0 0 20px rgba(147, 51, 234, 0.2))',
            }}
          >
            About Me
          </motion.h1>
          
          <motion.p
            className={`text-xl md:text-2xl max-w-4xl mx-auto leading-relaxed ${
              isDark ? 'text-gray-300' : 'text-gray-600'
            }`}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            I&apos;m <span className={`font-semibold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>Bakul Ahmed</span>, 
            a passionate Computer Science student and full-stack developer from Bangladesh. 
            I transform complex problems into elegant, user-friendly digital solutions that make a real impact.
          </motion.p>

          {/* Professional badges */}
          <motion.div
            className="flex flex-wrap justify-center gap-4 mt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            {[
              { label: 'Student Developer', icon: '🎓' },
              { label: 'Full-Stack Engineer', icon: '💻' },
              { label: 'Problem Solver', icon: '🧩' },
              { label: 'Open Source Contributor', icon: '🌟' }
            ].map((badge) => (
              <motion.div
                key={badge.label}
                whileHover={{ scale: 1.05, y: -2 }}
                className={`px-4 py-2 rounded-full text-sm font-medium backdrop-blur-xl border transition-all duration-300 ${
                  isDark
                    ? 'bg-gray-900/50 border-gray-700/50 text-gray-300 hover:border-gray-600/70'
                    : 'bg-white/50 border-gray-300/50 text-gray-700 hover:border-gray-400/70'
                }`}
              >
                <span className="mr-2">{badge.icon}</span>
                {badge.label}
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Enhanced Navigation Pills */}
        <motion.div
          className="flex justify-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <div className={`flex space-x-2 p-2 backdrop-blur-xl rounded-2xl border shadow-2xl ${
            isDark
              ? 'bg-gray-900/50 border-gray-700/50'
              : 'bg-white/50 border-gray-300/50'
          }`}>
            {[
              { id: 'story', label: 'My Story', icon: '📖' },
              { id: 'skills', label: 'Skills', icon: '⚡' },
              { id: 'experience', label: 'Experience', icon: '💼' },
            ].map((tab) => (
              <motion.button
                key={tab.id}
                onClick={() => setActiveSection(tab.id)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-6 py-3 rounded-xl transition-all duration-300 font-medium flex items-center space-x-2 ${
                  activeSection === tab.id
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                    : isDark
                      ? 'text-gray-300 hover:text-white hover:bg-gray-800/50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'
                }`}
              >
                <motion.span
                  animate={{ rotate: activeSection === tab.id ? 360 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {tab.icon}
                </motion.span>
                <span>{tab.label}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Content Sections */}
        <div className="max-w-6xl mx-auto">
          <AnimatePresence mode="wait">
            {/* My Story */}
            {activeSection === 'story' && (
              <motion.div
                key="story"
                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -50, scale: 0.95 }}
                transition={{ duration: 0.5 }}
                className="grid lg:grid-cols-2 gap-16 items-center"
              >
              <div className="space-y-8">
                <motion.div
                  className="space-y-6"
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                >
                  <h2 className={`text-4xl font-bold bg-gradient-to-r ${
                    isDark 
                      ? 'from-blue-400 to-purple-400' 
                      : 'from-blue-600 to-purple-600'
                  } bg-clip-text text-transparent`}>
                    The Journey
                  </h2>
                  <p className={`text-lg leading-relaxed ${
                    isDark ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    My coding journey began with curiosity and has evolved into a passion for creating 
                    digital experiences that make a difference. I believe in the power of clean code, 
                    innovative design, and user-centered thinking.
                  </p>
                  <p className={`text-lg leading-relaxed ${
                    isDark ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    When I&apos;m not coding, you&apos;ll find me exploring new technologies, contributing to 
                    open-source projects, or mentoring aspiring developers. I&apos;m always excited to 
                    tackle new challenges and push the boundaries of what&apos;s possible.
                  </p>
                </motion.div>
                
                <motion.div
                  className="grid grid-cols-3 gap-6 text-center"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                >
                  {[
                    { value: '50+', label: 'Projects', icon: '🚀' },
                    { value: '3+', label: 'Years', icon: '⏱️' },
                    { value: '20+', label: 'Skills', icon: '⚡' },
                  ].map((stat, index) => (
                    <motion.div 
                      key={index} 
                      whileHover={{ scale: 1.05, y: -5 }}
                      className={`p-6 backdrop-blur-lg rounded-xl border transition-all duration-300 ${
                        isDark
                          ? 'bg-gray-900/50 border-gray-700/50 hover:border-gray-600/70'
                          : 'bg-white/50 border-gray-300/50 hover:border-gray-400/70'
                      }`}
                    >
                      <div className="text-2xl mb-2">{stat.icon}</div>
                      <div className={`text-3xl font-bold mb-2 ${
                        isDark ? 'text-white' : 'text-gray-900'
                      }`}>{stat.value}</div>
                      <div className={isDark ? 'text-gray-400' : 'text-gray-600'}>{stat.label}</div>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
              
              <motion.div
                className="relative"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
              >
                <div className={`relative w-full h-96 rounded-2xl overflow-hidden border transition-all duration-300 ${
                  isDark
                    ? 'bg-gradient-to-br from-blue-500/20 to-purple-500/20 border-gray-700/50'
                    : 'bg-gradient-to-br from-blue-200/30 to-purple-200/30 border-gray-300/50'
                }`}>
                  <div className={`absolute inset-0 ${
                    isDark 
                      ? 'bg-gradient-to-br from-blue-600/10 to-purple-600/10' 
                      : 'bg-gradient-to-br from-blue-300/10 to-purple-300/10'
                  }`} />
                  
                  {/* Floating particles */}
                  {[...Array(6)].map((_, i) => (
                    <motion.div
                      key={i}
                      className={`absolute w-3 h-3 rounded-full ${
                        isDark ? 'bg-blue-400/30' : 'bg-blue-500/40'
                      }`}
                      style={{
                        left: `${20 + (i * 12)}%`,
                        top: `${30 + (i % 2) * 40}%`,
                      }}
                      animate={{
                        y: [-10, 10, -10],
                        opacity: [0.3, 0.8, 0.3],
                        scale: [0.8, 1.2, 0.8],
                      }}
                      transition={{
                        duration: 3 + i * 0.5,
                        repeat: Infinity,
                        delay: i * 0.3,
                      }}
                    />
                  ))}
                  
                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div
                      animate={{
                        scale: [1, 1.1, 1],
                        rotate: [0, 5, -5, 0],
                      }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      className="text-8xl"
                    >
                      👨‍💻
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}

            {/* Skills */}
            {activeSection === 'skills' && (
              <motion.div
                key="skills"
                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -50, scale: 0.95 }}
                transition={{ duration: 0.5 }}
                className="space-y-12"
              >
              <div className="text-center">
                <h2 className={`text-4xl font-bold bg-gradient-to-r ${
                  isDark 
                    ? 'from-blue-400 to-purple-400' 
                    : 'from-blue-600 to-purple-600'
                } bg-clip-text text-transparent mb-4`}>
                  Technical Expertise
                </h2>
                <p className={`text-lg ${
                  isDark ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Technologies I&apos;ve mastered to create exceptional digital experiences
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-8">
                {skills.map((skill, index) => (
                  <motion.div
                    key={skill.name}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    onHoverStart={() => setHoveredSkill(skill.name)}
                    onHoverEnd={() => setHoveredSkill(null)}
                    whileHover={{ y: -5, scale: 1.02 }}
                    className={`p-6 backdrop-blur-lg rounded-xl border transition-all duration-300 cursor-pointer group ${
                      isDark
                        ? 'bg-gray-900/50 border-gray-700/50 hover:border-gray-600/70'
                        : 'bg-white/50 border-gray-300/50 hover:border-gray-400/70'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{skill.icon}</span>
                        <h3 className={`text-xl font-semibold transition-colors ${
                          isDark 
                            ? 'text-white group-hover:text-blue-300' 
                            : 'text-gray-900 group-hover:text-blue-600'
                        }`}>
                          {skill.name}
                        </h3>
                      </div>
                      <motion.span 
                        className={`text-lg font-bold transition-colors ${
                          isDark ? 'text-gray-300' : 'text-gray-600'
                        }`}
                        animate={{ 
                          scale: hoveredSkill === skill.name ? 1.2 : 1,
                          color: hoveredSkill === skill.name ? '#60a5fa' : isDark ? '#d1d5db' : '#4b5563'
                        }}
                        transition={{ duration: 0.2 }}
                      >
                        {skill.level}%
                      </motion.span>
                    </div>
                    <div className={`w-full rounded-full h-3 overflow-hidden ${
                      isDark ? 'bg-gray-700' : 'bg-gray-300'
                    }`}>
                      <motion.div
                        className={`h-3 rounded-full bg-gradient-to-r ${skill.color} relative`}
                        initial={{ width: 0 }}
                        animate={{ width: `${skill.level}%` }}
                        transition={{ duration: 1, delay: index * 0.1 + 0.3 }}
                      >
                        <motion.div
                          className="absolute inset-0 bg-white/20 rounded-full"
                          animate={{ 
                            opacity: hoveredSkill === skill.name ? 1 : 0,
                            x: hoveredSkill === skill.name ? [0, 100, 0] : 0
                          }}
                          transition={{ 
                            opacity: { duration: 0.2 },
                            x: { duration: 1.5, repeat: Infinity }
                          }}
                        />
                      </motion.div>
                    </div>
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ 
                        opacity: hoveredSkill === skill.name ? 1 : 0,
                        height: hoveredSkill === skill.name ? 'auto' : 0
                      }}
                      transition={{ duration: 0.3 }}
                      className="mt-3 overflow-hidden"
                    >
                      {hoveredSkill === skill.name && (
                        <span className={`text-sm ${
                          isDark ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          {skill.description}
                        </span>
                      )}
                    </motion.div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

            {/* Experience */}
            {activeSection === 'experience' && (
              <motion.div
                key="experience"
                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -50, scale: 0.95 }}
                transition={{ duration: 0.5 }}
                className="space-y-12"
              >
              <div className="text-center">
                <h2 className={`text-4xl font-bold bg-gradient-to-r ${
                  isDark 
                    ? 'from-blue-400 to-purple-400' 
                    : 'from-blue-600 to-purple-600'
                } bg-clip-text text-transparent mb-4`}>
                  Professional Journey
                </h2>
                <p className={`text-lg ${
                  isDark ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  Key milestones in my career development
                </p>
              </div>
              
              <div className="space-y-8">
                {experiences.map((exp, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.2 }}
                    onHoverStart={() => setHoveredExperience(index)}
                    onHoverEnd={() => setHoveredExperience(null)}
                    whileHover={{ y: -8, scale: 1.02 }}
                    className={`flex items-start space-x-6 p-6 backdrop-blur-lg rounded-xl border transition-all duration-300 group cursor-pointer ${
                      isDark
                        ? 'bg-gray-900/50 border-gray-700/50 hover:border-gray-600/70'
                        : 'bg-white/50 border-gray-300/50 hover:border-gray-400/70'
                    }`}
                  >
                    <motion.div 
                      className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center text-2xl"
                      animate={{ 
                        rotate: hoveredExperience === index ? 360 : 0,
                        scale: hoveredExperience === index ? 1.1 : 1
                      }}
                      transition={{ duration: 0.5 }}
                    >
                      {exp.icon}
                    </motion.div>
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
                        <motion.h3 
                          className={`text-xl font-semibold transition-colors ${
                            isDark 
                              ? 'text-white group-hover:text-blue-300' 
                              : 'text-gray-900 group-hover:text-blue-600'
                          }`}
                          animate={{ 
                            x: hoveredExperience === index ? 5 : 0
                          }}
                          transition={{ duration: 0.2 }}
                        >
                          {exp.title}
                        </motion.h3>
                        <motion.span 
                          className={`text-sm px-3 py-1 rounded-full transition-colors ${
                            isDark ? 'text-gray-400' : 'text-gray-600'
                          }`}
                          animate={{ 
                            backgroundColor: hoveredExperience === index 
                              ? 'rgba(59, 130, 246, 0.2)' 
                              : isDark 
                                ? 'rgba(255, 255, 255, 0.1)' 
                                : 'rgba(0, 0, 0, 0.1)'
                          }}
                          transition={{ duration: 0.2 }}
                        >
                          {exp.period}
                        </motion.span>
                      </div>
                      <p className={`font-medium mb-2 transition-colors ${
                        isDark 
                          ? 'text-blue-400 group-hover:text-blue-300' 
                          : 'text-blue-600 group-hover:text-blue-500'
                      }`}>
                        {exp.company}
                      </p>
                      <p className={`leading-relaxed transition-colors ${
                        isDark 
                          ? 'text-gray-300 group-hover:text-gray-200' 
                          : 'text-gray-600 group-hover:text-gray-700'
                      }`}>
                        {exp.description}
                      </p>
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ 
                          opacity: hoveredExperience === index ? 1 : 0,
                          height: hoveredExperience === index ? 'auto' : 0
                        }}
                        transition={{ duration: 0.3, delay: 0.1 }}
                        className="mt-3 overflow-hidden"
                      >
                        {hoveredExperience === index && (
                          <div className="flex flex-wrap gap-2">
                            {exp.technologies.map((tech, i) => (
                              <motion.span
                                key={tech}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.2, delay: i * 0.1 }}
                                className={`px-2 py-1 text-xs rounded-full ${
                                  isDark 
                                    ? 'bg-blue-500/20 text-blue-300' 
                                    : 'bg-blue-500/20 text-blue-700'
                                }`}
                              >
                                {tech}
                              </motion.span>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Principles */}
      <div className="relative z-10 mx-auto mt-20 max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <p className={`text-xs font-semibold uppercase tracking-[0.3em] ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>Values</p>
          <h2 className={`text-3xl md:text-4xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>How I show up for teams</h2>
          <p className={`mt-3 text-base md:text-lg ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            Process, rituals, and principles that keep collaborations calm, transparent, and fast-moving.
          </p>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          {principles.map((principle) => {
            const Icon = principle.icon;
            return (
              <motion.article
                key={principle.title}
                whileHover={{ y: -6 }}
                className={`rounded-3xl border p-6 shadow-lg backdrop-blur-xl bg-gradient-to-br ${principle.accent} ${
                  isDark ? 'border-white/10' : 'border-slate-200'
                }`}
              >
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-xl font-semibold">{principle.title}</h3>
                <p className={`mt-2 text-sm leading-relaxed ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>{principle.detail}</p>
              </motion.article>
            );
          })}
        </div>
      </div>

      {/* Collaboration Stack */}
      <div className="relative z-10 mx-auto mt-20 max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className={`rounded-3xl border p-8 shadow-2xl ${isDark ? 'border-white/5 bg-gray-900/70' : 'border-slate-200 bg-white'}`}>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className={`text-xs font-semibold uppercase tracking-[0.3em] ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>Collaboration Stack</p>
              <h2 className="mt-2 text-3xl font-bold">From kickoff to ship-ready</h2>
              <p className={`mt-2 max-w-2xl text-base ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Cross-functional partners get clarity on tooling, review cadence, and delivery checkpoints from day one.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {availability.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className={`rounded-2xl border p-4 text-sm ${isDark ? 'border-white/5 bg-white/5 text-gray-200' : 'border-slate-200 bg-slate-50 text-gray-700'}`}>
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide">
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </div>
                    <p className="mt-2 text-base font-medium">{item.value}</p>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            {collabStack.map((track) => {
              const Icon = track.icon;
              return (
                <div key={track.label} className={`rounded-2xl border p-5 ${isDark ? 'border-white/5 bg-white/5' : 'border-slate-200 bg-white'}`}>
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-indigo-500/20 p-2 text-indigo-300">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-lg font-semibold">{track.label}</h3>
                  </div>
                  <p className={`mt-3 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{track.detail}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="relative z-10 mx-auto mt-20 max-w-4xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className={`rounded-3xl border p-8 text-center shadow-2xl ${isDark ? 'border-white/10 bg-gradient-to-br from-indigo-900/70 to-slate-900/80' : 'border-slate-200 bg-gradient-to-br from-indigo-100 to-white'}`}>
          <p className={`text-xs font-semibold uppercase tracking-[0.3em] ${isDark ? 'text-indigo-300' : 'text-indigo-600'}`}>Let us build</p>
          <h2 className="mt-4 text-4xl font-bold">Ready for intentional collaboration?</h2>
          <p className={`mt-3 text-base ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            I partner with founders, product teams, and studios to craft resilient systems and delightful interfaces.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <a href="/contact" className="inline-flex items-center justify-center rounded-2xl bg-indigo-600 px-6 py-3 font-semibold text-white shadow-lg shadow-indigo-500/40">
              Book a session
            </a>
            <a href="/projects" className={`inline-flex items-center justify-center rounded-2xl border px-6 py-3 font-semibold ${isDark ? 'border-white/20 text-white' : 'border-slate-300 text-slate-800'}`}>
              See recent work
            </a>
          </div>
        </div>
      </div>
      </div>
    </motion.div>
  );
}