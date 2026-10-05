import { Component, ChangeDetectionStrategy, inject, OnInit, signal, effect, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { StateService } from '../../../../core/services/state.service';
import { Profile } from '../../../../models/profile.model';

interface HeroAnimState {
  greeting: boolean;
  name: boolean;
  title: boolean;
  description: boolean;
  cta: boolean;
  social: boolean;
  photo: boolean;
}

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [],
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeroComponent implements OnInit {
  private stateService = inject(StateService);
  private platformId = inject(PLATFORM_ID);

  profile = signal<Profile | null>(null);
  isLoading = signal(true);
  animState = signal<HeroAnimState>({
    greeting: false,
    name: false,
    title: false,
    description: false,
    cta: false,
    social: false,
    photo: false,
  });
  scrollY = signal(0);

  ngOnInit(): void {
    this.loadProfile();
    if (isPlatformBrowser(this.platformId)) {
      this.setupParallax();
    }
  }

  private async loadProfile(): Promise<void> {
    try {
      await this.stateService.loadProfile();
      this.profile.set(this.stateService.profile());
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      this.isLoading.set(false);
      this.triggerEntranceAnimation();
    }
  }

  private triggerEntranceAnimation(): void {
    const delays = [0, 100, 200, 300, 400, 500, 600];
    const keys: (keyof HeroAnimState)[] = ['greeting', 'name', 'title', 'description', 'cta', 'social', 'photo'];

    keys.forEach((key, index) => {
      setTimeout(() => {
        this.animState.update(state => ({ ...state, [key]: true }));
      }, delays[index]);
    });
  }

  private setupParallax(): void {
    let ticking = false;
    const handleScroll = () => {
      this.scrollY.set(window.scrollY);
      ticking = false;
    };

    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(handleScroll);
        ticking = true;
      }
    }, { passive: true });
  }

  scrollToProjects(): void {
    const projectsSection = document.getElementById('projects');
    if (projectsSection) {
      projectsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  scrollToContact(): void {
    const contactSection = document.getElementById('contact');
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}