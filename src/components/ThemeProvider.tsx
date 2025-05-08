'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider, Attribute } from 'next-themes';
import { useEffect, useState } from 'react';

interface ThemeProviderProps {
  children: React.ReactNode;
  enableSystem?: boolean;
  attribute?: string;
}

export function ThemeProvider({ children, enableSystem = true, attribute = 'class', ...props }: ThemeProviderProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="loading-placeholder">Loading...</div>;
  }

  return (
    <NextThemesProvider enableSystem={enableSystem} attribute={attribute as Attribute} {...props}>
      {children}
    </NextThemesProvider>
  );
}