import Image from "next/image";
import { FaGithub, FaLinkedin, FaTwitter } from "react-icons/fa";

export default function HomePage() {
  return (
    <section className="flex flex-col items-center justify-center min-h-screen text-center relative bg-gradient-to-b from-indigo-50 to-white dark:from-gray-900 dark:to-gray-950">
      {/* Hero Section */}
      <div className="absolute inset-0 -z-10 flex items-center justify-center opacity-30 pointer-events-none">
        <svg width="800" height="800" viewBox="0 0 800 800" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="400" cy="400" r="300" fill="url(#paint0_radial)" />
          <defs>
            <radialGradient id="paint0_radial" cx="0" cy="0" r="1" gradientTransform="translate(400 400) scale(300)" gradientUnits="userSpaceOnUse">
              <stop stopColor="#6366f1" stopOpacity="0.3" />
              <stop offset="1" stopColor="#a5b4fc" stopOpacity="0" />
            </radialGradient>
          </defs>
        </svg>
      </div>
      <div className="mb-6">
        <Image
          src="/file.svg"
          alt="Bakul Ahmed profile"
          width={150}
          height={150}
          className="rounded-full border-4 border-indigo-500 shadow-lg mx-auto"
        />
      </div>
      <h1 className="text-5xl md:text-6xl font-extrabold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent mb-4 animate-fade-in">
        Bakul Ahmed
      </h1>
      <p className="text-xl md:text-2xl text-gray-700 dark:text-gray-300 max-w-2xl mx-auto mb-6 animate-fade-in delay-100">
        Passionate Computer Science and Engineering student at Green University of Bangladesh. Focused on AI, Full-Stack, and Open Source.
      </p>
      <div className="flex justify-center gap-6 mb-8 animate-fade-in delay-200">
        <a href="https://github.com/bakulahmed" target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="text-3xl text-gray-700 dark:text-gray-200 hover:text-indigo-500 transition">
          <FaGithub />
        </a>
        <a href="https://linkedin.com/in/bakulahmed" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="text-3xl text-gray-700 dark:text-gray-200 hover:text-blue-600 transition">
          <FaLinkedin />
        </a>
        <a href="https://twitter.com/bakulahmed" target="_blank" rel="noopener noreferrer" aria-label="Twitter" className="text-3xl text-gray-700 dark:text-gray-200 hover:text-sky-400 transition">
          <FaTwitter />
        </a>
      </div>
      {/* Call to Action */}
      <div className="mt-6 animate-fade-in delay-300">
        <a
          href="#projects"
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg shadow-lg hover:bg-indigo-700 transition text-lg font-medium"
        >
          View My Projects
        </a>
      </div>
    </section>
  );
}
