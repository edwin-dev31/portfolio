import { Component, ChangeDetectionStrategy, input, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Project } from '../../../../models/project.model';
import { ProjectCardComponent } from '../project-card/project-card.component';

/**
 * ProjectGridComponent
 * 
 * Displays projects in a responsive grid layout.
 * 
 * Features:
 * - Responsive: 1 column (mobile), 2 columns (tablet), 3 columns (desktop)
 * - "See More / See Less" functionalilty for large project lists
 * - TrackBy function for performance optimization
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
   * Initial number of projects to show
   */
  private readonly initialLimit = 3;

  /**
   * Step for loading more projects
   */
  private readonly loadStep = 3;

  /**
   * Current number of visible projects
   */
  visibleLimit = signal(this.initialLimit);

  /**
   * Projects to display based on the current limit
   */
  displayedProjects = computed(() => {
    return this.projects().slice(0, this.visibleLimit());
  });

  /**
   * Whether more projects can be shown
   */
  canShowMore = computed(() => {
    return this.visibleLimit() < this.projects().length;
  });

  /**
   * Whether we can return to the initial view
   */
  canShowLess = computed(() => {
    return this.visibleLimit() > this.initialLimit;
  });

  /**
   * Increase the number of visible projects
   */
  showMore(): void {
    this.visibleLimit.update(limit => limit + this.loadStep);
  }

  /**
   * Reset to the initial number of visible projects
   */
  showLess(): void {
    this.visibleLimit.set(this.initialLimit);
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
