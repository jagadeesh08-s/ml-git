
import React, { useEffect } from 'react';

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: 'light' | 'dark';
};

export function ThemeProvider({ children, defaultTheme = 'light' }: ThemeProviderProps) {
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const theme = savedTheme || defaultTheme;
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
  }, [defaultTheme]);

  const setTheme = (theme: 'light' | 'dark') => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
    localStorage.setItem('theme', theme);
  };

  // Optionally, you can provide setTheme via context if needed

  return <>{children}</>;
}
