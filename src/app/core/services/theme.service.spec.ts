import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  let service: ThemeService;
  let localStorageMock: { [key: string]: string };

  beforeEach(() => {
    // Mock localStorage
    localStorageMock = {};
    
    global.localStorage = {
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

    // Mock document.documentElement.setAttribute
    global.document = {
      documentElement: {
        setAttribute: vi.fn()
      }
    } as any;

    // Mock window.matchMedia
    global.window = {
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

  /**
   * **Validates: Requirements 2.2**
   * 
   * Property 2: Theme Persistence Round Trip
   * 
   * This property test verifies that any theme value ('light' or 'dark')
   * can be set, persisted to localStorage, and restored correctly.
   * 
   * The test ensures:
   * 1. Any valid theme value can be set
   * 2. The theme is correctly persisted to localStorage
   * 3. The theme can be restored from localStorage
   * 4. The round-trip property holds for all valid theme values
   */
  it('Property 2: Theme Persistence Round Trip - any theme value persists and restores correctly', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('light' as const, 'dark' as const),
        (theme) => {
          // Clear localStorage before each test
          localStorageMock = {};
          
          // Create a new service instance (simulating app initialization)
          service = new ThemeService();
          
          // Set the theme
          service.setTheme(theme);
          
          // Verify theme is persisted to localStorage
          expect(localStorage.setItem).toHaveBeenCalledWith('theme', theme);
          expect(localStorageMock['theme']).toBe(theme);
          
          // Verify theme signal is updated
          expect(service.currentTheme()).toBe(theme);
          
          // Verify DOM attribute is set
          expect(document.documentElement.setAttribute).toHaveBeenCalledWith('data-theme', theme);
          
          // Simulate app restart by creating a new service instance
          // This should restore the theme from localStorage
          const newService = new ThemeService();
          
          // Verify the theme was restored correctly
          expect(localStorage.getItem).toHaveBeenCalledWith('theme');
          expect(newService.currentTheme()).toBe(theme);
          
          // Round-trip property: the restored theme should match the original
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
