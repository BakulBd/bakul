'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider, Attribute } from 'next-themes';
import { useEffect, useState } from 'react';

interface ThemeProviderProps {
  children: React.ReactNode;
  enableSystem?: boolean;
  attribute?: string;
  defaultTheme?: string;
  disableTransitionOnChange?: boolean;
}

export function ThemeProvider({ 
  children, 
  enableSystem = true, 
  attribute = 'class', 
  defaultTheme = 'dark', 
  disableTransitionOnChange = false, 
  ...props 
}: ThemeProviderProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <NextThemesProvider 
      enableSystem={enableSystem} 
      attribute={attribute as Attribute} 
      defaultTheme={defaultTheme}
      disableTransitionOnChange={false}
      themes={['light', 'dark', 'system']}
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}