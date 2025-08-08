'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useTheme } from 'next-themes';
import MinimalisticLoadingScreen from '@/components/MinimalisticLoadingScreen';
import ModernNavbar from '@/components/layout/ModernNavbar';

// Advanced Floating Particles with Smart Mouse Interactions
const FloatingParticles = ({ isDark }: { isDark: boolean }) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  const particles = useMemo(() => {
    const particleCount = typeof window !== 'undefined' && window.innerWidth < 768 ? 15 : 30;
    return Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1.5,
      duration: Math.random() * 25 + 20,
      delay: Math.random() * 10,
      type: Math.random() > 0.6 ? 'star' : 'circle',
      speed: Math.random() * 0.5 + 0.3,
    }));
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', handleResize);
    handleResize();
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle) => {
        if (windowSize.width === 0) return null;
        
        const particleX = (particle.x * windowSize.width) / 100;
        const particleY = (particle.y * windowSize.height) / 100;
        const distance = Math.sqrt(
          Math.pow(mousePosition.x - particleX, 2) +
          Math.pow(mousePosition.y - particleY, 2)
        );
        const isNearMouse = distance < 120;
        const influenceRadius = Math.max(0, 1 - distance / 200);

        return (
          <motion.div
            key={particle.id}
            className={`absolute ${particle.type === 'star' ? 'rotate-45' : 'rounded-full'} ${
              isDark 
                ? 'bg-gradient-to-br from-blue-400/25 via-purple-400/20 to-pink-400/25' 
                : 'bg-gradient-to-br from-blue-300/35 via-purple-300/30 to-pink-300/35'
            } ${isNearMouse ? 'shadow-lg backdrop-blur-[1px]' : ''}`}
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              filter: isNearMouse ? 'blur(0px)' : 'blur(0.5px)',
              transform: `translate(${influenceRadius * 20}px, ${influenceRadius * -10}px)`,
            }}
            animate={{
              y: [0, -40 * particle.speed, 0],
              x: [0, 20 * particle.speed, 0],
              opacity: isNearMouse ? [0.6, 1, 0.6] : [0.15, 0.5, 0.15],
              scale: isNearMouse ? [1, 1.4, 1] : [1, 1.15, 1],
              rotate: particle.type === 'star' ? [45, 225, 45] : [0, 360],
              backgroundColor: isDark 
                ? [
                    'rgba(59, 130, 246, 0.25)', 
                    'rgba(168, 85, 247, 0.25)', 
                    'rgba(236, 72, 153, 0.25)',
                    'rgba(59, 130, 246, 0.25)'
                  ]
                : [
                    'rgba(147, 197, 253, 0.35)', 
                    'rgba(196, 181, 253, 0.35)', 
                    'rgba(251, 207, 232, 0.35)',
                    'rgba(147, 197, 253, 0.35)'
                  ]
            }}
            transition={{
              duration: particle.duration,
              delay: particle.delay,
              repeat: Infinity,
              ease: "easeInOut",
              backgroundColor: { duration: 5, repeat: Infinity, ease: "easeInOut" }
            }}
          />
        );
      })}
    </div>
  );
};

// Advanced Mouse Parallax Hook with Device-Aware Responsiveness
function useMouseParallax(intensity = 15, mobileIntensity = 8) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const [isMobile, setIsMobile] = useState(false);
  
  const currentIntensity = isMobile ? mobileIntensity : intensity;
  
  const springX = useSpring(mouseX, { 
    stiffness: isMobile ? 100 : 150, 
    damping: isMobile ? 30 : 20, 
    mass: 0.8 
  });
  const springY = useSpring(mouseY, { 
    stiffness: isMobile ? 100 : 150, 
    damping: isMobile ? 30 : 20, 
    mass: 0.8 
  });
  
  const transformX = useTransform(springX, [-0.5, 0.5], [-currentIntensity, currentIntensity]);
  const transformY = useTransform(springY, [-0.5, 0.5], [-currentIntensity, currentIntensity]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window);
    };
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!isMobile) {
        const { innerWidth, innerHeight } = window;
        mouseX.set((e.clientX / innerWidth) - 0.5);
        mouseY.set((e.clientY / innerHeight) - 0.5);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isMobile && e.touches.length === 1) {
        const touch = e.touches[0];
        const { innerWidth, innerHeight } = window;
        mouseX.set((touch.clientX / innerWidth) - 0.5);
        mouseY.set((touch.clientY / innerHeight) - 0.5);
      }
    };

    checkMobile();
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('resize', checkMobile);
    };
  }, [mouseX, mouseY, isMobile]);

  return { x: transformX, y: transformY, isMobile };
}

