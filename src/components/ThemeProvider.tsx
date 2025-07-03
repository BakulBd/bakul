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

export function ThemeProvider({ children, enableSystem = true, attribute = 'class', defaultTheme = 'system', disableTransitionOnChange = false, ...props }: ThemeProviderProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="loading-placeholder">Loading...</div>;
  }

  return (
    <NextThemesProvider 
      enableSystem={enableSystem} 
      attribute={attribute as Attribute} 
      defaultTheme={defaultTheme}
      disableTransitionOnChange={disableTransitionOnChange}
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}