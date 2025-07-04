'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  EnvelopeIcon, 
  PhoneIcon, 
  MapPinIcon,
  PaperAirplaneIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { 
  GithubIcon, 
  LinkedinIcon, 
  TwitterIcon 
} from 'lucide-react';
import { Button, Card, Input, Textarea } from '@/components/ui';
import 'draft-js/dist/Draft.css';

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

  const contactInfo = [
    {
      icon: EnvelopeIcon,
      title: 'Email',
      value: 'hello@bakulahmed.dev',
      href: 'mailto:hello@bakulahmed.dev',
      description: 'Send me an email'
    },
    {
      icon: PhoneIcon,
      title: 'Phone',
      value: '+880 1234-567890',
      href: 'tel:+8801234567890',
      description: 'Give me a call'
    },
    {
      icon: MapPinIcon,
      title: 'Location',
      value: 'Dhaka, Bangladesh',
      href: 'https://maps.google.com/?q=Dhaka,Bangladesh',
      description: 'Find me here'
    }
  ];

  const socialLinks = [
    {
      icon: GithubIcon,
      name: 'GitHub',
      href: 'https://github.com/bakulahmed',
      color: 'hover:text-gray-900 dark:hover:text-white'
    },
    {
      icon: LinkedinIcon,
      name: 'LinkedIn',
      href: 'https://linkedin.com/in/bakulahmed',
      color: 'hover:text-blue-600'
    },
    {
      icon: TwitterIcon,
      name: 'Twitter',
      href: 'https://twitter.com/bakulahmed',
      color: 'hover:text-blue-400'
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
      console.log("Validation Error: Please fill in all required fields correctly.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate form submission
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setIsSubmitted(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
      console.log("Message Sent! Thank you for your message. I'll get back to you soon.");
    } catch {
      console.log("Error: Failed to send message. Please try again.");
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-28">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 dark:from-blue-400/5 dark:to-purple-400/5" />
        
        <div className="relative container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            <h1 className="text-5xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Let&apos;s Work Together
            </h1>
            <p className="text-xl lg:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Have a project in mind? I&apos;d love to hear about it. Let&apos;s discuss how we can bring your ideas to life.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Content */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-20">
            
            {/* Contact Information */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h2 className="text-3xl lg:text-4xl font-bold mb-8 text-foreground">
                Get In Touch
              </h2>
              <p className="text-lg text-muted-foreground mb-10 leading-relaxed">
                I&apos;m always excited to work on new projects and collaborate with amazing people. 
                Whether you have a question, a project idea, or just want to say hello, 
                feel free to reach out!
              </p>

              {/* Contact Methods */}
              <div className="space-y-6 mb-12">
                {contactInfo.map((item, index) => (
                  <motion.a
                    key={item.title}
                    href={item.href}
                    target={item.href.startsWith('http') ? '_blank' : undefined}
                    rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
                    className="flex items-center p-6 rounded-2xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/20 dark:border-slate-700/30 hover:bg-white/80 dark:hover:bg-slate-700/60 transition-all duration-300 group"
                  >
                    <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <item.icon className="w-7 h-7 text-white" />
                    </div>
                    <div className="ml-6">
                      <h3 className="text-lg font-semibold text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-muted-foreground group-hover:text-foreground/80 transition-colors">
                        {item.value}
                      </p>
                      <p className="text-sm text-muted-foreground/70">
                        {item.description}
                      </p>
                    </div>
                  </motion.a>
                ))}
              </div>

              {/* Social Links */}
              <div>
                <h3 className="text-xl font-semibold mb-6 text-foreground">Connect With Me</h3>
                <div className="flex space-x-4">
                  {socialLinks.map((social, index) => (
                    <motion.a
                      key={social.name}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.6, delay: 0.6 + index * 0.1 }}
                      className={`w-12 h-12 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/20 dark:border-slate-700/30 rounded-xl flex items-center justify-center text-muted-foreground ${social.color} transition-all duration-300 hover:scale-110 hover:bg-white/80 dark:hover:bg-slate-700/60`}
                    >
                      <social.icon className="w-5 h-5" />
                    </motion.a>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Card className="p-8 lg:p-10 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-white/20 dark:border-slate-700/30">
                {isSubmitted ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="text-center py-12"
                  >
                    <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckCircleIcon className="w-10 h-10 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-foreground mb-4">
                      Message Sent Successfully!
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      Thank you for reaching out. I&apos;ll get back to you within 24 hours.
                    </p>
                    <Button
                      onClick={() => setIsSubmitted(false)}
                      variant="outline"
                    >
                      Send Another Message
                    </Button>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <h3 className="text-2xl lg:text-3xl font-bold mb-6 text-foreground">
                        Send Me a Message
                      </h3>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                          Full Name *
                        </label>
                        <Input
                          id="name"
                          type="text"
                          value={formData.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          placeholder="Your full name"
                          className={errors.name ? 'border-red-500 focus:border-red-500' : ''}
                        />
                        {errors.name && (
                          <div className="flex items-center mt-2 text-sm text-red-600 dark:text-red-400">
                            <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                            {errors.name}
                          </div>
                        )}
                      </div>

                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                          Email Address *
                        </label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          placeholder="your.email@example.com"
                          className={errors.email ? 'border-red-500 focus:border-red-500' : ''}
                        />
                        {errors.email && (
                          <div className="flex items-center mt-2 text-sm text-red-600 dark:text-red-400">
                            <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                            {errors.email}
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <label htmlFor="subject" className="block text-sm font-medium text-foreground mb-2">
                        Subject *
                      </label>
                      <Input
                        id="subject"
                        type="text"
                        value={formData.subject}
                        onChange={(e) => handleInputChange('subject', e.target.value)}
                        placeholder="What's this about?"
                        className={errors.subject ? 'border-red-500 focus:border-red-500' : ''}
                      />
                      {errors.subject && (
                        <div className="flex items-center mt-2 text-sm text-red-600 dark:text-red-400">
                          <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                          {errors.subject}
                        </div>
                      )}
                    </div>

                    <div>
                      <label htmlFor="message" className="block text-sm font-medium text-foreground mb-2">
                        Message *
                      </label>
                      <Textarea
                        id="message"
                        value={formData.message}
                        onChange={(e) => handleInputChange('message', e.target.value)}
                        placeholder="Tell me about your project or question..."
                        rows={6}
                        className={errors.message ? 'border-red-500 focus:border-red-500' : ''}
                      />
                      {errors.message && (
                        <div className="flex items-center mt-2 text-sm text-red-600 dark:text-red-400">
                          <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                          {errors.message}
                        </div>
                      )}
                    </div>

                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-[1.02] disabled:scale-100"
                    >
                      {isSubmitting ? (
                        <div className="flex items-center justify-center">
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                          Sending...
                        </div>
                      ) : (
                        <div className="flex items-center justify-center">
                          <PaperAirplaneIcon className="w-5 h-5 mr-2" />
                          Send Message
                        </div>
                      )}
                    </Button>
                  </form>
                )}
              </Card>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
