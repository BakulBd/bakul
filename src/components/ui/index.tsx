'use client';

import React, { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';

import { cn } from '@/lib/utils';

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse" />
    );
  }

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="group relative w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200 flex items-center justify-center border border-gray-200 dark:border-gray-700"
      aria-label="Toggle theme"
    >
      <SunIcon className="w-5 h-5 text-gray-600 dark:text-gray-400 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <MoonIcon className="absolute w-5 h-5 text-gray-600 dark:text-gray-400 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </button>
  );
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  asChild?: boolean;
  children: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  asChild = false,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center font-medium transition-all duration-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-indigo-600 hover:bg-indigo-700 text-white focus:ring-indigo-500',
    secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-900 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-100 focus:ring-gray-500',
    outline: 'border border-gray-300 dark:border-gray-600 bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 focus:ring-gray-500',
    ghost: 'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 focus:ring-gray-500',
    destructive: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const buttonClasses = `${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`;

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      className: cn(buttonClasses, (children.props as { className?: string })?.className),
    } as Partial<React.HTMLAttributes<HTMLElement>>);
  }

  return (
    <button
      className={buttonClasses}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {children}
    </button>
  );
}

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: boolean;
  hover?: boolean;
  variant?: 'default' | 'premium' | 'glass' | 'gradient';
}

export function Card({ 
  children, 
  className = '', 
  padding = true, 
  hover = false,
  variant = 'default'
}: CardProps) {
  const variants = {
    default: 'bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700',
    premium: 'bg-white/90 dark:bg-slate-800/90 backdrop-blur-lg border border-white/60 dark:border-slate-700/60 shadow-xl',
    glass: 'bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-white/40 dark:border-slate-700/40',
    gradient: 'bg-gradient-to-br from-white via-blue-50 to-indigo-50 dark:from-slate-800 dark:via-slate-700 dark:to-indigo-900 border border-white/60 dark:border-slate-700/60'
  };

  return (
    <div className={cn(
      'card rounded-3xl transition-all duration-500',
      variants[variant],
      padding ? 'p-6 lg:p-8' : '',
      hover ? 'hover:shadow-2xl hover:-translate-y-2 group' : '',
      className
    )}>
      {children}
    </div>
  );
}

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Badge({ children, variant = 'primary', size = 'md', className = '' }: BadgeProps) {
  const variants = {
    primary: 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200',
    secondary: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
    success: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    error: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  };

  const sizes = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-2.5 py-1.5 text-sm',
    lg: 'px-3 py-2 text-base',
  };

  return (
    <span className={`
      inline-flex items-center font-medium rounded-full
      ${variants[variant]} 
      ${sizes[size]} 
      ${className}
    `}>
      {children}
    </span>
  );
}

