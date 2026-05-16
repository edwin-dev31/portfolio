import { Component, ChangeDetectionStrategy, input, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Project } from '../../../../models/project.model';
import { ProjectCardComponent } from '../project-card/project-card.component';

@Component({
  selector: 'app-project-grid',
  standalone: true,
  imports: [CommonModule, ProjectCardComponent],
  templateUrl: './project-grid.component.html',
  styleUrl: './project-grid.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProjectGridComponent {
  
  projects = input.required<Project[]>();

  
  projectClick = output<string>();

  
  private readonly initialLimit = 3;

  
  private readonly loadStep = 3;

  
  visibleLimit = signal(this.initialLimit);

  
  displayedProjects = computed(() => {
    return this.projects().slice(0, this.visibleLimit());
  });

  
  canShowMore = computed(() => {
    return this.visibleLimit() < this.projects().length;
  });

  
  canShowLess = computed(() => {
    return this.visibleLimit() > this.initialLimit;
  });

  
  showMore(): void {
    this.visibleLimit.update(limit => limit + this.loadStep);
  }

  
  showLess(): void {
    this.visibleLimit.set(this.initialLimit);
  }

  
  trackByProjectId(index: number, project: Project): string {
    return project.id;
  }

  
  onProjectClick(projectId: string): void {
    this.projectClick.emit(projectId);
  }
}
