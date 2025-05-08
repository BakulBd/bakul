import Image from 'next/image';
import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <section className="text-center py-16 bg-gradient-to-b from-indigo-50 to-white dark:from-gray-900 dark:to-gray-950">
        <h1 className="text-5xl md:text-6xl font-extrabold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent mb-6">
          Welcome to My Professional Portfolio
        </h1>
        <p className="text-lg text-gray-700 dark:text-gray-300 max-w-3xl mx-auto mb-8">
          Showcasing my projects, skills, and achievements as a passionate developer and designer.
        </p>
        <Image src="/globe.svg" alt="Portfolio Thumbnail" width={300} height={300} className="mx-auto" />
      </section>

      {/* Projects Section */}
      <section className="mt-16">
        <h2 className="text-4xl font-bold text-center mb-8 text-indigo-600 dark:text-indigo-400">
          Featured Projects
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Project Card Example */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
            <Image src="/file.svg" alt="Project Image" width={400} height={300} className="w-full h-48 object-cover" />
            <div className="p-6">
              <h3 className="text-2xl font-semibold mb-2 text-indigo-600 dark:text-indigo-300">Personal Portfolio</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                A modern developer portfolio with integrated blog/vlog CMS using Next.js and Supabase.
              </p>
              <div className="flex gap-4">
                <Link href="https://github.com/bakulahmed/portfolio-cms" target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline">
                  View Code
                </Link>
                <Link href="https://bakul.dev" target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline">
                  Live Demo
                </Link>
              </div>
            </div>
          </div>
          {/* Add more project cards here */}
        </div>
      </section>

      {/* Contact Section */}
      <section className="mt-16 text-center py-12 bg-gradient-to-b from-white to-indigo-50 dark:from-gray-950 dark:to-gray-900">
        <h2 className="text-4xl font-bold mb-6 text-indigo-600 dark:text-indigo-400">Get in Touch</h2>
        <p className="text-lg text-gray-700 dark:text-gray-300 max-w-2xl mx-auto mb-8">
          Feel free to reach out to me for collaborations, freelance work, or just to say hi!
        </p>
        <a
          href="mailto:contact@professionalportfolio.com"
          className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition"
        >
          Contact Me
        </a>
      </section>
    </main>
  );
}
