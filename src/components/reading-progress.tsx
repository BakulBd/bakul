'use client';

import { useEffect, useState } from 'react';

export default function ReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const updateProgress = () => {
      const scrolled = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const progressPercentage = Math.min((scrolled / maxScroll) * 100, 100);
      setProgress(progressPercentage);
    };

    window.addEventListener('scroll', updateProgress);
    updateProgress(); // Initial calculation

    return () => window.removeEventListener('scroll', updateProgress);
  }, []);

  return (
    <div className="fixed top-0 left-0 w-full h-1 bg-slate-200 dark:bg-slate-700 z-50">
      <div
        className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-transform duration-150 ease-out origin-left"
        style={{ transform: `scaleX(${progress / 100})` }}
      />
    </div>
  );
}
