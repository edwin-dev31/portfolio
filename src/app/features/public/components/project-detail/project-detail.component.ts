import { Component, ChangeDetectionStrategy, inject, OnInit, signal, input, output, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StateService } from '../../../../core/services/state.service';
import { SeoService } from '../../../../core/services/seo.service';
import { Project } from '../../../../models/project.model';

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

  
  projectId = input.required<string>();

  
  close = output<void>();

  
  project = signal<Project | null>(null);

  
  isLoading = signal(true);

  
  notFound = signal(false);

  ngOnInit(): void {
    this.loadProject();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['projectId'] && !changes['projectId'].isFirstChange()) {
      this.loadProject();
    }
  }

  
  private async loadProject(): Promise<void> {
    const projectId = this.projectId();
    
    if (!projectId) {
      this.notFound.set(true);
      this.isLoading.set(false);
      return;
    }

    try {
      
      if (this.stateService.projects().length === 0) {
        await this.stateService.loadProjects();
      }

      
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

  
  onEscapeKey(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.goBack();
    }
  }

  
  goBack(): void {
    this.close.emit();
  }

  
  openLink(url: string): void {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }
}
