import { Component, ChangeDetectionStrategy, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StateService } from '../../../../core/services/state.service';
import { Profile } from '../../../../models/profile.model';

/**
 * HeroComponent
 * 
 * Displays the hero section on the home page with portfolio name, title, tagline,
 * animated gradient background, and scroll-down indicator.
 * 
 * Features:
 * - Displays portfolio information from Profile model
 * - Animated gradient background
 * - Scroll-down indicator with smooth scroll
 * - Fully responsive with mobile-first approach
 * 
 * @example
 * <app-hero />
 */
@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeroComponent implements OnInit {
  private stateService = inject(StateService);
  
  profile = signal<Profile | null>(null);
  isLoading = signal(true);

  ngOnInit(): void {
    this.loadProfile();
  }

  private async loadProfile(): Promise<void> {
    try {
      await this.stateService.loadProfile();
      this.profile.set(this.stateService.profile());
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Smooth scroll to the next section
   */
  scrollToProjects(): void {
    const projectsSection = document.getElementById('projects');
    if (projectsSection) {
      projectsSection.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  }
}
