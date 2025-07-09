'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

export default function AboutPage() {
  const [activeSection, setActiveSection] = useState('story');
  const [hoveredSkill, setHoveredSkill] = useState<string | null>(null);
  const [hoveredExperience, setHoveredExperience] = useState<number | null>(null);

  const skills = [
    { name: 'React/Next.js', level: 95, color: 'from-blue-500 to-cyan-500' },
    { name: 'TypeScript', level: 90, color: 'from-blue-600 to-indigo-600' },
    { name: 'Node.js', level: 88, color: 'from-green-500 to-emerald-500' },
    { name: 'Python', level: 85, color: 'from-yellow-500 to-orange-500' },
    { name: 'UI/UX Design', level: 92, color: 'from-purple-500 to-pink-500' },
    { name: 'Cloud & DevOps', level: 87, color: 'from-orange-500 to-red-500' },
  ];

  const experiences = [
    {
      title: 'Senior Full Stack Developer',
      company: 'Tech Innovation Corp',
      period: '2022 - Present',
      description: 'Leading development of enterprise-level applications using cutting-edge technologies.',
      icon: '💼'
    },
    {
      title: 'Frontend Developer',
      company: 'Digital Solutions Ltd',
      period: '2020 - 2022',
      description: 'Created responsive web applications and optimized user experiences.',
      icon: '🎨'
    },
    {
      title: 'Junior Developer',
      company: 'StartUp Ventures',
      period: '2019 - 2020',
      description: 'Built foundational skills in modern web development frameworks.',
      icon: '🚀'
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Ultra-premium background */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute inset-0"
          animate={{
            background: [
              'radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(139, 92, 246, 0.08) 0%, transparent 50%)',
              'radial-gradient(circle at 80% 20%, rgba(139, 92, 246, 0.1) 0%, transparent 50%), radial-gradient(circle at 20% 80%, rgba(236, 72, 153, 0.08) 0%, transparent 50%)',
              'radial-gradient(circle at 50% 50%, rgba(236, 72, 153, 0.1) 0%, transparent 50%), radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.08) 0%, transparent 50%)',
            ],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full opacity-30"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              background: i % 3 === 0 ? '#3b82f6' : i % 3 === 1 ? '#8b5cf6' : '#ec4899',
            }}
            animate={{
              y: [-30, 30],
              x: [-20, 20],
              opacity: [0.2, 0.8, 0.2],
              scale: [0.5, 1.5, 0.5],
              rotate: [0, 360],
            }}
            transition={{
              duration: 4 + Math.random() * 3,
              repeat: Infinity,
              delay: Math.random() * 2,
              ease: 'easeInOut',
            }}
          />
        ))}
        
        {/* Additional larger floating elements */}
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={`large-${i}`}
            className="absolute w-1 h-1 bg-white/20 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -100, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 6 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 3,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {/* Hero Section */}
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          <motion.h1
            className="text-6xl md:text-8xl font-black mb-8 tracking-tighter"
            style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 25%, #e2e8f0 50%, #f8fafc 75%, #ffffff 100%)',
              backgroundSize: '400% 400%',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 0 40px rgba(255, 255, 255, 0.1))',
            }}
            animate={{
              backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            About Me
          </motion.h1>
          
          <motion.p
            className="text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            I&apos;m a passionate full-stack developer who transforms complex problems into elegant, 
            user-friendly digital solutions. With over 5 years of experience, I specialize in 
            creating premium web experiences that drive results.
          </motion.p>
        </motion.div>

        {/* Navigation Pills */}
        <motion.div
          className="flex justify-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <div className="flex space-x-2 p-2 bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 shadow-2xl">
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
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
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
                  <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    The Journey
                  </h2>
                  <p className="text-lg text-gray-300 leading-relaxed">
                    My coding journey began with curiosity and has evolved into a passion for creating 
                    digital experiences that make a difference. I believe in the power of clean code, 
                    innovative design, and user-centered thinking.
                  </p>
                  <p className="text-lg text-gray-300 leading-relaxed">
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
                    { value: '50+', label: 'Projects' },
                    { value: '5+', label: 'Years' },
                    { value: '30+', label: 'Clients' },
                  ].map((stat, index) => (
                    <div key={index} className="p-4 bg-white/5 backdrop-blur-lg rounded-xl border border-white/10">
                      <div className="text-3xl font-bold text-white mb-2">{stat.value}</div>
                      <div className="text-gray-400">{stat.label}</div>
                    </div>
                  ))}
                </motion.div>
              </div>
              
              <motion.div
                className="relative"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
              >
                <div className="relative w-full h-96 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl overflow-hidden border border-white/20">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-purple-600/10" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-6xl">👨‍💻</div>
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
                <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-4">
                  Technical Expertise
                </h2>
                <p className="text-lg text-gray-300">
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
                    className="p-6 bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 hover:border-white/20 transition-all duration-300 cursor-pointer group"
                  >
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-semibold text-white group-hover:text-blue-300 transition-colors">
                        {skill.name}
                      </h3>
                      <motion.span 
                        className="text-lg font-bold text-gray-300"
                        animate={{ 
                          scale: hoveredSkill === skill.name ? 1.2 : 1,
                          color: hoveredSkill === skill.name ? '#60a5fa' : '#d1d5db'
                        }}
                        transition={{ duration: 0.2 }}
                      >
                        {skill.level}%
                      </motion.span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
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
                      className="mt-3 text-sm text-gray-400 overflow-hidden"
                    >
                      {hoveredSkill === skill.name && (
                        <span>Proficient in building scalable applications and modern user interfaces</span>
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
                <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-4">
                  Professional Journey
                </h2>
                <p className="text-lg text-gray-300">
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
                    className="flex items-start space-x-6 p-6 bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 hover:border-white/20 transition-all duration-300 group cursor-pointer"
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
                          className="text-xl font-semibold text-white group-hover:text-blue-300 transition-colors"
                          animate={{ 
                            x: hoveredExperience === index ? 5 : 0
                          }}
                          transition={{ duration: 0.2 }}
                        >
                          {exp.title}
                        </motion.h3>
                        <motion.span 
                          className="text-sm text-gray-400 bg-white/10 px-3 py-1 rounded-full"
                          animate={{ 
                            backgroundColor: hoveredExperience === index ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.1)'
                          }}
                          transition={{ duration: 0.2 }}
                        >
                          {exp.period}
                        </motion.span>
                      </div>
                      <p className="text-blue-400 font-medium mb-2 group-hover:text-blue-300 transition-colors">
                        {exp.company}
                      </p>
                      <p className="text-gray-300 leading-relaxed group-hover:text-gray-200 transition-colors">
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
                            {['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'AWS'].map((tech, i) => (
                              <motion.span
                                key={tech}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.2, delay: i * 0.1 }}
                                className="px-2 py-1 text-xs bg-blue-500/20 text-blue-300 rounded-full"
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
      </div>
    </div>
  );
}