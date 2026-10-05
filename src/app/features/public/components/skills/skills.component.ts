import {
  AfterViewInit, ChangeDetectionStrategy, Component, DestroyRef, ElementRef,
  HostListener, inject, NgZone, OnInit, QueryList, ViewChildren, computed, signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { StateService } from '../../../../core/services/state.service';
import { TECH_COLORS } from '../../../../models';

@Component({
  selector: 'app-skills',
  standalone: true,
  templateUrl: './skills.component.html',
  styleUrl: './skills.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SkillsComponent implements OnInit, AfterViewInit {
  private readonly stateService = inject(StateService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly zone = inject(NgZone);
  private animationFrame = 0;

  readonly skills = this.stateService.skills;
  readonly isLoading = this.stateService.isLoadingSkills;
  readonly isPaused = signal(false);
  readonly rows = computed(() => {
    const skills = this.skills();
    if (!skills.length) return [];
    const rowCount = Math.ceil(skills.length / 10);
    const size = Math.ceil(skills.length / rowCount);
    return Array.from({ length: rowCount }, (_, index) => ({
      items: skills.slice(index * size, (index + 1) * size),
      direction: index % 2 === 0 ? 'left' : 'right'
    }));
  });

  @ViewChildren('track') private tracks!: QueryList<ElementRef<HTMLElement>>;

  constructor() {
    this.destroyRef.onDestroy(() => cancelAnimationFrame(this.animationFrame));
  }

  ngOnInit(): void {
    void this.stateService.loadSkills().catch(error => console.error('Failed to load skills:', error));
  }

  ngAfterViewInit(): void {
    this.tracks.changes.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.setupTracks());
    this.setupTracks();
  }

  @HostListener('window:resize')
  setupTracks(): void {
    this.zone.runOutsideAngular(() => {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = requestAnimationFrame(() => {
        this.tracks?.forEach(({ nativeElement: track }) => {
          track.querySelectorAll('.clone-set').forEach(clone => clone.remove());
          const cards = Array.from(track.children) as HTMLElement[];
          if (!cards.length) return;
          const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
          // Include the gap between sets so each loop lands on the next identical card.
          const setWidth = cards.reduce((width, card) => width + card.offsetWidth + gap, 0);
          const viewportWidth = track.parentElement?.clientWidth ?? window.innerWidth;
          const copies = Math.ceil(viewportWidth / setWidth) + 1;
          for (let index = 0; index < copies; index++) {
            const clone = document.createElement('div');
            clone.className = 'clone-set';
            clone.style.display = 'contents';
            clone.setAttribute('aria-hidden', 'true');
            cards.forEach(card => clone.appendChild(card.cloneNode(true)));
            track.appendChild(clone);
          }
          track.style.setProperty('--set-width', `${setWidth}px`);
        });
      });
    });
  }

  toggleMotion(): void {
    this.isPaused.update(paused => !paused);
  }

  displayName(name: string): string {
    const names: Record<string, string> = {
      javascript: 'JavaScript', typescript: 'TypeScript', linux: 'Linux', python: 'Python',
      csharp: 'C#', angular: 'Angular', css3: 'CSS3', tailwindcss: 'Tailwind CSS'
    };
    return names[name.toLowerCase()] ?? name;
  }

  getDeviconClass(name: string): string {
    const normalized = name.toLowerCase().replace(/\./g, '').replace(/\s+/g, '').replace(/#/g, 'sharp').replace(/\+\+/g, 'plusplus');
    return `devicon-${normalized}-plain colored`;
  }

  getBrandColor(name: string): string {
    return TECH_COLORS[name.toLowerCase()] ?? 'var(--portfolio-accent)';
  }
}