export default function Homepage() {
  const [showLoading, setShowLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(true);
  const { resolvedTheme } = useTheme();
  
  // Enhanced theme detection with hydration safety
  const isDark = mounted ? resolvedTheme === 'dark' : true;
  const [themeTransition, setThemeTransition] = useState(false);

  // Smooth theme change animation
  useEffect(() => {
    if (mounted && resolvedTheme) {
      setThemeTransition(true);
      const timer = setTimeout(() => setThemeTransition(false), 500);
      return () => clearTimeout(timer);
    }
  }, [resolvedTheme, mounted]);

  // Enhanced mounting with progressive disclosure
  useEffect(() => {
    const initializeApp = async () => {
      // Simulate loading for smooth entrance
      await new Promise(resolve => setTimeout(resolve, 800));
      setMounted(true);
      
      // Progressive loading animation
      await new Promise(resolve => setTimeout(resolve, 200));
      setShowLoading(false);
    };
    
    initializeApp();
  }, []);
  
  // Enhanced dynamic typing words
  const typingWords = useMemo(() => [
    'Full-Stack Developer',
    'Problem Solver',
    'Tech Enthusiast',
    'Creative Coder',
    'Digital Innovator'
  ], []);
  
  const skills = useMemo(() => [
    { name: 'React & Next.js', icon: '⚛️', color: 'blue' },
    { name: 'TypeScript', icon: '📘', color: 'indigo' },
    { name: 'Python & Django', icon: '🐍', color: 'green' },
    { name: 'Database Design', icon: '🗄️', color: 'purple' },
    { name: 'UI/UX Design', icon: '🎨', color: 'pink' },
    { name: 'Cloud Services', icon: '☁️', color: 'cyan' }
  ], []);

  const blobParallax = useMouseParallax(35, 15);
  const cardParallax = useMouseParallax(18, 8);
  const textParallax = useMouseParallax(12, 5);

  // Responsive viewport detection with enhanced breakpoints
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'desktop' | 'ultrawide'>('desktop');

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      setViewportSize({ width, height });
      
      // Enhanced device type detection
      if (width < 640) {
        setDeviceType('mobile');
      } else if (width < 1024) {
        setDeviceType('tablet');
      } else if (width < 1920) {
        setDeviceType('desktop');
      } else {
        setDeviceType('ultrawide');
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Enhanced typing animation effect
  useEffect(() => {
    const interval = setInterval(() => {
      setIsTyping(false);
      setTimeout(() => {
        setCurrentWordIndex((prev) => (prev + 1) % typingWords.length);
        setIsTyping(true);
      }, 500);
    }, 3000);

    return () => clearInterval(interval);
  }, [typingWords.length]);

  useEffect(() => {
    setMounted(true);
    const hasVisited = sessionStorage.getItem('hasVisited');
    if (!hasVisited) {
      sessionStorage.setItem('hasVisited', 'true');
      const timer = setTimeout(() => setShowLoading(false), 2000);
      return () => clearTimeout(timer);
    } else {
      setShowLoading(false);
    }
  }, []);

  const handleLoadingComplete = useCallback(() => {
    setShowLoading(false);
  }, []);

  if (showLoading) {
    return <MinimalisticLoadingScreen onComplete={handleLoadingComplete} />;
  }

  if (!mounted) {
    return null;
  }

  return (
    <motion.div 
      className={`min-h-screen relative overflow-hidden transition-all duration-1000 ${
        isDark 
          ? 'bg-gradient-to-br from-gray-950 via-slate-900 to-black text-white' 
          : 'bg-gradient-to-br from-white via-slate-50 to-gray-100 text-gray-900'
      } ${themeTransition ? 'animate-pulse' : ''}`}
      animate={{ 
        backgroundColor: isDark 
          ? ['#020617', '#0f172a', '#000000', '#020617'] 
          : ['#ffffff', '#f8fafc', '#f1f5f9', '#ffffff'] 
      }}
      transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
    >
      <ModernNavbar />
      
      {/* Enhanced Theme Transition Overlay */}
      <motion.div
        className={`absolute inset-0 pointer-events-none transition-opacity duration-1000 ${
          themeTransition ? 'opacity-30' : 'opacity-0'
        } ${
          isDark 
            ? 'bg-gradient-radial from-blue-600/30 via-purple-600/20 to-transparent'
            : 'bg-gradient-radial from-yellow-400/30 via-orange-300/20 to-transparent'
        }`}
        animate={{ 
          scale: themeTransition ? [1, 1.3, 1] : 1,
          opacity: themeTransition ? [0, 0.4, 0] : 0
        }}
        transition={{ duration: 1 }}
      />
      
      {/* Background Effects - Optimized for All Devices */}
      <div className="absolute inset-0 -z-10">
        <FloatingParticles isDark={isDark} />
        
        {/* Professional Gradient Blobs with Subtle Animations */}
        <motion.div
          style={{ x: blobParallax.x, y: blobParallax.y }}
          animate={{ 
            scale: [1, 1.05, 1],
            opacity: [0.4, 0.7, 0.4],
            background: isDark 
              ? [
                  'radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, rgba(147, 51, 234, 0.2) 50%, rgba(236, 72, 153, 0.3) 100%)',
                  'radial-gradient(circle, rgba(147, 51, 234, 0.3) 0%, rgba(236, 72, 153, 0.2) 50%, rgba(59, 130, 246, 0.3) 100%)',
                  'radial-gradient(circle, rgba(236, 72, 153, 0.3) 0%, rgba(59, 130, 246, 0.2) 50%, rgba(147, 51, 234, 0.3) 100%)',
                  'radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, rgba(147, 51, 234, 0.2) 50%, rgba(236, 72, 153, 0.3) 100%)'
                ]
              : [
                  'radial-gradient(circle, rgba(59, 130, 246, 0.25) 0%, rgba(147, 51, 234, 0.15) 50%, rgba(236, 72, 153, 0.25) 100%)',
                  'radial-gradient(circle, rgba(236, 72, 153, 0.25) 0%, rgba(59, 130, 246, 0.15) 50%, rgba(147, 51, 234, 0.25) 100%)',
                  'radial-gradient(circle, rgba(147, 51, 234, 0.25) 0%, rgba(236, 72, 153, 0.15) 50%, rgba(59, 130, 246, 0.25) 100%)',
                  'radial-gradient(circle, rgba(59, 130, 246, 0.25) 0%, rgba(147, 51, 234, 0.15) 50%, rgba(236, 72, 153, 0.25) 100%)'
                ]
          }}
          transition={{ 
            duration: deviceType === 'mobile' ? 25 : (deviceType === 'tablet' ? 20 : 15), 
            repeat: Infinity, 
            ease: "easeInOut",
            background: { duration: 10, repeat: Infinity, ease: "easeInOut" }
          }}
          className={`absolute rounded-full blur-3xl transition-all duration-1000 ${
            deviceType === 'mobile' 
              ? 'top-8 right-4 w-48 h-48' 
              : deviceType === 'tablet'
                ? 'top-10 right-6 w-56 h-56'
                : deviceType === 'desktop'
                  ? 'top-10 right-5 w-60 h-60 sm:w-72 sm:h-72 lg:top-20 lg:right-10 lg:w-96 lg:h-96'
                  : 'top-20 right-10 w-96 h-96 xl:w-[28rem] xl:h-[28rem] 2xl:w-[32rem] 2xl:h-[32rem]'
          }`}
        />
        
        <motion.div
          style={{ x: blobParallax.y, y: blobParallax.x }}
          animate={{ 
            scale: [1, 0.95, 1],
            opacity: [0.3, 0.6, 0.3],
            background: isDark 
              ? [
                  'radial-gradient(circle, rgba(6, 182, 212, 0.3) 0%, rgba(59, 130, 246, 0.2) 50%, rgba(147, 51, 234, 0.3) 100%)',
                  'radial-gradient(circle, rgba(147, 51, 234, 0.3) 0%, rgba(6, 182, 212, 0.2) 50%, rgba(59, 130, 246, 0.3) 100%)',
                  'radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, rgba(147, 51, 234, 0.2) 50%, rgba(6, 182, 212, 0.3) 100%)',
                  'radial-gradient(circle, rgba(6, 182, 212, 0.3) 0%, rgba(59, 130, 246, 0.2) 50%, rgba(147, 51, 234, 0.3) 100%)'
                ]
              : [
                  'radial-gradient(circle, rgba(6, 182, 212, 0.2) 0%, rgba(59, 130, 246, 0.12) 50%, rgba(147, 51, 234, 0.2) 100%)',
                  'radial-gradient(circle, rgba(147, 51, 234, 0.2) 0%, rgba(6, 182, 212, 0.12) 50%, rgba(59, 130, 246, 0.2) 100%)',
                  'radial-gradient(circle, rgba(59, 130, 246, 0.2) 0%, rgba(147, 51, 234, 0.12) 50%, rgba(6, 182, 212, 0.2) 100%)',
                  'radial-gradient(circle, rgba(6, 182, 212, 0.2) 0%, rgba(59, 130, 246, 0.12) 50%, rgba(147, 51, 234, 0.2) 100%)'
                ]
          }}
          transition={{ 
            duration: deviceType === 'mobile' ? 30 : (deviceType === 'tablet' ? 25 : 18), 
            repeat: Infinity, 
            ease: "easeInOut",
            background: { duration: 12, repeat: Infinity, ease: "easeInOut" }
          }}
          className={`absolute rounded-full blur-3xl transition-all duration-1000 ${
            deviceType === 'mobile' 
              ? 'bottom-8 left-4 w-40 h-40' 
              : deviceType === 'tablet'
                ? 'bottom-10 left-6 w-48 h-48'
                : deviceType === 'desktop'
                  ? 'bottom-10 left-5 w-52 h-52 sm:w-64 sm:h-64 lg:bottom-20 lg:left-10 lg:w-80 lg:h-80'
                  : 'bottom-20 left-10 w-80 h-80 xl:w-96 xl:h-96 2xl:w-[28rem] 2xl:h-[28rem]'
          }`}
        />

        {/* Enhanced Ambient Light Effect for Large Screens */}
        {viewportSize.width >= 1024 && (
          <motion.div
            animate={{ 
              opacity: [0.15, 0.4, 0.15],
              scale: [1, 1.3, 1],
              background: isDark 
                ? [
                    'radial-gradient(circle, rgba(59, 130, 246, 0.2) 0%, rgba(147, 51, 234, 0.1) 50%, transparent 100%)',
                    'radial-gradient(circle, rgba(147, 51, 234, 0.2) 0%, rgba(236, 72, 153, 0.1) 50%, transparent 100%)',
                    'radial-gradient(circle, rgba(236, 72, 153, 0.2) 0%, rgba(59, 130, 246, 0.1) 50%, transparent 100%)',
                    'radial-gradient(circle, rgba(59, 130, 246, 0.2) 0%, rgba(147, 51, 234, 0.1) 50%, transparent 100%)'
                  ]
                : [
                    'radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, rgba(147, 51, 234, 0.05) 50%, transparent 100%)',
                    'radial-gradient(circle, rgba(147, 51, 234, 0.1) 0%, rgba(236, 72, 153, 0.05) 50%, transparent 100%)',
                    'radial-gradient(circle, rgba(236, 72, 153, 0.1) 0%, rgba(59, 130, 246, 0.05) 50%, transparent 100%)',
                    'radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, rgba(147, 51, 234, 0.05) 50%, transparent 100%)'
                  ]
            }}
            transition={{ 
              duration: 40, 
              repeat: Infinity, 
              ease: "easeInOut",
              background: { duration: 12, repeat: Infinity, ease: "easeInOut" }
            }}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full blur-[120px]"
          />
        )}

        {/* Professional Center Gradient with Subtle Movement */}
        <motion.div
          style={{ 
            x: blobParallax.x, 
            y: blobParallax.y,
            scale: deviceType === 'mobile' ? 0.85 : (deviceType === 'tablet' ? 0.95 : 1)
          }}
          animate={{ 
            scale: deviceType === 'mobile' 
              ? [0.85, 0.88, 0.85] 
              : deviceType === 'tablet' 
                ? [0.95, 0.98, 0.95]
                : [1, 1.03, 1],
            opacity: [0.2, 0.4, 0.2],
            background: isDark 
              ? [
                  'radial-gradient(ellipse, rgba(168, 85, 247, 0.4) 0%, rgba(236, 72, 153, 0.25) 30%, rgba(59, 130, 246, 0.3) 60%, rgba(6, 182, 212, 0.15) 100%)',
                  'radial-gradient(ellipse, rgba(59, 130, 246, 0.4) 0%, rgba(168, 85, 247, 0.25) 30%, rgba(6, 182, 212, 0.3) 60%, rgba(236, 72, 153, 0.15) 100%)',
                  'radial-gradient(ellipse, rgba(6, 182, 212, 0.4) 0%, rgba(59, 130, 246, 0.25) 30%, rgba(236, 72, 153, 0.3) 60%, rgba(168, 85, 247, 0.15) 100%)',
                  'radial-gradient(ellipse, rgba(168, 85, 247, 0.4) 0%, rgba(236, 72, 153, 0.25) 30%, rgba(59, 130, 246, 0.3) 60%, rgba(6, 182, 212, 0.15) 100%)'
                ]
              : [
                  'radial-gradient(ellipse, rgba(168, 85, 247, 0.25) 0%, rgba(236, 72, 153, 0.15) 30%, rgba(59, 130, 246, 0.2) 60%, rgba(6, 182, 212, 0.1) 100%)',
                  'radial-gradient(ellipse, rgba(59, 130, 246, 0.25) 0%, rgba(168, 85, 247, 0.15) 30%, rgba(6, 182, 212, 0.2) 60%, rgba(236, 72, 153, 0.1) 100%)',
                  'radial-gradient(ellipse, rgba(6, 182, 212, 0.25) 0%, rgba(59, 130, 246, 0.15) 30%, rgba(236, 72, 153, 0.2) 60%, rgba(168, 85, 247, 0.1) 100%)',
                  'radial-gradient(ellipse, rgba(168, 85, 247, 0.25) 0%, rgba(236, 72, 153, 0.15) 30%, rgba(59, 130, 246, 0.2) 60%, rgba(6, 182, 212, 0.1) 100%)'
                ]
          }}
          transition={{ 
            duration: deviceType === 'mobile' ? 35 : (deviceType === 'tablet' ? 30 : 25), 
            repeat: Infinity, 
            ease: "easeInOut",
            background: { duration: 15, repeat: Infinity, ease: "easeInOut" }
          }}
          className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 blur-3xl transition-all duration-1000 ${
            deviceType === 'mobile' 
              ? 'w-80 h-60' 
              : deviceType === 'tablet'
                ? 'w-96 h-72'
                : deviceType === 'desktop'
                  ? 'w-[28rem] h-80 lg:w-[32rem] lg:h-96'
                  : 'w-[40rem] h-[28rem] xl:w-[48rem] xl:h-[32rem] 2xl:w-[56rem] 2xl:h-[36rem]'
          } rounded-full`}
        />

        {/* Professional Color Accents with Subtle Movement */}
        <motion.div
          animate={{
            opacity: isDark ? [0.08, 0.15, 0.08] : [0.04, 0.1, 0.04],
            scale: [1, 1.02, 1],
            background: isDark
              ? [
                  'conic-gradient(from 0deg, rgba(59, 130, 246, 0.12) 0%, rgba(147, 51, 234, 0.08) 50%, rgba(236, 72, 153, 0.12) 100%)',
                  'conic-gradient(from 60deg, rgba(147, 51, 234, 0.12) 0%, rgba(236, 72, 153, 0.08) 50%, rgba(59, 130, 246, 0.12) 100%)',
                  'conic-gradient(from 120deg, rgba(236, 72, 153, 0.12) 0%, rgba(59, 130, 246, 0.08) 50%, rgba(147, 51, 234, 0.12) 100%)',
                  'conic-gradient(from 0deg, rgba(59, 130, 246, 0.12) 0%, rgba(147, 51, 234, 0.08) 50%, rgba(236, 72, 153, 0.12) 100%)'
                ]
              : [
                  'conic-gradient(from 0deg, rgba(59, 130, 246, 0.06) 0%, rgba(147, 51, 234, 0.03) 50%, rgba(236, 72, 153, 0.06) 100%)',
                  'conic-gradient(from 60deg, rgba(147, 51, 234, 0.06) 0%, rgba(236, 72, 153, 0.03) 50%, rgba(59, 130, 246, 0.06) 100%)',
                  'conic-gradient(from 120deg, rgba(236, 72, 153, 0.06) 0%, rgba(59, 130, 246, 0.03) 50%, rgba(147, 51, 234, 0.06) 100%)',
                  'conic-gradient(from 0deg, rgba(59, 130, 246, 0.06) 0%, rgba(147, 51, 234, 0.03) 50%, rgba(236, 72, 153, 0.06) 100%)'
                ]
          }}
          transition={{
            duration: 40,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute inset-0 blur-[100px]"
        />

        {/* Additional Dark Mode Enhancement Layer */}
        {isDark && (
          <motion.div
            animate={{
              opacity: [0.05, 0.15, 0.05],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 30,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute inset-0 bg-gradient-to-br from-slate-900/50 via-transparent to-gray-900/50 blur-[80px]"
          />
        )}
      </div>

      {/* Main Content - Enhanced Responsive Layout */}
      <div className="relative z-10 min-h-screen flex items-center pt-12 sm:pt-16 md:pt-20 lg:pt-24 pb-6 sm:pb-8 md:pb-10 lg:pb-12">
        <div className={`w-full mx-auto ${
          deviceType === 'mobile' 
            ? 'px-4 max-w-sm' 
            : deviceType === 'tablet'
              ? 'px-6 max-w-4xl'
              : deviceType === 'desktop'
                ? 'px-8 max-w-7xl'
                : 'px-12 max-w-8xl'
        }`}>
          
          <div className={`grid items-center ${
            deviceType === 'mobile' 
              ? 'grid-cols-1 gap-6 min-h-[calc(100vh-6rem)]' 
              : deviceType === 'tablet'
                ? 'grid-cols-1 gap-8 min-h-[calc(100vh-8rem)]'
                : 'grid-cols-1 lg:grid-cols-2 gap-12 xl:gap-16 2xl:gap-20 min-h-[calc(100vh-10rem)]'
          }`}>
            
            {/* Left Column - Hero Content - Enhanced Responsive */}
            <div className={`flex flex-col justify-center ${
              deviceType === 'mobile' || deviceType === 'tablet' 
                ? 'text-center order-2' 
                : 'text-center lg:text-left order-2 lg:order-1'
            } ${
              deviceType === 'mobile' 
                ? 'space-y-4' 
                : deviceType === 'tablet'
                  ? 'space-y-6'
                  : 'space-y-6 lg:space-y-8'
            }`}>
              
              {/* Status Badge - Enhanced Responsive */}
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className={`flex ${
                  deviceType === 'mobile' || deviceType === 'tablet' 
                    ? 'justify-center' 
                    : 'justify-center lg:justify-start'
                }`}
              >
                <div className={`inline-flex items-center rounded-full font-medium transition-all duration-500 backdrop-blur-xl ${
                  deviceType === 'mobile' 
                    ? 'px-3 py-2 text-xs' 
                    : deviceType === 'tablet'
                      ? 'px-4 py-2 text-sm'
                      : 'px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm'
                } ${
                  isDark
                    ? 'bg-gray-900/95 border border-gray-700/70 text-gray-100 shadow-xl shadow-gray-950/60 hover:bg-gray-800/95 hover:border-gray-600/80'
                    : 'bg-white/95 border border-gray-200/70 text-gray-800 shadow-xl shadow-gray-200/60 hover:bg-gray-50/95 hover:border-gray-300/80'
                }`}>
                  <motion.span 
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className={`bg-gradient-to-r from-green-500 to-emerald-500 rounded-full shadow-sm shadow-green-400/50 ${
                      deviceType === 'mobile' ? 'w-2 h-2 mr-2' : 'w-2 h-2 sm:w-3 sm:h-3 mr-2 sm:mr-3'
                    }`}
                  />
                  <span className={deviceType === 'mobile' ? 'text-xs' : ''}>
                    CSE Student • Bangladesh 🇧🇩
                  </span>
                </div>
              </motion.div>
              
              {/* Enhanced Main Heading with Advanced Responsive Typography */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className={deviceType === 'mobile' ? 'space-y-2' : 'space-y-3 sm:space-y-4'}
                style={{ 
                  x: !cardParallax.isMobile ? textParallax.x : 0, 
                  y: !cardParallax.isMobile ? textParallax.y : 0 
                }}
              >
                <h1 className={`font-bold leading-tight tracking-tight ${
                  deviceType === 'mobile' 
                    ? 'text-2xl' 
                    : deviceType === 'tablet'
                      ? 'text-3xl md:text-4xl'
                      : deviceType === 'desktop'
                        ? 'text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl'
                        : 'text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl 2xl:text-9xl'
                }`}>
                  Hi, I&apos;m{' '}
                  <span className="relative inline-block">
                    <span className={`bg-gradient-to-r bg-clip-text text-transparent transition-all duration-700 ${
                      isDark
                        ? 'from-blue-400 via-purple-400 to-pink-400'
                        : 'from-blue-600 via-purple-600 to-pink-600'
                    }`}>
                      Bakul Ahmed
                    </span>
                    <motion.div
                      animate={{ 
                        opacity: [0.3, 0.6, 0.3]
                      }}
                      transition={{ duration: 3, repeat: Infinity }}
                      className={`absolute rounded-xl blur-lg -z-10 transition-all duration-700 ${
                        deviceType === 'mobile' ? '-inset-1' : '-inset-1 sm:-inset-2'
                      } ${
                        isDark
                          ? 'bg-gradient-to-r from-blue-400/25 via-purple-400/25 to-pink-400/25'
                          : 'bg-gradient-to-r from-blue-600/15 via-purple-600/15 to-pink-600/15'
                      }`}
                    />
                  </span>
                </h1>
                
                {/* Dynamic Typing Subtitle - Enhanced Responsive */}
                <div className={`flex items-center ${
                  deviceType === 'mobile' || deviceType === 'tablet' 
                    ? 'justify-center h-8' 
                    : 'justify-center lg:justify-start h-12 sm:h-14 lg:h-16'
                }`}>
                  <motion.p 
                    className={`font-semibold bg-gradient-to-r bg-clip-text text-transparent transition-all duration-700 ${
                      deviceType === 'mobile' 
                        ? 'text-sm' 
                        : deviceType === 'tablet'
                          ? 'text-base md:text-lg'
                          : 'text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl'
                    } ${
                      isDark
                        ? 'from-gray-100 via-white to-gray-100'
                        : 'from-gray-700 via-gray-900 to-gray-700'
                    }`}
                    key={currentWordIndex}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: isTyping ? 1 : 0, y: isTyping ? 0 : -20 }}
                    transition={{ duration: 0.5 }}
                  >
                    {typingWords[currentWordIndex]}
                    <motion.span
                      animate={{ opacity: [0, 1, 0] }}
                      transition={{ duration: 0.8, repeat: Infinity }}
                      className={`ml-1 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}
                    >
                      |
                    </motion.span>
                  </motion.p>
                </div>
              </motion.div>
              
              {/* Enhanced Description with Perfect Responsive Design */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className={deviceType === 'mobile' ? 'space-y-3' : 'space-y-4 sm:space-y-6'}
              >
                <p className={`leading-relaxed transition-colors duration-700 ${
                  deviceType === 'mobile' 
                    ? 'text-sm max-w-sm mx-auto' 
                    : deviceType === 'tablet'
                      ? 'text-base md:text-lg max-w-lg mx-auto'
                      : 'text-base sm:text-lg md:text-xl lg:text-2xl max-w-2xl mx-auto lg:mx-0'
                } ${
                  isDark ? 'text-gray-200' : 'text-gray-700'
                }`}>
                  Crafting digital experiences with{' '}
                  <span className={`inline-flex items-center rounded-lg font-semibold transition-all duration-500 ${
                    deviceType === 'mobile' 
                      ? 'px-2 py-1 mx-1 text-xs' 
                      : 'px-2 sm:px-3 py-1 mx-1 text-xs sm:text-sm'
                  } ${
                    isDark
                      ? 'bg-blue-500/25 text-blue-200 border border-blue-400/40 shadow-sm shadow-blue-500/30'
                      : 'bg-blue-100/90 text-blue-700 border border-blue-200/70 shadow-sm shadow-blue-200/40'
                  }`}>
                    code
                  </span>,{' '}
                  <span className={`inline-flex items-center rounded-lg font-semibold transition-all duration-500 ${
                    deviceType === 'mobile' 
                      ? 'px-2 py-1 mx-1 text-xs' 
                      : 'px-2 sm:px-3 py-1 mx-1 text-xs sm:text-sm'
                  } ${
                    isDark
                      ? 'bg-purple-500/25 text-purple-200 border border-purple-400/40 shadow-sm shadow-purple-500/30'
                      : 'bg-purple-100/90 text-purple-700 border border-purple-200/70 shadow-sm shadow-purple-200/40'
                  }`}>
                    creativity
                  </span>, and{' '}
                  <span className={`inline-flex items-center rounded-lg font-semibold transition-all duration-500 ${
                    deviceType === 'mobile' 
                      ? 'px-2 py-1 mx-1 text-xs' 
                      : 'px-2 sm:px-3 py-1 mx-1 text-xs sm:text-sm'
                  } ${
                    isDark
                      ? 'bg-pink-500/25 text-pink-200 border border-pink-400/40 shadow-sm shadow-pink-500/30'
                      : 'bg-pink-100/90 text-pink-700 border border-pink-200/70 shadow-sm shadow-pink-200/40'
                  }`}>
                    passion
                  </span>
                </p>
              </motion.div>

              {/* Enhanced CTA Buttons with Perfect Professional Sizing */}
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.7 }}
                className={`flex ${
                  deviceType === 'mobile' 
                    ? 'flex-col gap-3 justify-center' 
                    : deviceType === 'tablet'
                      ? 'flex-col sm:flex-row gap-3 justify-center'
                      : 'flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start'
                }`}
              >
                {/* Premium Primary CTA - View My Work */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.8 }}
                  whileHover={{ 
                    scale: deviceType === 'mobile' ? 1.02 : 1.03,
                    y: -2
                  }} 
                  whileTap={{ scale: 0.98 }}
                  className="w-full sm:w-auto group"
                >
                  <Link href="/projects">
                    <motion.button 
                      className={`relative w-full sm:w-auto rounded-xl font-semibold transition-all duration-700 overflow-hidden ${
                        deviceType === 'mobile' 
                          ? 'px-8 py-3 text-sm min-w-[180px]' 
                          : 'px-8 sm:px-10 py-3 sm:py-4 text-sm sm:text-base min-w-[200px]'
                      } ${
                        isDark
                          ? 'bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white shadow-2xl shadow-purple-500/25 hover:shadow-purple-500/40'
                          : 'bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white shadow-2xl shadow-purple-400/25 hover:shadow-purple-500/35'
                      } border border-white/10 hover:border-white/20`}
                      whileHover={{
                        boxShadow: isDark 
                          ? '0 25px 50px -12px rgba(147, 51, 234, 0.5)' 
                          : '0 25px 50px -12px rgba(147, 51, 234, 0.4)'
                      }}
                    >
                      {/* Animated Background */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
                        initial={{ x: '-100%' }}
                        whileHover={{ x: '0%' }}
                        transition={{ duration: 0.6, ease: "easeInOut" }}
                      />
                      
                      {/* Shimmer Effect */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                        animate={{ x: ['-100%', '100%'] }}
                        transition={{ 
                          duration: 2.5, 
                          repeat: Infinity, 
                          ease: "easeInOut",
                          repeatDelay: 1
                        }}
                      />
                      
                      <span className="relative z-10 flex items-center justify-center">
                        <motion.span 
                          className={deviceType === 'mobile' ? 'mr-2 text-base' : 'mr-2 text-lg'}
                          animate={{ rotate: [0, 15, -15, 0] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        >
                          🚀
                        </motion.span>
                        View My Work
                        <motion.svg
                          className="ml-2 w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          initial={{ x: 0 }}
                          whileHover={{ x: 4 }}
                          transition={{ duration: 0.3 }}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </motion.svg>
                      </span>
                    </motion.button>
                  </Link>
                </motion.div>

                {/* Premium CV Download Button */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 1.0 }}
                  whileHover={{ 
                    scale: deviceType === 'mobile' ? 1.02 : 1.03,
                    y: -2
                  }} 
                  whileTap={{ scale: 0.98 }}
                  className="w-full sm:w-auto group"
                >
                  <motion.a 
                    href="/cv/Bakul_Ahmed_CV.pdf" 
                    download="Bakul_Ahmed_CV.pdf"
                    className={`relative w-full sm:w-auto rounded-xl font-semibold backdrop-blur-xl transition-all duration-700 overflow-hidden inline-flex items-center justify-center border-2 ${
                      deviceType === 'mobile' 
                        ? 'px-8 py-3 text-sm min-w-[180px]' 
                        : 'px-8 sm:px-10 py-3 sm:py-4 text-sm sm:text-base min-w-[200px]'
                    } ${
                      isDark
                        ? 'bg-gray-900/60 border-emerald-400/30 text-emerald-300 hover:bg-gray-800/70 hover:border-emerald-400/50 shadow-xl shadow-emerald-900/20'
                        : 'bg-white/60 border-emerald-500/30 text-emerald-700 hover:bg-white/80 hover:border-emerald-500/50 shadow-xl shadow-emerald-200/30'
                    }`}
                    whileHover={{
                      boxShadow: isDark 
                        ? '0 20px 40px -10px rgba(16, 185, 129, 0.3)' 
                        : '0 20px 40px -10px rgba(16, 185, 129, 0.25)'
                    }}
                  >
                    {/* Animated Background Glow */}
                    <motion.div
                      className={`absolute inset-0 rounded-xl ${
                        isDark 
                          ? 'bg-gradient-to-r from-emerald-500/0 via-emerald-500/10 to-emerald-500/0' 
                          : 'bg-gradient-to-r from-emerald-500/0 via-emerald-500/5 to-emerald-500/0'
                      }`}
                      initial={{ x: '-100%' }}
                      whileHover={{ x: '100%' }}
                      transition={{ duration: 0.8, ease: "easeInOut" }}
                    />
                    
                    <span className="relative z-10 flex items-center justify-center">
                      <motion.span 
                        className={deviceType === 'mobile' ? 'mr-2 text-base' : 'mr-2 text-lg'}
                        animate={{ y: [0, -3, 0] }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                      >
                        📄
                      </motion.span>
                      Download CV
                      <motion.div
                        className={`ml-2 w-4 h-4 ${isDark ? 'text-emerald-300' : 'text-emerald-600'}`}
                        animate={{ y: [0, 3, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                      >
                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </motion.div>
                    </span>
                  </motion.a>
                </motion.div>
                
                {/* Contact Button */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 1.2 }}
                  whileHover={{ 
                    scale: deviceType === 'mobile' ? 1.02 : 1.03,
                    y: -2
                  }} 
                  whileTap={{ scale: 0.98 }}
                  className="w-full sm:w-auto group"
                >
                  <Link href="/contact">
                    <motion.button 
                      className={`relative w-full sm:w-auto rounded-xl font-semibold backdrop-blur-xl transition-all duration-700 overflow-hidden border-2 ${
                        deviceType === 'mobile' 
                          ? 'px-8 py-3 text-sm min-w-[180px]' 
                          : 'px-8 sm:px-10 py-3 sm:py-4 text-sm sm:text-base min-w-[200px]'
                      } ${
                        isDark
                          ? 'border-gray-600/50 bg-gray-900/60 text-gray-100 hover:bg-gray-800/70 hover:border-gray-500/70 shadow-xl shadow-gray-950/40'
                          : 'border-gray-300/50 bg-white/60 text-gray-800 hover:bg-gray-50/80 hover:border-gray-400/70 shadow-xl shadow-gray-200/40'
                      }`}
                      whileHover={{
                        boxShadow: isDark 
                          ? '0 20px 40px -10px rgba(17, 24, 39, 0.4)' 
                          : '0 20px 40px -10px rgba(156, 163, 175, 0.3)'
                      }}
                    >
                      {/* Animated Background */}
                      <motion.div
                        className={`absolute inset-0 rounded-xl ${
                          isDark 
                            ? 'bg-gradient-to-r from-gray-700/0 via-gray-600/20 to-gray-700/0' 
                            : 'bg-gradient-to-r from-gray-200/0 via-gray-300/20 to-gray-200/0'
                        }`}
                        initial={{ x: '-100%' }}
                        whileHover={{ x: '100%' }}
                        transition={{ duration: 0.8, ease: "easeInOut" }}
                      />
                      
                      <span className="relative z-10 flex items-center justify-center">
                        <motion.span 
                          className={deviceType === 'mobile' ? 'mr-2 text-base' : 'mr-2 text-lg'}
                          animate={{ rotate: [0, 10, -10, 0] }}
                          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        >
                          💬
                        </motion.span>
                        Let&apos;s Connect
                        <motion.svg
                          className="ml-2 w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          initial={{ x: 0 }}
                          whileHover={{ x: 3 }}
                          transition={{ duration: 0.3 }}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </motion.svg>
                      </span>
                    </motion.button>
                  </Link>
                </motion.div>
              </motion.div>

              {/* Premium Enhanced Tech Stack Pills with Professional Micro-Interactions */}
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  duration: 0.8, 
                  delay: 1.7,
                  type: "spring",
                  stiffness: 100
                }}
                className={`flex flex-wrap justify-center lg:justify-start items-center ${
                  deviceType === 'mobile' 
                    ? 'gap-1.5 max-w-xs mx-auto' 
                    : deviceType === 'tablet'
                      ? 'gap-2 max-w-md mx-auto'
                      : 'gap-2 sm:gap-2.5 max-w-xl mx-auto lg:mx-0'
                }`}
              >
                {skills.map((skill, index) => {
                  const colorMap = {
                    blue: {
                      bg: isDark ? 'from-blue-500/25 to-blue-600/15' : 'from-blue-100/95 to-blue-200/80',
                      border: isDark ? 'border-blue-400/40' : 'border-blue-300/60',
                      text: isDark ? 'text-blue-200' : 'text-blue-700',
                      shadow: isDark ? 'shadow-blue-500/20' : 'shadow-blue-200/40',
                      hoverShadow: isDark ? '0 15px 30px -8px rgba(59, 130, 246, 0.4)' : '0 15px 30px -8px rgba(59, 130, 246, 0.3)'
                    },
                    indigo: {
                      bg: isDark ? 'from-indigo-500/25 to-indigo-600/15' : 'from-indigo-100/95 to-indigo-200/80',
                      border: isDark ? 'border-indigo-400/40' : 'border-indigo-300/60',
                      text: isDark ? 'text-indigo-200' : 'text-indigo-700',
                      shadow: isDark ? 'shadow-indigo-500/20' : 'shadow-indigo-200/40',
                      hoverShadow: isDark ? '0 15px 30px -8px rgba(99, 102, 241, 0.4)' : '0 15px 30px -8px rgba(99, 102, 241, 0.3)'
                    },
                    green: {
                      bg: isDark ? 'from-green-500/25 to-green-600/15' : 'from-green-100/95 to-green-200/80',
                      border: isDark ? 'border-green-400/40' : 'border-green-300/60',
                      text: isDark ? 'text-green-200' : 'text-green-700',
                      shadow: isDark ? 'shadow-green-500/20' : 'shadow-green-200/40',
                      hoverShadow: isDark ? '0 15px 30px -8px rgba(34, 197, 94, 0.4)' : '0 15px 30px -8px rgba(34, 197, 94, 0.3)'
                    },
                    purple: {
                      bg: isDark ? 'from-purple-500/25 to-purple-600/15' : 'from-purple-100/95 to-purple-200/80',
                      border: isDark ? 'border-purple-400/40' : 'border-purple-300/60',
                      text: isDark ? 'text-purple-200' : 'text-purple-700',
                      shadow: isDark ? 'shadow-purple-500/20' : 'shadow-purple-200/40',
                      hoverShadow: isDark ? '0 15px 30px -8px rgba(147, 51, 234, 0.4)' : '0 15px 30px -8px rgba(147, 51, 234, 0.3)'
                    },
                    pink: {
                      bg: isDark ? 'from-pink-500/25 to-pink-600/15' : 'from-pink-100/95 to-pink-200/80',
                      border: isDark ? 'border-pink-400/40' : 'border-pink-300/60',
                      text: isDark ? 'text-pink-200' : 'text-pink-700',
                      shadow: isDark ? 'shadow-pink-500/20' : 'shadow-pink-200/40',
                      hoverShadow: isDark ? '0 15px 30px -8px rgba(236, 72, 153, 0.4)' : '0 15px 30px -8px rgba(236, 72, 153, 0.3)'
                    },
                    cyan: {
                      bg: isDark ? 'from-cyan-500/25 to-cyan-600/15' : 'from-cyan-100/95 to-cyan-200/80',
                      border: isDark ? 'border-cyan-400/40' : 'border-cyan-300/60',
                      text: isDark ? 'text-cyan-200' : 'text-cyan-700',
                      shadow: isDark ? 'shadow-cyan-500/20' : 'shadow-cyan-200/40',
                      hoverShadow: isDark ? '0 15px 30px -8px rgba(6, 182, 212, 0.4)' : '0 15px 30px -8px rgba(6, 182, 212, 0.3)'
                    },
                  };

                  const colors = colorMap[skill.color as keyof typeof colorMap];

                  return (
                    <motion.div
                      key={skill.name}
                      initial={{ opacity: 0, scale: 0.6, y: 30 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ 
                        duration: 0.6, 
                        delay: 1.8 + index * 0.08,
                        type: "spring",
                        stiffness: 200,
                        damping: 15
                      }}
                      whileHover={{ 
                        scale: deviceType === 'mobile' ? 1.05 : 1.08,
                        y: -4,
                        rotate: [0, 2, -2, 0],
                        transition: { 
                          duration: 0.3,
                          type: "spring",
                          stiffness: 300
                        }
                      }}
                      whileTap={{ 
                        scale: 0.95,
                        transition: { duration: 0.1 }
                      }}
                      className="relative group"
                    >
                      <motion.span
                        className={`relative rounded-xl font-medium backdrop-blur-xl transition-all duration-500 cursor-pointer touch-manipulation bg-gradient-to-r overflow-hidden ${colors.bg} ${colors.border} ${colors.text} ${colors.shadow} border ${
                          deviceType === 'mobile' 
                            ? 'px-2.5 py-1.5 text-xs' 
                            : deviceType === 'tablet'
                              ? 'px-3 py-1.5 text-xs'
                              : 'px-3 sm:px-4 py-2 text-xs sm:text-sm'
                        }`}
                        whileHover={{
                          boxShadow: colors.hoverShadow
                        }}
                      >
                        {/* Animated Background Shimmer */}
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent rounded-xl"
                          animate={{ x: ['-100%', '100%'] }}
                          transition={{ 
                            duration: 2.5, 
                            repeat: Infinity, 
                            ease: "easeInOut",
                            repeatDelay: 3 + index * 0.2
                          }}
                        />
                        
                        {/* Hover Glow Effect */}
                        <motion.div
                          className={`absolute inset-0 rounded-xl bg-gradient-to-r ${colors.bg} opacity-0 group-hover:opacity-30`}
                          transition={{ duration: 0.3 }}
                        />
                        
                        <span className="relative z-10 flex items-center">
                          <motion.span 
                            className={`${
                              deviceType === 'mobile' 
                                ? 'mr-1.5 text-xs' 
                                : 'mr-1.5 sm:mr-2 text-sm'
                            }`}
                            animate={{ 
                              rotate: [0, 15, -15, 0],
                              scale: [1, 1.1, 1]
                            }}
                            transition={{ 
                              duration: 4 + index * 0.3, 
                              repeat: Infinity, 
                              ease: "easeInOut",
                              delay: index * 0.2
                            }}
                          >
                            {skill.icon}
                          </motion.span>
                          <span className="whitespace-nowrap font-medium">{skill.name}</span>
                        </span>
                      </motion.span>
                    </motion.div>
                  );
                })}
              </motion.div>
            </div>

            {/* Right Column - Enhanced Profile Section with Perfect Responsive Design */}
            <div className={`flex flex-col items-center ${
              deviceType === 'mobile' 
                ? 'space-y-4 order-1' 
                : deviceType === 'tablet'
                  ? 'space-y-6 order-1'
                  : 'space-y-6 sm:space-y-8 order-1 lg:order-2'
            }`}>
              
              {/* Ultra-Enhanced Profile Image with Responsive Sizing */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                style={{ 
                  x: !cardParallax.isMobile ? cardParallax.x : 0, 
                  y: !cardParallax.isMobile ? cardParallax.y : 0 
                }}
                className="relative flex-shrink-0 group"
              >
                <div className={`relative ${
                  deviceType === 'mobile' 
                    ? 'w-48 h-48' 
                    : deviceType === 'tablet'
                      ? 'w-56 h-56'
                      : deviceType === 'desktop'
                        ? 'w-64 h-64 sm:w-72 sm:h-72 lg:w-80 lg:h-80'
                        : 'w-80 h-80 xl:w-96 xl:h-96'
                }`}>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className={`absolute inset-0 rounded-full blur-sm shadow-2xl transition-all duration-700 ${
                      isDark
                        ? 'bg-gradient-to-r from-blue-400 via-purple-400 via-pink-400 to-cyan-400 shadow-purple-500/60'
                        : 'bg-gradient-to-r from-blue-500 via-purple-500 via-pink-500 to-cyan-500 shadow-purple-300/60'
                    }`}
                  />
                  
                  <motion.div
                    animate={{ rotate: -360 }}
                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                    className={`absolute inset-1 rounded-full blur-sm transition-all duration-700 ${
                      isDark
                        ? 'bg-gradient-to-r from-cyan-400 via-pink-400 via-purple-400 to-blue-400'
                        : 'bg-gradient-to-r from-cyan-500 via-pink-500 via-purple-500 to-blue-500'
                    }`}
                  />

                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                    className={`absolute inset-2 rounded-full blur-[2px] transition-all duration-700 ${
                      isDark
                        ? 'bg-gradient-to-r from-emerald-400 via-blue-400 to-purple-400'
                        : 'bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-500'
                    }`}
                  />
                  
                  <Image
                    src="/Bakul.jpg"
                    alt="Bakul Ahmed"
                    width={320}
                    height={320}
                    className={`relative z-10 w-full h-full object-cover rounded-full shadow-2xl transition-all duration-700 backdrop-blur-md group-hover:scale-105 ${
                      isDark
                        ? 'border-3 sm:border-4 border-gray-800/80 shadow-gray-950/80'
                        : 'border-3 sm:border-4 border-white/90 shadow-gray-300/70'
                    }`}
                    priority
                  />
                  
                  {/* Professional Glow Effects */}
                  <motion.div
                    animate={{ 
                      scale: [1, 1.03, 1],
                      opacity: [0.4, 0.7, 0.4],
                    }}
                    transition={{ duration: 4, repeat: Infinity }}
                    className={`absolute inset-0 rounded-full blur-xl -z-10 transition-all duration-700 ${
                      isDark
                        ? 'bg-gradient-to-r from-blue-400/40 via-purple-400/40 to-pink-400/40'
                        : 'bg-gradient-to-r from-blue-500/25 via-purple-500/25 to-pink-500/25'
                    }`}
                  />

                  {/* Subtle Interactive Overlay */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 1 }}
                    className={`absolute inset-0 rounded-full z-20 flex items-center justify-center transition-all duration-300 ${
                      isDark
                        ? 'bg-gray-900/20 backdrop-blur-sm'
                        : 'bg-white/20 backdrop-blur-sm'
                    }`}
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      whileHover={{ scale: 1 }}
                      transition={{ duration: 0.2, type: "spring" }}
                      className={`text-xl sm:text-2xl ${isDark ? 'text-white' : 'text-gray-800'}`}
                    >
                      👋
                    </motion.div>
                  </motion.div>
                </div>
              </motion.div>

              {/* Professional Stats Cards with Perfect Proportions */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className={`grid grid-cols-2 w-full ${
                  deviceType === 'mobile' 
                    ? 'gap-3 max-w-xs' 
                    : deviceType === 'tablet'
                      ? 'gap-4 max-w-sm'
                      : 'gap-4 sm:gap-5 max-w-sm'
                }`}
              >
                <motion.div
                  whileHover={{ scale: deviceType === 'mobile' ? 1.02 : 1.03, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className={`rounded-xl text-center backdrop-blur-xl transition-all duration-300 touch-manipulation ${
                    deviceType === 'mobile' 
                      ? 'p-4 min-h-[80px]' 
                      : 'p-4 sm:p-5 min-h-[90px]'
                  } ${
                    isDark
                      ? 'bg-gray-900/95 border border-gray-700/50 shadow-xl shadow-gray-950/50 hover:shadow-2xl hover:shadow-blue-500/20 hover:border-blue-400/30'
                      : 'bg-white/95 border border-gray-200/50 shadow-xl shadow-gray-100/50 hover:shadow-2xl hover:shadow-blue-200/30 hover:border-blue-300/40'
                  }`}>
                  <motion.div 
                    whileHover={{ scale: deviceType === 'mobile' ? 1.05 : 1.08 }}
                    className={`font-bold bg-clip-text text-transparent transition-all duration-700 ${
                      deviceType === 'mobile' 
                        ? 'text-xl' 
                        : 'text-2xl sm:text-3xl'
                    } ${
                      isDark
                        ? 'bg-gradient-to-r from-blue-400 to-cyan-400'
                        : 'bg-gradient-to-r from-blue-600 to-cyan-600'
                    }`}
                  >
                    15+
                  </motion.div>
                  <div className={`mt-2 font-medium transition-colors duration-700 ${
                    deviceType === 'mobile' ? 'text-sm' : 'text-sm sm:text-base'
                  } ${
                    isDark ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    Projects
                  </div>
                </motion.div>
                
                <motion.div
                  whileHover={{ scale: deviceType === 'mobile' ? 1.02 : 1.03, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className={`rounded-xl text-center backdrop-blur-xl transition-all duration-300 touch-manipulation ${
                    deviceType === 'mobile' 
                      ? 'p-4 min-h-[80px]' 
                      : 'p-4 sm:p-5 min-h-[90px]'
                  } ${
                    isDark
                      ? 'bg-gray-900/95 border border-gray-700/50 shadow-xl shadow-gray-950/50 hover:shadow-2xl hover:shadow-purple-500/20 hover:border-purple-400/30'
                      : 'bg-white/95 border border-gray-200/50 shadow-xl shadow-gray-100/50 hover:shadow-2xl hover:shadow-purple-200/30 hover:border-purple-300/40'
                  }`}>
                  <motion.div 
                    whileHover={{ scale: deviceType === 'mobile' ? 1.05 : 1.08 }}
                    className={`font-bold bg-clip-text text-transparent transition-all duration-700 ${
                      deviceType === 'mobile' 
                        ? 'text-xl' 
                        : 'text-2xl sm:text-3xl'
                    } ${
                      isDark
                        ? 'bg-gradient-to-r from-purple-400 to-pink-400'
                        : 'bg-gradient-to-r from-purple-600 to-pink-600'
                    }`}
                  >
                    3+
                  </motion.div>
                  <div className={`mt-2 font-medium transition-colors duration-700 ${
                    deviceType === 'mobile' ? 'text-sm' : 'text-sm sm:text-base'
                  } ${
                    isDark ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    Years
                  </div>
                </motion.div>
              </motion.div>

              {/* Enhanced Quick Links with Perfect Responsive Touch Support */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.8 }}
                className={`flex ${
                  deviceType === 'mobile' 
                    ? 'gap-2' 
                    : 'gap-3 sm:gap-4'
                }`}
              >
                {[
                  { 
                    name: 'Projects', 
                    href: '/projects', 
                    icon: '💼',
                    gradient: isDark ? 'from-blue-500/30 to-blue-600/20' : 'from-blue-100/90 to-blue-200/70'
                  },
                  { 
                    name: 'Blog', 
                    href: '/blog', 
                    icon: '📝',
                    gradient: isDark ? 'from-purple-500/30 to-purple-600/20' : 'from-purple-100/90 to-purple-200/70'
                  },
                  { 
                    name: 'About', 
                    href: '/about', 
                    icon: '👨‍💻',
                    gradient: isDark ? 'from-emerald-500/30 to-emerald-600/20' : 'from-emerald-100/90 to-emerald-200/70'
                  },
                ].map((link, index) => (
                  <Link key={link.name} href={link.href}>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ 
                        duration: 0.5, 
                        delay: 0.9 + index * 0.1,
                        type: "spring",
                        stiffness: 100
                      }}
                      whileHover={{ 
                        scale: deviceType === 'mobile' ? 1.05 : (deviceType === 'tablet' ? 1.08 : 1.1), 
                        y: -3
                      }}
                      whileTap={{ scale: 0.95 }}
                      className={`relative flex flex-col items-center justify-center rounded-xl backdrop-blur-xl transition-all duration-300 group touch-manipulation bg-gradient-to-br ${link.gradient} ${
                        deviceType === 'mobile' 
                          ? 'p-2.5 w-16 h-16' 
                          : deviceType === 'tablet'
                            ? 'p-3 w-18 h-18'
                            : 'p-3 sm:p-4 w-18 h-18 sm:w-20 sm:h-20'
                      } ${
                        isDark
                          ? 'border border-gray-700/70 hover:border-gray-600/80 shadow-xl shadow-gray-950/70 hover:shadow-2xl'
                          : 'border border-gray-300/70 hover:border-gray-400/80 shadow-xl shadow-gray-200/60 hover:shadow-2xl'
                      }`}
                    >
                      <motion.span 
                        whileHover={{ scale: deviceType === 'mobile' ? 1.1 : 1.2 }}
                        className={deviceType === 'mobile' ? 'text-base mb-1' : 'text-lg sm:text-xl mb-1'}
                      >
                        {link.icon}
                      </motion.span>
                      <span className={`font-medium leading-tight text-center transition-colors duration-700 ${
                        deviceType === 'mobile' 
                          ? 'text-[9px]' 
                          : 'text-[10px] sm:text-[11px]'
                      } ${
                        isDark ? 'text-gray-200' : 'text-gray-600'
                      }`}>
                        {link.name}
                      </span>
                      
                      {/* Subtle hover glow */}
                      <motion.div
                        initial={{ opacity: 0 }}
                        whileHover={{ opacity: 1 }}
                        className={`absolute inset-0 rounded-xl transition-all duration-300 ${
                          isDark 
                            ? 'bg-gradient-to-br from-white/10 to-transparent'
                            : 'bg-gradient-to-br from-white/20 to-transparent'
                        }`}
                      />
                    </motion.div>
                  </Link>
                ))}
              </motion.div>
            </div>
          </div>
          
          {/* Professional Scroll Indicator with Enhanced Animations */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              duration: 0.8, 
              delay: 2.5,
              type: "spring",
              stiffness: 100
            }}
            className={`absolute ${
              deviceType === 'mobile' 
                ? 'bottom-6 left-1/2 transform -translate-x-1/2' 
                : 'bottom-8 left-1/2 transform -translate-x-1/2'
            }`}
          >
            <motion.div
              animate={{ 
                y: [0, 8, 0],
                opacity: [0.6, 1, 0.6]
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
              className="flex flex-col items-center space-y-2 group cursor-pointer"
              onClick={() => {
                window.scrollTo({ 
                  top: window.innerHeight, 
                  behavior: 'smooth' 
                });
              }}
            >
              <motion.div 
                className={`text-xs font-medium transition-all duration-300 group-hover:scale-110 ${
                  isDark ? 'text-gray-400 group-hover:text-gray-200' : 'text-gray-500 group-hover:text-gray-700'
                }`}
                whileHover={{ scale: 1.1 }}
              >
                Scroll down
              </motion.div>
              <motion.div
                className={`w-6 h-10 border-2 rounded-full flex justify-center transition-all duration-300 ${
                  isDark 
                    ? 'border-gray-600 group-hover:border-gray-400' 
                    : 'border-gray-400 group-hover:border-gray-600'
                }`}
                whileHover={{ scale: 1.1 }}
              >
                <motion.div
                  animate={{ 
                    y: [0, 12, 0],
                    opacity: [0, 1, 0]
                  }}
                  transition={{ 
                    duration: 1.5, 
                    repeat: Infinity, 
                    ease: "easeInOut" 
                  }}
                  className={`w-1 h-3 rounded-full mt-2 ${
                    isDark ? 'bg-gray-400' : 'bg-gray-600'
                  }`}
                />
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
