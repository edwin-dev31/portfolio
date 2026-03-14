import { Injectable, signal } from '@angular/core';

/**
 * ThemeService manages the application theme (light/dark mode)
 * with localStorage persistence and system preference detection.
 */
@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private themeSignal = signal<'light' | 'dark'>('dark');
  
  /**
   * Readonly signal exposing the current theme
   */
  currentTheme = this.themeSignal.asReadonly();

  constructor() {
    this.initializeTheme();
  }

  /**
   * Initialize theme from localStorage or system preference
   */
  initializeTheme(): void {
    // 1. Check localStorage
    const saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark') {
      this.setTheme(saved);
      return;
    }
    
    // 2. Check system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    this.setTheme(prefersDark ? 'dark' : 'light');
  }

  /**
   * Set the theme and persist to localStorage
   * @param theme - The theme to set ('light' or 'dark')
   */
  setTheme(theme: 'light' | 'dark'): void {
    this.themeSignal.set(theme);
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }

  /**
   * Toggle between light and dark themes
   */
  toggleTheme(): void {
    const newTheme = this.currentTheme() === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
  }
}
