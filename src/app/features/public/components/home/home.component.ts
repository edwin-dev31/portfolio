import { Component, ChangeDetectionStrategy, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StateService } from '../../../../core/services/state.service';
import { SeoService } from '../../../../core/services/seo.service';
import { HeroComponent } from '../hero/hero.component';
import { ProjectGridComponent } from '../project-grid/project-grid.component';
import { ContactComponent } from '../contact/contact.component';
import { Router } from '@angular/router';

/**
 * HomeComponent
 * 
 * Main public page that composes the hero section, project grid, and contact section.
 * 
 * Features:
 * - Composes HeroComponent, ProjectGridComponent, and ContactComponent
 * - Loads projects on initialization
 * - Uses publishedProjects computed signal for display
 * - Shows loading state while projects load
 * - Implements OnPush change detection strategy
 * - Handles project navigation
 * 
 * Requirements: 1.1, 1.4, 10.5
 * 
 * @example
 * <app-home />
 */
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    HeroComponent,
    ProjectGridComponent,
    ContactComponent
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent implements OnInit {
  private stateService = inject(StateService);
  private seoService = inject(SeoService);
  private router = inject(Router);

  /**
   * Published projects from state service
   * Uses computed signal for reactive updates
   */
  projects = this.stateService.publishedProjects;

  /**
   * Loading state for projects
   */
  isLoading = this.stateService.isLoadingProjects;

  ngOnInit(): void {
    this.seoService.updateMetaTags({
      title: 'Home',
      description: 'Professional portfolio showcasing projects, skills, and experience.',
      url: window.location.href
    });
    this.seoService.updateCanonicalUrl(window.location.href);
    this.loadProjects();
  }

  /**
   * Load projects from state service
   */
  private async loadProjects(): Promise<void> {
    try {
      await this.stateService.loadProjects();
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  }

  /**
   * Handle project click navigation
   * @param projectId - ID of the clicked project
   */
  onProjectClick(projectId: string): void {
    this.router.navigate(['/project', projectId]);
  }
}
