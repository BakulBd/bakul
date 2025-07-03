'use client';

import EnhancedHero from '@/components/sections/EnhancedHero';
import { SectionWrapper, Card, Button, Badge, GradientText, AnimatedCounter } from '@/components/ui';
import { useIntersectionObserver } from '@/hooks/enhanced';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useState, useRef } from 'react';

// Stats data
const stats = [
  { label: 'Projects Completed', value: 50, suffix: '+' },
  { label: 'Happy Clients', value: 30, suffix: '+' },
  { label: 'Years Experience', value: 5, suffix: '+' },
  { label: 'Technologies', value: 20, suffix: '+' },
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

export default function HomePage() {
  const statsRef = useRef<HTMLDivElement>(null);
  const [hasAnimated, setHasAnimated] = useState(false);
  
  useIntersectionObserver(statsRef, () => {
    if (!hasAnimated) {
      setHasAnimated(true);
    }
  });

  return (
    <main className="min-h-screen">
      {/* Enhanced Hero Section */}
      <EnhancedHero />

      {/* Stats Section */}
      <SectionWrapper className="bg-white dark:bg-gray-950">
        <div ref={statsRef} className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={hasAnimated ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: index * 0.1 }}
              className="text-center"
            >
              <div className="text-4xl md:text-5xl font-bold mb-2">
                <GradientText>
                  <AnimatedCounter end={stat.value} duration={2000} />
                  {stat.suffix}
                </GradientText>
              </div>
              <p className="text-gray-600 dark:text-gray-400 font-medium">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </SectionWrapper>

      {/* Services Section */}
      <SectionWrapper className="bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold mb-4"
          >
            <GradientText>Services & Expertise</GradientText>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto"
          >
            I offer comprehensive web development services, from concept to deployment
          </motion.p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {services.map((service, index) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="h-full group hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
                <div className="flex items-start gap-4 mb-4">
                  <div className="text-4xl bg-gradient-to-r from-indigo-500 to-purple-600 p-3 rounded-xl group-hover:scale-110 transition-transform duration-300">
                    {service.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      {service.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      {service.description}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {service.technologies.map((tech) => (
                    <Badge key={tech} variant="secondary">
                      {tech}
                    </Badge>
                  ))}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </SectionWrapper>

      {/* Featured Projects Section */}
      <SectionWrapper className="bg-white dark:bg-gray-950">
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold mb-4"
          >
            <GradientText>Featured Projects</GradientText>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto"
          >
            Here are some of my recent projects that showcase my skills and passion for development
          </motion.p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuredProjects.map((project, index) => (
            <motion.div
              key={project.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="group h-full hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 overflow-hidden">
                <div className="relative h-48 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900 dark:to-purple-900 mb-6">
                  <Image 
                    src={project.image} 
                    alt={project.title}
                    fill
                    className="object-contain p-8 group-hover:scale-110 transition-transform duration-300"
                  />
                  {project.featured && (
                    <Badge className="absolute top-4 right-4" variant="primary">
                      Featured
                    </Badge>
                  )}
                </div>
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {project.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {project.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {project.tech.map((tech) => (
                      <Badge key={tech} variant="secondary">
                        {tech}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-4 pt-4">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={project.github} target="_blank" className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                        </svg>
                        Code
                      </Link>
                    </Button>
                    <Button size="sm" asChild>
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
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <Button asChild size="lg">
            <Link href="/projects" className="flex items-center gap-2">
              View All Projects
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </Button>
        </motion.div>
      </SectionWrapper>

      {/* Testimonials Section */}
      <SectionWrapper className="bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold mb-4"
          >
            <GradientText>What Clients Say</GradientText>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto"
          >
            Don't just take my word for it - here's what my clients have to say about working with me
          </motion.p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="h-full group hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                    <Image 
                      src={testimonial.avatar} 
                      alt={testimonial.name}
                      width={48}
                      height={48}
                      className="rounded-full object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {testimonial.name}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {testimonial.role}
                    </p>
                  </div>
                </div>
                <p className="text-gray-700 dark:text-gray-300 mb-4 italic">
                  "{testimonial.content}"
                </p>
                <div className="flex gap-1">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <svg
                      key={i}
                      className="w-5 h-5 text-yellow-400"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  ))}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </SectionWrapper>

      {/* CTA Section */}
      <SectionWrapper className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="text-center">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold mb-6"
          >
            Ready to Start Your Project?
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-xl text-indigo-100 max-w-2xl mx-auto mb-8"
          >
            Let's work together to bring your ideas to life. I'm here to help you build something amazing.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button variant="secondary" size="lg" asChild>
              <Link href="/contact" className="flex items-center gap-2">
                Get In Touch
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild className="border-white text-white hover:bg-white hover:text-indigo-600">
              <Link href="/projects">
                View My Work
              </Link>
            </Button>
          </motion.div>
        </div>
      </SectionWrapper>

      {/* Latest Blog Posts */}
      <SectionWrapper className="bg-white dark:bg-gray-950">
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold mb-4"
          >
            <GradientText>Latest Blog Posts</GradientText>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto"
          >
            Thoughts, tutorials, and insights about web development and technology
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Blog posts will be loaded dynamically from your CMS
          </p>
          <Button asChild size="lg">
            <Link href="/blog" className="flex items-center gap-2">
              Read All Posts
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </Button>
        </motion.div>
      </SectionWrapper>
    </main>
  );
}