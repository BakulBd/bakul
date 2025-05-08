'use client';

export default function AboutPage() {
  return (
    <section className="space-y-12 py-12 bg-gradient-to-b from-white to-indigo-50 dark:from-gray-950 dark:to-gray-900">
      <div className="text-center">
        <h1 className="text-4xl sm:text-5xl font-extrabold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent mb-4">
          About Me
        </h1>
        <p className="text-lg text-gray-700 dark:text-gray-300 max-w-3xl mx-auto">
          Welcome to my personal space on the web! I am a passionate developer with a love for creating innovative solutions and exploring new technologies. With a strong foundation in web development and a keen eye for design, I strive to build applications that are both functional and visually appealing.
        </p>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        <p className="text-gray-700 dark:text-gray-300">
          Over the years, I have honed my skills in various programming languages and frameworks, enabling me to tackle complex challenges and deliver high-quality results. My journey in the tech world has been fueled by curiosity and a relentless drive to learn and grow.
        </p>
        <p className="text-gray-700 dark:text-gray-300">
          When I am not coding, you can find me exploring the outdoors, reading about the latest trends in technology, or experimenting with new recipes in the kitchen. I believe in the power of collaboration and am always open to connecting with like-minded individuals.
        </p>
        <p className="text-gray-700 dark:text-gray-300">
          Thank you for visiting my site. Feel free to explore my projects, read my blog, or get in touch if you would like to collaborate on an exciting project.
        </p>
      </div>
    </section>
  );
}