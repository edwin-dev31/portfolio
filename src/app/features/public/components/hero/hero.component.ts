import { Component, ChangeDetectionStrategy, computed, inject, OnInit, signal } from '@angular/core';
import { StateService } from '../../../../core/services/state.service';
import { Profile } from '../../../../models/profile.model';

@Component({
  selector: 'app-hero',
  standalone: true,
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeroComponent implements OnInit {
  private readonly stateService = inject(StateService);
  readonly profile = signal<Profile | null>(null);
  readonly isLoading = signal(true);
  readonly imageFailed = signal(false);
  readonly resumeUrl = signal('');
  readonly projectCount = this.stateService.projectCount;
  readonly skillCount = this.stateService.skillCount;
  readonly firstName = computed(() => this.profile()?.name.trim().split(/\s+/)[0] ?? '');
  readonly lastName = computed(() => this.profile()?.name.trim().split(/\s+/).slice(1).join(' ') ?? '');
  readonly isAvailable = computed(() => (this.profile()?.yearAvailable ?? 0) >= new Date().getFullYear());

  ngOnInit(): void {
    void this.loadProfile();
    void this.loadResume();
  }

  async loadProfile(): Promise<void> {
    this.isLoading.set(true);
    this.imageFailed.set(false);
    try {
      await this.stateService.loadProfile();
      this.profile.set(this.stateService.profile());
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  private async loadResume(): Promise<void> {
    try {
      await this.stateService.loadAbout();
      const cvlink = this.stateService.about()?.journey.cvlink?.trim();
      if (cvlink) this.resumeUrl.set(this.normalizeUrl(cvlink));
    } catch (error) {
      console.error('Failed to load resume link:', error);
    }
  }

  normalizeUrl(url: string): string {
    return /^https?:\/\//i.test(url) ? url : `https://${url}`;
  }

  scrollTo(section: string, event: Event): void {
    const target = document.getElementById(section);
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
      block: 'start'
    });
  }
}
