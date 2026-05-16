import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { StateService } from '../../../../core/services/state.service';
import { DataService } from '../../../../core/services/data.service';
import { Project } from '../../../../models';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ModalComponent, ButtonComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnInit {
  private stateService = inject(StateService);
  private dataService = inject(DataService);
  private router = inject(Router);

  
  projects = this.stateService.projects;
  isLoading = this.stateService.isLoadingProjects;
  
  
  
  
  publishedCount = computed(() => this.projects().length);
  draftCount = computed(() => 0);
  
  
  showDeleteModal = signal(false);
  projectToDelete = signal<Project | null>(null);
  isDeleting = signal(false);

  ngOnInit(): void {
    this.loadProjects();
  }

  
  private async loadProjects(): Promise<void> {
    try {
      await this.stateService.loadProjects();
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  }

  
  createNewProject(): void {
    this.router.navigate(['/admin/projects/new']);
  }

  
  editProject(projectId: string): void {
    this.router.navigate(['/admin/projects', projectId, 'edit']);
  }

  
  confirmDelete(project: Project): void {
    this.projectToDelete.set(project);
    this.showDeleteModal.set(true);
  }

  
  cancelDelete(): void {
    this.showDeleteModal.set(false);
    this.projectToDelete.set(null);
  }

  
  async deleteProject(): Promise<void> {
    const project = this.projectToDelete();
    if (!project) return;

    this.isDeleting.set(true);
    try {
      await this.dataService.deleteProject(project.id);
      await this.stateService.deleteProject(project.id);
      this.showDeleteModal.set(false);
      this.projectToDelete.set(null);
    } catch (error) {
      console.error('Error deleting project:', error);
      alert('Error deleting project. Please try again.');
    } finally {
      this.isDeleting.set(false);
    }
  }

  
  async togglePublishStatus(project: Project): Promise<void> {
    
    console.warn('Toggle publish status not implemented - Project model needs status field');
    alert('This feature will be available soon');
  }

  
  getStatusBadgeClass(project: Project): string {
    
    return 'badge--published';
  }

  
  getStatusText(project: Project): string {
    
    return 'Published';
  }
}
