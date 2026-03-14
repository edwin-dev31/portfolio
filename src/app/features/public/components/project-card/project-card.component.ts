import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Project } from '../../../../models/project.model';
import { LazyLoadImageDirective } from '../../../../shared/directives/lazy-load-image.directive';

/**
 * ProjectCardComponent
 * 
 * Displays a project card with title, description, featured image, and hover interactions.
 * 
 * Features:
 * - Displays project title, short description, and featured image
 * - Hover micro-interactions (scale, shadow)
 * - Emits cardClick event when clicked
 * - Uses LazyLoadImageDirective for optimized image loading
 * 
 * @example
 * <app-project-card 
 *   [project]="project" 
 *   (cardClick)="onProjectClick($event)" />
 */
@Component({
  selector: 'app-project-card',
  standalone: true,
  imports: [CommonModule, LazyLoadImageDirective],
  templateUrl: './project-card.component.html',
  styleUrl: './project-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProjectCardComponent {
  /**
   * Project data to display
   */
  project = input.required<Project>();

  /**
   * Event emitted when card is clicked
   * Emits the project ID
   */
  cardClick = output<string>();

  /**
   * Handle card click
   */
  onCardClick(): void {
    this.cardClick.emit(this.project().id);
  }

  /**
   * Handle keyboard interaction (Enter or Space)
   */
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.onCardClick();
    }
  }
}
