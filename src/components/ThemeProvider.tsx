'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider, Attribute } from 'next-themes';

type ThemeProviderProps = {
  children: React.ReactNode;
  enableSystem?: boolean;
  attribute?: Attribute | string;
  defaultTheme?: string;
  disableTransitionOnChange?: boolean;
};

export function ThemeProvider({
  children,
  enableSystem = true,
  attribute = 'class',
  defaultTheme = 'dark',
  disableTransitionOnChange = true,
  ...props
}: ThemeProviderProps) {
  return (
    <NextThemesProvider
      enableSystem={enableSystem}
      attribute={attribute as Attribute}
      defaultTheme={defaultTheme}
      disableTransitionOnChange={disableTransitionOnChange}
      themes={['light', 'dark']}
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}