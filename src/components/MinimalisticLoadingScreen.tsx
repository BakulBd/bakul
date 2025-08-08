'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface LoadingScreenProps {
  onComplete: () => void;
}

export default function MinimalisticLoadingScreen({ onComplete }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [currentWord, setCurrentWord] = useState(0);

  const words = ['Welcome', 'স্বাগতম', 'Building', 'Creating'];

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          setTimeout(onComplete, 500);
          return 100;
        }
        return prev + 2;
      });
    }, 50);

    const wordInterval = setInterval(() => {
      setCurrentWord((prev) => (prev + 1) % words.length);
    }, 800);

    return () => {
      clearInterval(progressInterval);
      clearInterval(wordInterval);
    };
  }, [onComplete, words.length]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-[200] bg-white dark:bg-slate-900 flex items-center justify-center"
    >
      <div className="text-center">
        {/* Spinning Logo */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 mx-auto mb-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-xl shadow-lg"
        >
          BA
        </motion.div>

        {/* Word Animation */}
        <motion.h1
          key={currentWord}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-4"
        >
          {words[currentWord]}
        </motion.h1>

        {/* Progress Bar */}
        <div className="w-64 h-1 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-4">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
            style={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Progress Text */}
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          {progress}%
        </p>
      </div>
    </motion.div>
  );
}
