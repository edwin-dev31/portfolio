import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Project } from '../../../../models/project.model';
import { ProjectCardComponent } from '../project-card/project-card.component';

/**
 * ProjectGridComponent
 * 
 * Displays projects in an asymmetric grid layout with responsive behavior.
 * 
 * Features:
 * - Asymmetric grid layout using CSS Grid
 * - Pattern-based grid classes: ['span-2', 'span-1', 'span-1', 'span-2']
 * - TrackBy function for performance optimization
 * - Responsive: 1 column (mobile), 2 columns (tablet), 4 columns (desktop)
 * 
 * @example
 * <app-project-grid 
 *   [projects]="projects" 
 *   (projectClick)="onProjectClick($event)" />
 */
@Component({
  selector: 'app-project-grid',
  standalone: true,
  imports: [CommonModule, ProjectCardComponent],
  templateUrl: './project-grid.component.html',
  styleUrl: './project-grid.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProjectGridComponent {
  /**
   * Array of projects to display
   */
  projects = input.required<Project[]>();

  /**
   * Event emitted when a project card is clicked
   * Emits the project ID
   */
  projectClick = output<string>();

  /**
   * Grid class pattern for asymmetric layout
   * Pattern repeats every 4 items: large, small, small, large
   */
  private readonly gridPattern = ['span-2', 'span-1', 'span-1', 'span-2'];

  /**
   * Get grid class for a project based on its index
   * Implements asymmetric grid pattern
   * 
   * @param index - Project index in the array
   * @returns CSS class for grid span
   */
  getGridClass(index: number): string {
    return this.gridPattern[index % this.gridPattern.length];
  }

  /**
   * TrackBy function for ngFor performance optimization
   * 
   * @param index - Item index
   * @param project - Project item
   * @returns Unique identifier for the project
   */
  trackByProjectId(index: number, project: Project): string {
    return project.id;
  }

  /**
   * Handle project card click
   * 
   * @param projectId - ID of the clicked project
   */
  onProjectClick(projectId: string): void {
    this.projectClick.emit(projectId);
  }
}
