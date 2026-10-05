import { Component, HostListener, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ThemeToggleComponent } from '../theme-toggle/theme-toggle.component';

interface NavItem {
  label: string;
  fragment: string;
  icon?: string;
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, ThemeToggleComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  readonly isScrolled = signal(false);
  readonly isMobileMenuOpen = signal(false);
  readonly activeSection = signal<string>('hero');
  readonly scrollProgress = signal(0);

  readonly navItems: NavItem[] = [
    { label: 'Home', fragment: 'hero' },
    { label: 'Skills', fragment: 'skills' },
    { label: 'Projects', fragment: 'projects' },
    { label: 'Contact', fragment: 'contact' },
  ];

  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    const scrollY = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    this.isScrolled.set(scrollY > 20);
    this.scrollProgress.set(docHeight > 0 ? (scrollY / docHeight) * 100 : 0);
    this.updateActiveSection();
  }

  @HostListener('window:resize', [])
  onResize(): void {
    if (window.innerWidth > 768 && this.isMobileMenuOpen()) {
      this.isMobileMenuOpen.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.isMobileMenuOpen()) {
      this.closeMobileMenu();
      document.querySelector<HTMLButtonElement>('.header__mobile-toggle')?.focus();
    }
  }

  private updateActiveSection(): void {
    const sections = ['hero', 'skills', 'projects', 'contact'];
    const scrollY = window.scrollY + 100;

    for (const section of sections) {
      const element = document.getElementById(section);
      if (element) {
        const offsetTop = element.getBoundingClientRect().top + window.scrollY;
        const offsetHeight = element.offsetHeight;
        if (scrollY >= offsetTop && scrollY < offsetTop + offsetHeight) {
          this.activeSection.set(section);
          break;
        }
      }
    }
  }

  scrollTo(fragment: string): void {
    const element = document.getElementById(fragment);
    if (element) {
      element.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
        block: 'start'
      });
      this.isMobileMenuOpen.set(false);
      this.activeSection.set(fragment);
    }
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen.update(v => !v);
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen.set(false);
  }
}
