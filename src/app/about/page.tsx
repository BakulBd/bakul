'use client';
import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';

const GITHUB_README_URL = 'https://raw.githubusercontent.com/bakulahmed/bakulahmed/main/README.md';

export default function AboutPage() {
  const [readme, setReadme] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchReadme() {
      try {
        const res = await fetch(GITHUB_README_URL);
        if (!res.ok) {
          throw new Error(`Failed to fetch README: ${res.status}`);
        }
        const text = await res.text();
        setReadme(text);
      } catch (err) {
        setError((err as Error).message || 'Failed to load GitHub README');
        console.error('Error fetching GitHub README:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchReadme();
  }, []);

  return (
    <section className="space-y-12 py-12 bg-gradient-to-b from-white to-indigo-50 dark:from-gray-950 dark:to-gray-900">
      <div className="text-center">
        <h1 className="text-4xl sm:text-5xl font-extrabold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent mb-4">
          About Me
        </h1>
        <p className="text-lg text-gray-700 dark:text-gray-300 max-w-3xl mx-auto">
          Learn more about my journey, skills, and passion for technology.
        </p>
      </div>

      {loading && (
        <div className="flex justify-center py-8">
          <div className="animate-pulse w-8 h-8 rounded-full bg-indigo-400"></div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-lg text-red-700 dark:text-red-300">
          <p className="font-semibold">Error loading GitHub profile</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {!loading && !error && (
        <article className="prose dark:prose-invert lg:prose-lg max-w-none mx-auto">
          <ReactMarkdown>{readme}</ReactMarkdown>
        </article>
      )}
    </section>
  );
}