import { Directive, ElementRef, input, OnInit, OnDestroy, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appLazyLoadImage]',
  standalone: true
})
export class LazyLoadImageDirective implements OnInit, OnDestroy {
  
  placeholder = input<string>('data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%23ddd" width="400" height="300"/%3E%3C/svg%3E');

  private observer?: IntersectionObserver;
  private originalSrc?: string;

  constructor(
    private el: ElementRef<HTMLImageElement>,
    private renderer: Renderer2
  ) {}

  ngOnInit(): void {
    
    this.originalSrc = this.el.nativeElement.src;
    this.renderer.setAttribute(this.el.nativeElement, 'src', this.placeholder());
    
    
    this.renderer.addClass(this.el.nativeElement, 'lazy-loading');

    
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.loadImage();
          }
        });
      },
      {
        rootMargin: '50px' 
      }
    );

    
    this.observer.observe(this.el.nativeElement);
  }

  ngOnDestroy(): void {
    
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  
  private loadImage(): void {
    if (!this.originalSrc) return;

    const img = new Image();
    
    img.onload = () => {
      this.renderer.setAttribute(this.el.nativeElement, 'src', this.originalSrc!);
      this.renderer.removeClass(this.el.nativeElement, 'lazy-loading');
      this.renderer.addClass(this.el.nativeElement, 'lazy-loaded');
      
      
      if (this.observer) {
        this.observer.disconnect();
      }
    };

    img.onerror = () => {
      this.renderer.removeClass(this.el.nativeElement, 'lazy-loading');
      this.renderer.addClass(this.el.nativeElement, 'lazy-error');
      
      
      
      if (this.observer) {
        this.observer.disconnect();
      }
    };

    img.src = this.originalSrc;
  }
}
