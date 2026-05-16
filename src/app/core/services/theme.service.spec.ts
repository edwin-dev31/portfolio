import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  let service: ThemeService;
  let localStorageMock: { [key: string]: string };

  beforeEach(() => {
    
    localStorageMock = {};
    
    globalThis.localStorage = {
      getItem: vi.fn((key: string) => localStorageMock[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        localStorageMock[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete localStorageMock[key];
      }),
      clear: vi.fn(() => {
        localStorageMock = {};
      }),
      length: 0,
      key: vi.fn()
    } as Storage;

    
    globalThis.document = {
      documentElement: {
        setAttribute: vi.fn()
      }
    } as any;

    
    globalThis.window = {
      matchMedia: vi.fn(() => ({
        matches: false,
        media: '',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn()
      }))
    } as any;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  
  it('Property 2: Theme Persistence Round Trip - any theme value persists and restores correctly', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('light' as const, 'dark' as const),
        (theme) => {
          
          localStorageMock = {};
          
          
          service = new ThemeService();
          
          
          service.setTheme(theme);
          
          
          expect(localStorage.setItem).toHaveBeenCalledWith('theme', theme);
          expect(localStorageMock['theme']).toBe(theme);
          
          
          expect(service.currentTheme()).toBe(theme);
          
          
          expect(document.documentElement.setAttribute).toHaveBeenCalledWith('data-theme', theme);
          
          
          
          const newService = new ThemeService();
          
          
          expect(localStorage.getItem).toHaveBeenCalledWith('theme');
          expect(newService.currentTheme()).toBe(theme);
          
          
          return newService.currentTheme() === theme;
        }
      ),
      {
        numRuns: 100,
        verbose: true
      }
    );
  });
});
