import {
  Component, ChangeDetectionStrategy, inject, OnInit,
  signal, computed, AfterViewInit, ElementRef, ViewChildren, QueryList, NgZone
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../../../../core/services/data.service';
import { Skill, TECH_COLORS } from '../../../../models';

interface CarouselRow {
  items: Skill[];
  direction: 'left' | 'right';
}

const ROW_SIZE = 10;

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
    const totalRows = Math.ceil(all.length / ROW_SIZE);
    const itemsPerRow = Math.ceil(all.length / totalRows);
    const rows: CarouselRow[] = [];
    
    for (let i = 0; i < all.length; i += itemsPerRow) {
      const items = all.slice(i, i + itemsPerRow);
      rows.push({
        items,
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
    return TECH_COLORS[name.toLowerCase()] ?? 'var(--color-primary)';
  }
}
