import { Directive, ElementRef, input, OnInit, OnDestroy, Renderer2 } from '@angular/core';

/**
 * LazyLoadImageDirective
 * 
 * A directive that implements lazy loading for images using IntersectionObserver.
 * Images are loaded when they are about to enter the viewport (50px before).
 * Provides error handling and CSS classes for loaded/error states.
 * 
 * @example
 * <img 
 *   appLazyLoadImage 
 *   [src]="imageUrl" 
 *   [placeholder]="placeholderUrl"
 *   alt="Description">
 */
@Directive({
  selector: '[appLazyLoadImage]',
  standalone: true
})
export class LazyLoadImageDirective implements OnInit, OnDestroy {
  /**
   * Placeholder image URL to show while loading
   */
  placeholder = input<string>('data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%23ddd" width="400" height="300"/%3E%3C/svg%3E');

  private observer?: IntersectionObserver;
  private originalSrc?: string;

  constructor(
    private el: ElementRef<HTMLImageElement>,
    private renderer: Renderer2
  ) {}

  ngOnInit(): void {
    // Store original src and set placeholder
    this.originalSrc = this.el.nativeElement.src;
    this.renderer.setAttribute(this.el.nativeElement, 'src', this.placeholder());
    
    // Add loading class
    this.renderer.addClass(this.el.nativeElement, 'lazy-loading');

    // Create intersection observer
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.loadImage();
          }
        });
      },
      {
        rootMargin: '50px' // Start loading 50px before entering viewport
      }
    );

    // Start observing
    this.observer.observe(this.el.nativeElement);
  }

  ngOnDestroy(): void {
    // Disconnect observer
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  /**
   * Load the actual image
   */
  private loadImage(): void {
    if (!this.originalSrc) return;

    const img = new Image();
    
    img.onload = () => {
      this.renderer.setAttribute(this.el.nativeElement, 'src', this.originalSrc!);
      this.renderer.removeClass(this.el.nativeElement, 'lazy-loading');
      this.renderer.addClass(this.el.nativeElement, 'lazy-loaded');
      
      // Disconnect observer after loading
      if (this.observer) {
        this.observer.disconnect();
      }
    };

    img.onerror = () => {
      this.renderer.removeClass(this.el.nativeElement, 'lazy-loading');
      this.renderer.addClass(this.el.nativeElement, 'lazy-error');
      
      // Keep placeholder on error
      // Disconnect observer after error
      if (this.observer) {
        this.observer.disconnect();
      }
    };

    img.src = this.originalSrc;
  }
}
