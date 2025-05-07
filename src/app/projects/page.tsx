import Image from "next/image";
import Link from "next/link";
import { FaGithub, FaExternalLinkAlt } from "react-icons/fa";

const projects = [
  {
    title: "Personal Portfolio & Blog CMS",
    description: "A modern developer portfolio with integrated blog/vlog CMS using Next.js and Supabase.",
    github: "https://github.com/bakulahmed/portfolio-cms",
    liveUrl: "https://bakul.dev",
    image: "/file.svg",
    technologies: ["Next.js", "Supabase", "TailwindCSS"]
  },
  {
    title: "Open Source AI Toolkit",
    description: "A set of open source tools for AI research and development.",
    github: "https://github.com/bakulahmed/ai-toolkit",
    liveUrl: "https://ai-toolkit.bakul.dev",
    image: "/globe.svg",
    technologies: ["Python", "TensorFlow", "React"]
  }
];

export default function ProjectsPage() {
  return (
    <section className="py-16 bg-gradient-to-b from-indigo-50 to-white dark:from-gray-900 dark:to-gray-950">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent mb-4">
          My Projects
        </h1>
        <p className="text-lg text-gray-700 dark:text-gray-300 max-w-3xl mx-auto">
          Explore some of the projects I&apos;ve worked on, showcasing my skills and passion for technology.
        </p>
      </div>
      <div className="grid gap-8 md:grid-cols-2">
        {projects.map((project) => (
          <div 
            key={project.title} 
            className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col bg-white dark:bg-gray-800"
          >
            <div className="h-48 relative overflow-hidden bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900 dark:to-purple-900">
              <Image 
                src={project.image} 
                alt={project.title}
                fill
                className="object-contain p-4 opacity-80 hover:opacity-100 transition-opacity"
              />
            </div>
            <div className="p-6 flex-1 flex flex-col">
              <h2 className="text-2xl font-semibold mb-2 text-indigo-600 dark:text-indigo-300">{project.title}</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4 flex-grow">{project.description}</p>
              <div className="mb-4 flex flex-wrap gap-2">
                {project.technologies.map(tech => (
                  <span 
                    key={tech} 
                    className="text-xs bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 px-2 py-1 rounded-full"
                  >
                    {tech}
                  </span>
                ))}
              </div>
              <div className="flex gap-4">
                <Link 
                  href={project.github} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center gap-1 text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  <FaGithub className="text-lg" />
                  <span>Code</span>
                </Link>
                <Link 
                  href={project.liveUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center gap-1 text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  <FaExternalLinkAlt className="text-sm" />
                  <span>Live Demo</span>
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}