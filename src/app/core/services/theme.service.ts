import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private themeSignal = signal<'light' | 'dark'>('dark');
  
  
  currentTheme = this.themeSignal.asReadonly();

  constructor() {
    this.initializeTheme();
  }

  
  initializeTheme(): void {
    
    const saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark') {
      this.setTheme(saved);
      return;
    }
    
    
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    this.setTheme(prefersDark ? 'dark' : 'light');
  }

  
  setTheme(theme: 'light' | 'dark'): void {
    this.themeSignal.set(theme);
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }

  
  toggleTheme(): void {
    const newTheme = this.currentTheme() === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
  }
}
