import { describe, it, expect, beforeEach, vi, beforeAll } from 'vitest';
import { Component, DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { LazyLoadImageDirective } from './lazy-load-image.directive';

// Mock IntersectionObserver globally before any tests run
beforeAll(() => {
  (globalThis as any).IntersectionObserver = class IntersectionObserver {
    constructor(public callback: IntersectionObserverCallback, public options?: IntersectionObserverInit) {}
    observe = vi.fn();
    disconnect = vi.fn();
    unobserve = vi.fn();
    takeRecords = vi.fn();
    root = null;
    rootMargin = '';
    thresholds = [];
  };
});

@Component({
  template: `
    <img 
      appLazyLoadImage 
      [src]="imageSrc" 
      [placeholder]="placeholderSrc"
      alt="Test image">
  `,
  standalone: true,
  imports: [LazyLoadImageDirective]
})
class TestComponent {
  imageSrc = 'https://example.com/image.jpg';
  placeholderSrc = 'https://example.com/placeholder.jpg';
}

describe('LazyLoadImageDirective', () => {
  let component: TestComponent;
  let fixture: ComponentFixture<TestComponent>;
  let imgElement: DebugElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestComponent]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    imgElement = fixture.debugElement.query(By.css('img'));
  });

  it('should create', () => {
    expect(imgElement).not.toBeNull();
  });

  describe('Initialization', () => {
    it('should set placeholder image on init', () => {
      const img = imgElement.nativeElement as HTMLImageElement;
      expect(img.src).toContain('placeholder.jpg');
    });

    it('should add lazy-loading class on init', () => {
      const img = imgElement.nativeElement as HTMLImageElement;
      expect(img.classList.contains('lazy-loading')).toBe(true);
    });
  });

  describe('Image loading', () => {
    it('should have placeholder initially', () => {
      const img = imgElement.nativeElement as HTMLImageElement;
      expect(img.src).toContain('placeholder.jpg');
    });
  });

  describe('CSS classes', () => {
    it('should have lazy-loading class initially', () => {
      const img = imgElement.nativeElement as HTMLImageElement;
      expect(img.classList.contains('lazy-loading')).toBe(true);
    });
  });

  describe('Default placeholder', () => {
    it('should use default placeholder when none provided', async () => {
      @Component({
        template: `<img appLazyLoadImage [src]="imageSrc" alt="Test">`,
        standalone: true,
        imports: [LazyLoadImageDirective]
      })
      class TestComponentNoPlaceholder {
        imageSrc = 'https://example.com/image.jpg';
      }

      const testFixture = TestBed.createComponent(TestComponentNoPlaceholder);
      testFixture.detectChanges();

      const img = testFixture.debugElement.query(By.css('img'));
      expect(img.nativeElement.src).toContain('data:image/svg+xml');
    });
  });
});
