import { Component, ChangeDetectionStrategy, inject, OnInit, signal, input, output, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StateService } from '../../../../core/services/state.service';
import { SeoService } from '../../../../core/services/seo.service';
import { Project } from '../../../../models/project.model';

/**
 * ProjectDetailComponent
 * 
 * Displays detailed information about a single project including images,
 * description, tools, and links.
 * 
 * Features:
 * - Loads project by ID from route params
 * - Loads project by ID from route params
 * - Displays full project information
 * - Back navigation to home
 * - Handles project not found with error message
 * - Implements OnPush change detection strategy
 * 
 * Requirements: 8.6
 * 
 * @example
 * <app-project-detail />
 */
@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './project-detail.component.html',
  styleUrl: './project-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProjectDetailComponent implements OnInit, OnChanges {
  private stateService = inject(StateService);
  private seoService = inject(SeoService);

  /**
   * Project ID input
   */
  projectId = input.required<string>();

  /**
   * Close modal output
   */
  close = output<void>();

  /**
   * Current project being displayed
   */
  project = signal<Project | null>(null);

  /**
   * Loading state
   */
  isLoading = signal(true);

  /**
   * Error state for project not found
   */
  notFound = signal(false);

  ngOnInit(): void {
    this.loadProject();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['projectId'] && !changes['projectId'].isFirstChange()) {
      this.loadProject();
    }
  }

  /**
   * Load project from route params
   */
  private async loadProject(): Promise<void> {
    const projectId = this.projectId();
    
    if (!projectId) {
      this.notFound.set(true);
      this.isLoading.set(false);
      return;
    }

    try {
      // Load projects if not already loaded
      if (this.stateService.projects().length === 0) {
        await this.stateService.loadProjects();
      }

      // Find project by ID
      const foundProject = this.stateService.projects().find(p => p.id === projectId);
      
      if (foundProject) {
        this.project.set(foundProject);
        this.stateService.selectProject(projectId);
        this.seoService.updateMetaTags({
          title: foundProject.title,
          description: foundProject.description,
          image: foundProject.image,
          url: window.location.href,
          type: 'article'
        });
        this.seoService.updateCanonicalUrl(window.location.href);
        this.seoService.updateStructuredData({
          '@context': 'https://schema.org',
          '@type': 'CreativeWork',
          name: foundProject.title,
          description: foundProject.description,
          image: foundProject.image,
          url: window.location.href
        });
      } else {
        this.notFound.set(true);
      }
    } catch (error) {
      console.error('Failed to load project:', error);
      this.notFound.set(true);
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Handle escape key to close modal
   * @param event - Keyboard event
   */
  onEscapeKey(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.goBack();
    }
  }

  /**
   * Close the modal
   */
  goBack(): void {
    this.close.emit();
  }

  /**
   * Open external link
   * @param url - URL to open
   */
  openLink(url: string): void {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }
}
