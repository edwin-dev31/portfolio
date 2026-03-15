import { Component, ChangeDetectionStrategy, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
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
 * - Displays full project information
 * - Image lightbox for full-size viewing
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
export class ProjectDetailComponent implements OnInit {
  private stateService = inject(StateService);
  private seoService = inject(SeoService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

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

  /**
   * Lightbox state
   */
  lightboxOpen = signal(false);
  lightboxImage = signal<string>('');

  ngOnInit(): void {
    this.loadProject();
  }

  /**
   * Load project from route params
   */
  private async loadProject(): Promise<void> {
    const projectId = this.route.snapshot.paramMap.get('id');
    
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
   * Open image in lightbox
   * @param imageUrl - URL of the image to display
   */
  openLightbox(imageUrl: string): void {
    this.lightboxImage.set(imageUrl);
    this.lightboxOpen.set(true);
    // Prevent body scroll when lightbox is open
    document.body.style.overflow = 'hidden';
  }

  /**
   * Close lightbox
   */
  closeLightbox(): void {
    this.lightboxOpen.set(false);
    this.lightboxImage.set('');
    // Restore body scroll
    document.body.style.overflow = '';
  }

  /**
   * Handle lightbox backdrop click
   * @param event - Mouse event
   */
  onLightboxBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closeLightbox();
    }
  }

  /**
   * Handle escape key to close lightbox
   * @param event - Keyboard event
   */
  onEscapeKey(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.lightboxOpen()) {
      this.closeLightbox();
    }
  }

  /**
   * Navigate back to home
   */
  goBack(): void {
    this.router.navigate(['/']);
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
