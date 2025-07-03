'use client';

import { motion } from 'framer-motion';
import { Typewriter } from 'react-simple-typewriter';
import { ArrowDownIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/index';
import { SectionWrapper, GradientText, AnimatedCounter } from '@/components/ui/index';
import { useIntersectionObserver } from '@/hooks/enhanced';
import { useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';

const stats = [
  { label: 'Projects Completed', value: 50, suffix: '+' },
  { label: 'Years Experience', value: 5, suffix: '+' },
  { label: 'Happy Clients', value: 30, suffix: '+' },
  { label: 'Technologies', value: 20, suffix: '+' },
];

const techStack = [
  { name: 'React', icon: '⚛️', color: 'text-blue-500' },
  { name: 'Next.js', icon: '▲', color: 'text-black dark:text-white' },
  { name: 'TypeScript', icon: '📘', color: 'text-blue-600' },
  { name: 'Node.js', icon: '🟢', color: 'text-green-500' },
  { name: 'Python', icon: '🐍', color: 'text-yellow-500' },
  { name: 'PostgreSQL', icon: '🐘', color: 'text-blue-700' },
  { name: 'MongoDB', icon: '🍃', color: 'text-green-600' },
  { name: 'AWS', icon: '☁️', color: 'text-orange-500' },
  { name: 'Docker', icon: '🐳', color: 'text-blue-400' },
  { name: 'Git', icon: '📚', color: 'text-red-500' },
  { name: 'Figma', icon: '🎨', color: 'text-purple-500' },
  { name: 'Tailwind', icon: '💨', color: 'text-cyan-500' },
];

export default function EnhancedHero() {
  const ref = useRef<HTMLElement>(null);
  const entry = useIntersectionObserver(ref, undefined, { threshold: 0.1 });
  const isVisible = !!entry?.isIntersecting;

  return (
    <SectionWrapper 
      ref={ref}
      className="min-h-screen flex items-center relative overflow-hidden pt-20"
    >
      {/* Background Elements */}
      <div className="absolute inset-0 -z-10">
        {/* Gradient Orbs */}
        <motion.div
          className="absolute top-1/4 left-1/4 w-72 h-72 bg-primary-400/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary-400/10 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.5, 0.3, 0.5],
          }}
          transition={{ duration: 10, repeat: Infinity }}
        />
        
        {/* Floating Particles */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-primary-400 rounded-full opacity-20"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [-20, 20, -20],
              opacity: [0.2, 0.8, 0.2],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-12 items-center w-full">
        {/* Left Column - Content */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={isVisible ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="space-y-8"
        >
          {/* Greeting */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="inline-block"
          >
            <span className="px-4 py-2 bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 rounded-full text-sm font-medium">
              👋 Welcome to my portfolio
            </span>
          </motion.div>

          {/* Main Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight"
          >
            Hi, I&apos;m{' '}
            <GradientText className="block">Bakul Ahmed</GradientText>
          </motion.h1>

          {/* Typewriter Effect */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="text-xl md:text-2xl text-muted-foreground"
          >
            I&apos;m a{' '}
            <span className="text-primary-600 dark:text-primary-400 font-semibold">
              <Typewriter
                words={[
                  'Full Stack Developer',
                  'UI/UX Designer',
                  'Problem Solver',
                  'Tech Enthusiast',
                  'Creative Thinker'
                ]}
                loop
                cursor
                cursorStyle="|"
                typeSpeed={70}
                deleteSpeed={50}
                delaySpeed={1000}
              />
            </span>
          </motion.div>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="text-lg text-muted-foreground leading-relaxed max-w-xl"
          >
            I specialize in creating exceptional digital experiences through modern web technologies, 
            intuitive design, and scalable solutions that drive business growth.
          </motion.p>

          {/* Call to Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 1, duration: 0.6 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Button
              size="lg"
              className="group"
              asChild
            >
              <Link href="/projects">
                View My Work
                <ArrowRightIcon className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            
            <Button
              variant="outline"
              size="lg"
              asChild
            >
              <Link href="/contact">
                Get In Touch
              </Link>
            </Button>
          </motion.div>

          {/* Social Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 1.2, duration: 0.6 }}
            className="flex items-center space-x-4"
          >
            <span className="text-sm text-muted-foreground">Follow me:</span>
            {[
              { href: 'https://github.com/bakulahmed', label: 'GitHub', icon: '🐙' },
              { href: 'https://linkedin.com/in/bakulahmed', label: 'LinkedIn', icon: '💼' },
              { href: 'https://twitter.com/bakulahmed', label: 'Twitter', icon: '🐦' },
            ].map(({ href, label, icon }) => (
              <motion.a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-muted hover:bg-primary-100 dark:hover:bg-primary-900/20 transition-colors"
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.95 }}
                aria-label={label}
              >
                <span className="text-lg">{icon}</span>
              </motion.a>
            ))}
          </motion.div>
        </motion.div>

        {/* Right Column - Visual Elements */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={isVisible ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
          className="space-y-8"
        >
          {/* Profile Image */}
          <motion.div
            className="relative mx-auto w-80 h-80 rounded-full overflow-hidden border-4 border-primary-200 dark:border-primary-800 shadow-2xl"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.3 }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary-400 to-secondary-400 opacity-20" />
            <Image
              src="/file.svg"
              alt="Bakul Ahmed"
              fill
              className="object-cover"
              priority
            />
            <motion.div
              className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"
              initial={{ opacity: 0 }}
              whileHover={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            />
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 1.4, duration: 0.6 }}
            className="grid grid-cols-2 gap-4"
          >
            {stats.map(({ label, value, suffix }, index) => (
              <motion.div
                key={label}
                className="text-center p-4 rounded-lg bg-card border border-border shadow-sm"
                whileHover={{ scale: 1.05, y: -2 }}
                transition={{ duration: 0.2 }}
              >
                <div className="text-2xl font-bold text-primary-600 dark:text-primary-400 mb-1">
                  {isVisible && (
                    <AnimatedCounter
                      end={value}
                      suffix={suffix}
                      duration={2000 + index * 200}
                    />
                  )}
                </div>
                <div className="text-sm text-muted-foreground">{label}</div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* Tech Stack Section */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={isVisible ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 1.6, duration: 0.8 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-full max-w-4xl"
      >
        <div className="text-center mb-8">
          <h3 className="text-lg font-semibold text-muted-foreground mb-4">
            Technologies I Love Working With
          </h3>
          <div className="flex flex-wrap justify-center gap-4">
            {techStack.map((tech, index) => (
              <motion.div
                key={tech.name}
                className="group flex items-center space-x-2 px-3 py-2 bg-card border border-border rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={isVisible ? { opacity: 1, scale: 1 } : {}}
                transition={{ delay: 1.8 + index * 0.1, duration: 0.3 }}
                whileHover={{ scale: 1.05, y: -2 }}
              >
                <span className="text-lg group-hover:scale-110 transition-transform">
                  {tech.icon}
                </span>
                <span className={`text-sm font-medium ${tech.color}`}>
                  {tech.name}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Scroll Indicator */}
      <motion.div
        className="absolute bottom-4 left-1/2 transform -translate-x-1/2"
        initial={{ opacity: 0, y: 20 }}
        animate={isVisible ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 2, duration: 0.6 }}
      >
        <motion.div
          className="flex flex-col items-center space-y-2 text-muted-foreground"
          animate={{ y: [0, 5, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <span className="text-xs">Scroll to explore</span>
          <ArrowDownIcon className="w-4 h-4" />
        </motion.div>
      </motion.div>
    </SectionWrapper>
  );
}
