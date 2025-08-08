'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import ModernNavbar from '@/components/layout/ModernNavbar';
import { 
  EnvelopeIcon, 
  PhoneIcon, 
  MapPinIcon,
  PaperAirplaneIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  UserIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

interface FormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
}

export default function ContactPage() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const isDark = theme === 'dark';

  const contactInfo = [
    {
      icon: EnvelopeIcon,
      title: 'Email',
      value: 'bokula88@gmail.com',
      href: 'mailto:bokula88@gmail.com',
      description: 'Send me an email anytime',
      color: 'from-blue-500 to-cyan-500',
      gradient: isDark ? 'from-blue-400 to-cyan-400' : 'from-blue-600 to-cyan-600'
    },
    {
      icon: PhoneIcon,
      title: 'Phone',
      value: '+8801786685665',
      href: 'tel:+8801786685665',
      description: 'Call me for urgent matters',
      color: 'from-green-500 to-emerald-500',
      gradient: isDark ? 'from-green-400 to-emerald-400' : 'from-green-600 to-emerald-600'
    },
    {
      icon: MapPinIcon,
      title: 'Location',
      value: 'Dhaka, Bangladesh',
      href: '#',
      description: 'Based in Bangladesh',
      color: 'from-purple-500 to-pink-500',
      gradient: isDark ? 'from-purple-400 to-pink-400' : 'from-purple-600 to-pink-600'
    },
    {
      icon: ClockIcon,
      title: 'Response Time',
      value: '24 hours',
      href: '#',
      description: 'I reply within a day',
      color: 'from-orange-500 to-red-500',
      gradient: isDark ? 'from-orange-400 to-red-400' : 'from-orange-600 to-red-600'
    }
  ];

  const socialLinks = [
    {
      name: 'GitHub',
      href: 'https://github.com/BakulBd',
      icon: '🐙',
      color: isDark ? 'hover:text-gray-300' : 'hover:text-gray-700',
      bg: isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-200'
    },
    {
      name: 'LinkedIn',
      href: 'https://linkedin.com/in/bakulahmed',
      icon: '💼',
      color: isDark ? 'hover:text-blue-400' : 'hover:text-blue-600',
      bg: isDark ? 'hover:bg-blue-900/20' : 'hover:bg-blue-100'
    },
    {
      name: 'Twitter',
      href: 'https://twitter.com/bakulahmed',
      icon: '🐦',
      color: isDark ? 'hover:text-sky-400' : 'hover:text-sky-600',
      bg: isDark ? 'hover:bg-sky-900/20' : 'hover:bg-sky-100'
    },
    {
      name: 'Portfolio',
      href: 'https://bakulahmed.dev',
      icon: '🌐',
      color: isDark ? 'hover:text-purple-400' : 'hover:text-purple-600',
      bg: isDark ? 'hover:bg-purple-900/20' : 'hover:bg-purple-100'
    }
  ];

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters long';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate form submission
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setIsSubmitted(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
      setErrors({});
      
      // Reset success state after 5 seconds
      setTimeout(() => {
        setIsSubmitted(false);
      }, 5000);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
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
          className={`absolute inset-0 transition-opacity duration-1000 ${
            isDark 
              ? 'bg-gradient-to-br from-gray-900 via-slate-900 to-black' 
              : 'bg-gradient-to-br from-white via-blue-50 to-purple-50'
          }`}
          animate={{
            background: isDark 
              ? [
                  'radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.15) 0%, transparent 50%)',
                  'radial-gradient(circle at 80% 20%, rgba(147, 51, 234, 0.15) 0%, transparent 50%)',
                  'radial-gradient(circle at 40% 40%, rgba(59, 130, 246, 0.15) 0%, transparent 50%)'
                ]
              : [
                  'radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)',
                  'radial-gradient(circle at 80% 20%, rgba(147, 51, 234, 0.1) 0%, transparent 50%)',
                  'radial-gradient(circle at 40% 40%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)'
                ]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        
        {/* Floating particles */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className={`absolute w-2 h-2 rounded-full ${
              isDark ? 'bg-blue-400/20' : 'bg-blue-500/30'
            }`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [-30, 30],
              x: [-20, 20],
              opacity: [0.2, 0.8, 0.2],
              scale: [0.5, 1.5, 0.5],
            }}
            transition={{
              duration: 4 + Math.random() * 4,
              repeat: Infinity,
              delay: Math.random() * 2,
              ease: 'easeInOut',
            }}
          />
        ))}
        
        {/* Enhanced Floating Orbs */}
        <motion.div
          className={`absolute top-20 right-20 w-96 h-96 rounded-full blur-3xl ${
            isDark ? 'bg-blue-500/10' : 'bg-blue-500/20'
          }`}
          animate={{
            y: [0, -30, 0],
            x: [0, 20, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className={`absolute bottom-20 left-20 w-80 h-80 rounded-full blur-3xl ${
            isDark ? 'bg-purple-500/15' : 'bg-purple-500/25'
          }`}
          animate={{
            y: [0, 30, 0],
            x: [0, -20, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
        />
        <motion.div
          className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full blur-3xl ${
            isDark ? 'bg-cyan-500/10' : 'bg-cyan-500/20'
          }`}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 4
          }}
        />
        
        {/* Grid Pattern */}
        <div className={`absolute inset-0 opacity-30 ${
          isDark 
            ? 'bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)]'
            : 'bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)]'
        } bg-[size:50px_50px]`} />
      </div>

      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {/* Enhanced Hero Section */}
        <motion.div
          className="text-center mb-20"
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
            <SparklesIcon className={`w-5 h-5 mr-2 ${
              isDark ? 'text-blue-400' : 'text-blue-600'
            }`} />
            <span className={`font-medium ${
              isDark ? 'text-blue-300' : 'text-blue-700'
            }`}>Let&apos;s Connect</span>
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
            Get In Touch
          </motion.h1>
          
          <motion.p
            className={`text-xl md:text-2xl max-w-4xl mx-auto leading-relaxed ${
              isDark ? 'text-gray-300' : 'text-gray-600'
            }`}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            I&apos;m always excited to work on new projects and collaborate with amazing people. 
            Let&apos;s create something incredible together!
          </motion.p>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-5 gap-12 lg:gap-16">
          {/* Contact Information */}
          <motion.div
            className="lg:col-span-2 space-y-12"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            <div>
              <h2 className={`text-3xl md:text-4xl font-bold bg-gradient-to-r bg-clip-text text-transparent mb-6 ${
                isDark 
                  ? 'from-blue-400 to-purple-400' 
                  : 'from-blue-600 to-purple-600'
              }`}>
                Contact Information
              </h2>
              <p className={`text-lg leading-relaxed ${
                isDark ? 'text-gray-300' : 'text-gray-600'
              }`}>
                I&apos;m always excited to work on new projects and collaborate with amazing people. 
                Feel free to reach out through any of these channels.
              </p>
            </div>

            {/* Enhanced Contact Methods Grid */}
            <div className="space-y-6">
              {contactInfo.map((method, index) => (
                <motion.div
                  key={method.title}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 + index * 0.1 }}
                  whileHover={{ y: -5, scale: 1.02 }}
                  className="group"
                >
                  <a
                    href={method.href}
                    target={method.href.startsWith('http') ? '_blank' : undefined}
                    rel={method.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                    className={`block p-6 backdrop-blur-lg rounded-2xl border transition-all duration-300 ${
                      isDark
                        ? 'bg-gray-900/50 border-gray-700/50 hover:border-gray-600/70 hover:bg-gray-800/60'
                        : 'bg-white/50 border-gray-300/50 hover:border-gray-400/70 hover:bg-white/70'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`w-14 h-14 bg-gradient-to-r ${method.color} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                        <method.icon className="w-7 h-7 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className={`text-xl font-semibold transition-colors ${
                          isDark 
                            ? 'text-white group-hover:text-blue-400' 
                            : 'text-gray-900 group-hover:text-blue-600'
                        }`}>
                          {method.title}
                        </h3>
                        <p className={`font-medium bg-gradient-to-r bg-clip-text text-transparent ${method.gradient}`}>
                          {method.value}
                        </p>
                        <p className={`text-sm ${
                          isDark ? 'text-gray-400' : 'text-gray-600'
                        }`}>{method.description}</p>
                      </div>
                      <motion.div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          isDark ? 'bg-gray-700/50' : 'bg-gray-200/50'
                        }`}
                        whileHover={{ rotate: 90 }}
                        transition={{ duration: 0.2 }}
                      >
                        <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>→</span>
                      </motion.div>
                    </div>
                  </a>
                </motion.div>
              ))}
            </div>

            {/* Enhanced Social Links */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.9 }}
              className="pt-8"
            >
              <h3 className={`text-xl font-semibold mb-6 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>Connect With Me</h3>
              <div className="flex flex-wrap gap-4">
                {socialLinks.map((social, index) => (
                  <motion.a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`w-14 h-14 backdrop-blur-sm rounded-2xl border flex items-center justify-center text-2xl transition-all duration-300 hover:scale-110 ${
                      isDark
                        ? 'bg-gray-900/50 border-gray-700/50 text-gray-400'
                        : 'bg-white/50 border-gray-300/50 text-gray-600'
                    } ${social.color} ${social.bg}`}
                    whileHover={{ y: -5 }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.9 + index * 0.1 }}
                  >
                    {social.icon}
                  </motion.a>
                ))}
              </div>
            </motion.div>
          </motion.div>

          {/* Contact Form */}
          <motion.div
            className="lg:col-span-3"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
          >
            <div className={`backdrop-blur-lg rounded-3xl border p-8 lg:p-10 transition-all duration-300 ${
              isDark
                ? 'bg-gray-900/50 border-gray-700/50'
                : 'bg-white/70 border-gray-300/50'
            }`}>
              {isSubmitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="text-center py-12"
                >
                  <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircleIcon className="w-10 h-10 text-green-400" />
                  </div>
                  <h3 className={`text-2xl font-bold mb-4 ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    Message Sent Successfully!
                  </h3>
                  <p className={`mb-6 ${
                    isDark ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    Thank you for reaching out. I&apos;ll get back to you within 24 hours.
                  </p>
                  <motion.button
                    onClick={() => setIsSubmitted(false)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`px-6 py-3 border rounded-xl font-medium transition-all duration-300 ${
                      isDark
                        ? 'bg-gray-800/50 border-gray-700/50 text-white hover:bg-gray-700/50'
                        : 'bg-gray-100/50 border-gray-300/50 text-gray-900 hover:bg-gray-200/50'
                    }`}
                  >
                    Send Another Message
                  </motion.button>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <h3 className={`text-2xl lg:text-3xl font-bold mb-6 ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}>
                      Send Me a Message
                    </h3>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="name" className={`block text-sm font-medium mb-2 ${
                        isDark ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        <UserIcon className="w-4 h-4 inline mr-1" />
                        Full Name *
                      </label>
                      <input
                        id="name"
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="Your full name"
                        className={`w-full px-4 py-3 backdrop-blur-sm border rounded-xl focus:outline-none focus:ring-2 transition-all duration-300 ${
                          isDark
                            ? 'bg-gray-800/50 border-gray-700/50 text-white placeholder-gray-400 focus:ring-blue-500/50 focus:border-blue-500/50'
                            : 'bg-white/50 border-gray-300/50 text-gray-900 placeholder-gray-500 focus:ring-blue-500/50 focus:border-blue-500/50'
                        } ${
                          errors.name 
                            ? 'border-red-500 focus:border-red-500' 
                            : ''
                        }`}
                      />
                      <AnimatePresence>
                        {errors.name && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="flex items-center mt-2 text-sm text-red-400"
                          >
                            <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                            {errors.name}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <div>
                      <label htmlFor="email" className={`block text-sm font-medium mb-2 ${
                        isDark ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        <EnvelopeIcon className="w-4 h-4 inline mr-1" />
                        Email Address *
                      </label>
                      <input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="your.email@example.com"
                        className={`w-full px-4 py-3 backdrop-blur-sm border rounded-xl focus:outline-none focus:ring-2 transition-all duration-300 ${
                          isDark
                            ? 'bg-gray-800/50 border-gray-700/50 text-white placeholder-gray-400 focus:ring-blue-500/50 focus:border-blue-500/50'
                            : 'bg-white/50 border-gray-300/50 text-gray-900 placeholder-gray-500 focus:ring-blue-500/50 focus:border-blue-500/50'
                        } ${
                          errors.email 
                            ? 'border-red-500 focus:border-red-500' 
                            : ''
                        }`}
                      />
                      <AnimatePresence>
                        {errors.email && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="flex items-center mt-2 text-sm text-red-400"
                          >
                            <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                            {errors.email}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="subject" className={`block text-sm font-medium mb-2 ${
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      <ChatBubbleLeftRightIcon className="w-4 h-4 inline mr-1" />
                      Subject *
                    </label>
                    <input
                      id="subject"
                      type="text"
                      value={formData.subject}
                      onChange={(e) => handleInputChange('subject', e.target.value)}
                      placeholder="What's this about?"
                      className={`w-full px-4 py-3 backdrop-blur-sm border rounded-xl focus:outline-none focus:ring-2 transition-all duration-300 ${
                        isDark
                          ? 'bg-gray-800/50 border-gray-700/50 text-white placeholder-gray-400 focus:ring-blue-500/50 focus:border-blue-500/50'
                          : 'bg-white/50 border-gray-300/50 text-gray-900 placeholder-gray-500 focus:ring-blue-500/50 focus:border-blue-500/50'
                      } ${
                        errors.subject 
                          ? 'border-red-500 focus:border-red-500' 
                          : ''
                      }`}
                    />
                    <AnimatePresence>
                      {errors.subject && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="flex items-center mt-2 text-sm text-red-400"
                        >
                          <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                          {errors.subject}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div>
                    <label htmlFor="message" className={`block text-sm font-medium mb-2 ${
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      <ChatBubbleLeftRightIcon className="w-4 h-4 inline mr-1" />
                      Message *
                    </label>
                    <textarea
                      id="message"
                      value={formData.message}
                      onChange={(e) => handleInputChange('message', e.target.value)}
                      placeholder="Tell me about your project or question..."
                      rows={6}
                      className={`w-full px-4 py-3 backdrop-blur-sm border rounded-xl focus:outline-none focus:ring-2 transition-all duration-300 resize-none ${
                        isDark
                          ? 'bg-gray-800/50 border-gray-700/50 text-white placeholder-gray-400 focus:ring-blue-500/50 focus:border-blue-500/50'
                          : 'bg-white/50 border-gray-300/50 text-gray-900 placeholder-gray-500 focus:ring-blue-500/50 focus:border-blue-500/50'
                      } ${
                        errors.message 
                          ? 'border-red-500 focus:border-red-500' 
                          : ''
                      }`}
                    />
                    <AnimatePresence>
                      {errors.message && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="flex items-center mt-2 text-sm text-red-400"
                        >
                          <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                          {errors.message}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <motion.button
                    type="submit"
                    disabled={isSubmitting}
                    whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                    whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                    className="w-full px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <PaperAirplaneIcon className="w-5 h-5" />
                        <span>Send Message</span>
                      </>
                    )}
                  </motion.button>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
