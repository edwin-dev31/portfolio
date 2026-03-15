import {
  Component, ChangeDetectionStrategy, inject, OnInit,
  signal, computed, AfterViewInit, ElementRef, ViewChildren, QueryList, NgZone
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../../../../core/services/data.service';
import { Skill } from '../../../../models/skill.model';

interface CarouselRow {
  items: Skill[];
  direction: 'left' | 'right';
}

const ROW_SIZE = 7;

/** Brand colors per technology name (lowercase) */
const BRAND_COLORS: Record<string, string> = {
  'angular':        '#dd0031',
  'react':          '#61dafb',
  'vue':            '#42b883',
  'typescript':     '#3178c6',
  'javascript':     '#f7df1e',
  'node.js':        '#339933',
  'nodejs':         '#339933',
  'python':         '#3776ab',
  'java':           '#f89820',
  'kotlin':         '#7f52ff',
  'swift':          '#f05138',
  'go':             '#00add8',
  'rust':           '#ce422b',
  'docker':         '#2496ed',
  'kubernetes':     '#326ce5',
  'postgresql':     '#336791',
  'mysql':          '#4479a1',
  'mongodb':        '#47a248',
  'redis':          '#dc382d',
  'graphql':        '#e10098',
  'git':            '#f05032',
  'linux':          '#fcc624',
  'aws':            '#ff9900',
  'firebase':       '#ffca28',
  'figma':          '#f24e1e',
  'sass':           '#cc6699',
  'scss':           '#cc6699',
  'tailwind':       '#06b6d4',
  'tailwindcss':    '#06b6d4',
  'spring':         '#6db33f',
  'springboot':     '#6db33f',
  'django':         '#092e20',
  'flutter':        '#02569b',
  'dart':           '#0175c2',
  'c#':             '#239120',
  'csharp':         '#239120',
  'c++':            '#00599c',
  'cplusplus':      '#00599c',
  'html5':          '#e34f26',
  'html':           '#e34f26',
  'css3':           '#1572b6',
  'css':            '#1572b6',
  'nextjs':         '#ffffff',
  'next.js':        '#ffffff',
  'nuxt':           '#00dc82',
  'svelte':         '#ff3e00',
  'terraform':      '#7b42bc',
  'nginx':          '#009639',
  'jenkins':        '#d33833',
};

@Component({
  selector: 'app-skills',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './skills.component.html',
  styleUrl: './skills.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SkillsComponent implements OnInit, AfterViewInit {
  private dataService = inject(DataService);
  private zone = inject(NgZone);

  skills = signal<Skill[]>([]);
  isLoading = signal(true);

  rows = computed<CarouselRow[]>(() => {
    const all = this.skills();
    const rows: CarouselRow[] = [];
    for (let i = 0; i < all.length; i += ROW_SIZE) {
      rows.push({
        items: all.slice(i, i + ROW_SIZE),
        direction: rows.length % 2 === 0 ? 'left' : 'right'
      });
    }
    return rows;
  });

  @ViewChildren('track') trackEls!: QueryList<ElementRef<HTMLElement>>;

  ngOnInit(): void {
    this.dataService.getSkills().subscribe({
      next: (skills) => {
        this.skills.set(skills);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  ngAfterViewInit(): void {
    this.trackEls.changes.subscribe(() => this.setupTracks());
    this.setupTracks();
  }

  private setupTracks(): void {
    this.zone.runOutsideAngular(() => {
      requestAnimationFrame(() => {
        const viewportW = window.innerWidth;
        this.trackEls.forEach((ref) => {
          const track = ref.nativeElement;
          track.querySelectorAll('.clone-set').forEach(el => el.remove());
          const originalCards = Array.from(track.children) as HTMLElement[];
          if (!originalCards.length) return;
          const setWidth = track.scrollWidth;
          const copies = Math.ceil(viewportW / setWidth) + 1;
          for (let c = 0; c < copies; c++) {
            const clone = document.createElement('div');
            clone.className = 'clone-set';
            clone.style.display = 'contents';
            originalCards.forEach(card => clone.appendChild(card.cloneNode(true)));
            track.appendChild(clone);
          }
          track.style.setProperty('--set-width', `${setWidth}px`);
        });
      });
    });
  }

  getDeviconClass(name: string): string {
    const normalized = name
      .toLowerCase()
      .replace(/\./g, '')
      .replace(/\s+/g, '')
      .replace(/#/g, 'sharp')
      .replace(/\+\+/g, 'plusplus');
    return `devicon-${normalized}-plain colored`;
  }

  /** Returns the brand color for a skill, falls back to primary */
  getBrandColor(name: string): string {
    return BRAND_COLORS[name.toLowerCase()] ?? 'var(--color-primary)';
  }
}