interface AvatarProps {
  src?: string;
  alt?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function Avatar({ src, alt, name, size = 'md', className = '' }: AvatarProps) {
  const sizes = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl',
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (src) {
    return (
      <Image
        src={src}
        alt={alt || name || 'Avatar'}
        width={sizes[size].includes('w-8') ? 32 : sizes[size].includes('w-10') ? 40 : sizes[size].includes('w-12') ? 48 : 64}
        height={sizes[size].includes('h-8') ? 32 : sizes[size].includes('h-10') ? 40 : sizes[size].includes('h-12') ? 48 : 64}
        className={`
          ${sizes[size]} 
          rounded-full object-cover border-2 border-gray-200 dark:border-gray-700
          ${className}
        `}
      />
    );
  }

  return (
    <div className={`
      ${sizes[size]} 
      rounded-full bg-primary-600 flex items-center justify-center text-white font-semibold
      ${className}
    `}>
      {name ? getInitials(name) : '?'}
    </div>
  );
}

interface SkeletonProps {
  className?: string;
  lines?: number;
}

export function Skeleton({ className = '', lines = 1 }: SkeletonProps) {
  if (lines === 1) {
    return (
      <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`} />
    );
  }

  return (
    <div className="animate-pulse space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`bg-gray-200 dark:bg-gray-700 rounded ${
            i === lines - 1 ? 'w-3/4' : 'w-full'
          } ${className}`}
        />
      ))}
    </div>
  );
}

interface ProgressProps {
  value: number;
  max?: number;
  className?: string;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
}

export function Progress({ value, max = 100, className = '', color = 'primary' }: ProgressProps) {
  const percentage = Math.min((value / max) * 100, 100);
  
  const colors = {
    primary: 'bg-primary-600',
    secondary: 'bg-gray-600',
    success: 'bg-green-600',
    warning: 'bg-yellow-600',
    error: 'bg-red-600',
  };

  return (
    <div className={`w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 ${className}`}>
      <div
        className={`h-2 rounded-full transition-all duration-300 ${colors[color]}`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}

interface TooltipProps {
  children: React.ReactNode;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export function Tooltip({ children, content, position = 'top' }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  const positions = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2',
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div className={`
          absolute z-50 px-2 py-1 text-xs text-white bg-gray-900 dark:bg-gray-700 rounded
          ${positions[position]}
        `}>
          {content}
        </div>
      )}
    </div>
  );
}

// SectionWrapper Component
interface SectionWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export const SectionWrapper = React.forwardRef<HTMLElement, SectionWrapperProps>(
  ({ children, className = '' }, ref) => {
    return (
      <section ref={ref} className={cn('py-20', className)}>
        <div className="max-w-6xl mx-auto px-4">
          {children}
        </div>
      </section>
    );
  }
);

SectionWrapper.displayName = 'SectionWrapper';

// GradientText Component
interface GradientTextProps {
  children: React.ReactNode;
  className?: string;
}

export function GradientText({ children, className = '' }: GradientTextProps) {
  return (
    <span className={cn(
      'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent',
      className
    )}>
      {children}
    </span>
  );
}

// AnimatedCounter Component
interface AnimatedCounterProps {
  end: number;
  duration?: number;
  suffix?: string;
  className?: string;
}

export function AnimatedCounter({ end, duration = 2000, suffix = '', className = '' }: AnimatedCounterProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      setCount(Math.floor(progress * end));
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    
    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration]);

  return <span className={className}>{count}{suffix}</span>;
}

// Input Component
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helper?: string;
}

export function Input({ label, error, helper, className = '', ...props }: InputProps) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      <input
        className={cn(
          'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg',
          'bg-white dark:bg-gray-800 text-gray-900 dark:text-white',
          'focus:ring-2 focus:ring-indigo-500 focus:border-transparent',
          'placeholder-gray-500 dark:placeholder-gray-400',
          'transition-all duration-200',
          error && 'border-red-500 focus:ring-red-500',
          className
        )}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      {helper && !error && (
        <p className="text-sm text-gray-500 dark:text-gray-400">{helper}</p>
      )}
    </div>
  );
}

// Textarea Component
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helper?: string;
}

export function Textarea({ label, error, helper, className = '', ...props }: TextareaProps) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      <textarea
        className={cn(
          'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg',
          'bg-white dark:bg-gray-800 text-gray-900 dark:text-white',
          'focus:ring-2 focus:ring-indigo-500 focus:border-transparent',
          'placeholder-gray-500 dark:placeholder-gray-400',
          'transition-all duration-200 resize-vertical',
          error && 'border-red-500 focus:ring-red-500',
          className
        )}
        rows={4}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      {helper && !error && (
        <p className="text-sm text-gray-500 dark:text-gray-400">{helper}</p>
      )}
    </div>
  );
}

// LoadingSpinner Component
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <div className={cn('animate-spin rounded-full border-2 border-gray-300 border-t-indigo-600', sizes[size], className)} />
  );
}

// Enhanced Section Component
interface SectionCardProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  icon?: string;
  gradient?: string;
  bgGradient?: string;
  className?: string;
}

export function SectionCard({ 
  children, 
  title, 
  subtitle, 
  icon, 
  gradient = "from-blue-500 to-purple-500",
  bgGradient = "from-blue-50 to-purple-50 dark:from-blue-950/50 dark:to-purple-950/50",
  className = "" 
}: SectionCardProps) {
  return (
    <Card variant="premium" hover className={cn("group relative overflow-hidden", className)}>
      {/* Background gradient overlay */}
      <div className={cn("absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500", bgGradient)} />
      
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center gap-6 mb-8">
          {icon && (
            <div className={cn("text-5xl lg:text-6xl bg-gradient-to-r p-4 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-500 relative overflow-hidden", gradient)}>
              <div className="absolute inset-0 bg-white/20 dark:bg-black/20" />
              <span className="relative z-10">{icon}</span>
            </div>
          )}
          <div>
            <h3 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
              {title}
            </h3>
            {subtitle && (
              <p className="text-slate-600 dark:text-slate-400 text-lg">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        
        {/* Content */}
        {children}
      </div>
      
      {/* Decorative elements */}
      <div className="absolute top-4 right-4 w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-pulse" />
    </Card>
  );
}

// Enhanced Stat Card Component
interface StatCardProps {
  label: string;
  value: number;
  suffix?: string;
  icon?: string;
  gradient?: string;
}

export function StatCard({ label, value, suffix = "", icon, gradient = "from-blue-600 via-purple-600 to-indigo-600" }: StatCardProps) {
  return (
    <div className="text-center group">
      <Card variant="premium" hover className="relative overflow-hidden">
        {/* Enhanced glowing border effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/25 via-purple-500/25 to-indigo-500/25 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 -z-10" />
        
        {icon && (
          <div className="text-4xl mb-4 flex justify-center">{icon}</div>
        )}
        
        <div className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6">
          <GradientText className={cn("bg-gradient-to-r", gradient)}>
            <AnimatedCounter end={value} duration={2500} />
            {suffix}
          </GradientText>
        </div>
        <p className="text-slate-700 dark:text-slate-300 font-semibold text-lg lg:text-xl tracking-wide">{label}</p>
        
        {/* Enhanced decorative elements */}
        <div className="absolute -top-4 -right-4 w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-700 animate-pulse" />
        <div className="absolute -bottom-4 -left-4 w-8 h-8 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-700 animate-pulse delay-300" />
      </Card>
    </div>
  );
}
