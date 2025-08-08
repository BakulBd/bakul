'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LoadingScreenProps {
  onComplete?: () => void;
  duration?: number;
}

export default function EnhancedLoadingScreen({ 
  onComplete, 
  duration = 2500 
}: LoadingScreenProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [currentWord, setCurrentWord] = useState(0);

  const loadingWords = ['Learning', 'Coding', 'Building', 'Growing'];

  useEffect(() => {
    // Progress animation
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 3;
      });
    }, duration / 35);

    // Word rotation
    const wordInterval = setInterval(() => {
      setCurrentWord(prev => (prev + 1) % loadingWords.length);
    }, 500);

    // Complete loading
    const timer = setTimeout(() => {
      setIsLoading(false);
      setTimeout(() => {
        onComplete?.();
      }, 400);
    }, duration);

    return () => {
      clearInterval(progressInterval);
      clearInterval(wordInterval);
      clearTimeout(timer);
    };
  }, [duration, onComplete, loadingWords.length]);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-50 bg-gradient-to-br from-gray-950 via-slate-900 to-gray-950 flex flex-col items-center justify-center"
        >
          {/* Background Elements */}
          <div className="absolute inset-0 overflow-hidden">
            {/* Floating particles */}
            {Array.from({ length: 50 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  y: [0, -100, 0],
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0],
                }}
                transition={{
                  duration: Math.random() * 3 + 2,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                }}
              />
            ))}
            
            {/* Gradient blobs */}
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 180, 360],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
              }}
              className="absolute top-1/4 right-1/4 w-64 h-64 bg-gradient-to-br from-blue-500/30 via-purple-500/20 to-pink-500/30 rounded-full blur-3xl"
            />
            
            <motion.div
              animate={{
                scale: [1, 0.8, 1],
                rotate: [360, 180, 0],
                opacity: [0.2, 0.4, 0.2],
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
              }}
              className="absolute bottom-1/4 left-1/4 w-48 h-48 bg-gradient-to-tr from-cyan-500/30 via-blue-500/20 to-purple-500/30 rounded-full blur-3xl"
            />
          </div>

          {/* Main Content */}
          <div className="relative z-10 text-center space-y-8">
            {/* Logo/Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400 rounded-2xl flex items-center justify-center shadow-2xl shadow-purple-500/50"
            >
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="text-3xl text-white"
              >
                ⚛️
              </motion.span>
            </motion.div>

            {/* Loading Text */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="space-y-4"
            >
              <h1 className="text-3xl md:text-4xl font-bold text-white">
                <motion.span
                  key={currentWord}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="inline-block bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent"
                >
                  {loadingWords[currentWord]}
                </motion.span>
                <span className="text-gray-300 ml-2">the Future</span>
              </h1>
              
              <p className="text-gray-400 text-lg">Please wait while we prepare your experience...</p>
            </motion.div>

            {/* Progress Bar */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="space-y-3"
            >
              <div className="w-64 h-2 bg-gray-800 rounded-full overflow-hidden shadow-inner">
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 rounded-full shadow-lg shadow-purple-500/50"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              
              <motion.p
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="text-gray-500 text-sm"
              >
                {progress}% Complete
              </motion.p>
            </motion.div>

            {/* Loading Dots */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="flex space-x-2 justify-center"
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                  className="w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full"
                />
              ))}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
