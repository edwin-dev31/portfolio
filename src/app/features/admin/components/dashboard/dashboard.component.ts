import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { StateService } from '../../../../core/services/state.service';
import { DataService } from '../../../../core/services/data.service';
import { Project } from '../../../../models';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';

/**
 * DashboardComponent
 * 
 * Admin dashboard displaying project statistics and management interface.
 * Provides quick actions for editing, deleting, and managing projects.
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */
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

  // State signals
  projects = this.stateService.projects;
  isLoading = this.stateService.isLoadingProjects;
  
  // Computed signals for statistics
  // Note: Current Project model doesn't have status field
  // These are placeholders for future implementation
  publishedCount = computed(() => this.projects().length);
  draftCount = computed(() => 0);
  
  // Modal state
  showDeleteModal = signal(false);
  projectToDelete = signal<Project | null>(null);
  isDeleting = signal(false);

  ngOnInit(): void {
    this.loadProjects();
  }

  /**
   * Load all projects
   */
  private async loadProjects(): Promise<void> {
    try {
      await this.stateService.loadProjects();
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  }

  /**
   * Navigate to project editor for creating new project
   */
  createNewProject(): void {
    this.router.navigate(['/admin/projects/new']);
  }

  /**
   * Navigate to project editor for editing existing project
   * @param projectId - ID of project to edit
   */
  editProject(projectId: string): void {
    this.router.navigate(['/admin/projects/edit', projectId]);
  }

  /**
   * Open delete confirmation modal
   * @param project - Project to delete
   */
  confirmDelete(project: Project): void {
    this.projectToDelete.set(project);
    this.showDeleteModal.set(true);
  }

  /**
   * Close delete confirmation modal
   */
  cancelDelete(): void {
    this.showDeleteModal.set(false);
    this.projectToDelete.set(null);
  }

  /**
   * Delete the selected project
   */
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
      alert('Error al eliminar el proyecto. Por favor intenta de nuevo.');
    } finally {
      this.isDeleting.set(false);
    }
  }

  /**
   * Toggle publish status of a project
   * Note: Current Project model doesn't have status field
   * This is a placeholder for future implementation
   * @param project - Project to toggle status
   */
  async togglePublishStatus(project: Project): Promise<void> {
    // Placeholder - Project model doesn't have status field yet
    console.warn('Toggle publish status not implemented - Project model needs status field');
    alert('Esta funcionalidad estará disponible próximamente');
  }

  /**
   * Get badge class based on project status
   * Note: Current Project model doesn't have status field
   * This is a placeholder for future implementation
   * @param project - Project to get badge for
   */
  getStatusBadgeClass(project: Project): string {
    // Placeholder - all projects are considered published for now
    return 'badge--published';
  }

  /**
   * Get status text for project
   * Note: Current Project model doesn't have status field
   * This is a placeholder for future implementation
   * @param project - Project to get status for
   */
  getStatusText(project: Project): string {
    // Placeholder - all projects are considered published for now
    return 'Publicado';
  }
}
