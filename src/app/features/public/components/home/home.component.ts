import { Component, ChangeDetectionStrategy, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StateService } from '../../../../core/services/state.service';
import { SeoService } from '../../../../core/services/seo.service';
import { HeroComponent } from '../hero/hero.component';
import { ProjectGridComponent } from '../project-grid/project-grid.component';
import { ContactComponent } from '../contact/contact.component';
import { ProjectDetailComponent } from '../project-detail/project-detail.component';
import { signal } from '@angular/core';
import { SkillsComponent } from '../skills/skills.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    HeroComponent,
    SkillsComponent,
    ProjectGridComponent,
    ContactComponent,
    ProjectDetailComponent
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent implements OnInit {
  private stateService = inject(StateService);
  private seoService = inject(SeoService);

  
  projects = this.stateService.publishedProjects;

  
  isLoading = this.stateService.isLoadingProjects;

  
  selectedProjectId = signal<string | null>(null);

  
  isModalOpen = signal(false);

  ngOnInit(): void {
    this.seoService.updateMetaTags({
      title: 'Home',
      description: 'Professional portfolio showcasing projects, skills, and experience.',
      url: window.location.href
    });
    this.seoService.updateCanonicalUrl(window.location.href);
    this.loadProjects();
  }

  
  private async loadProjects(): Promise<void> {
    try {
      await this.stateService.loadProjects();
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  }

  
  onProjectClick(projectId: string): void {
    this.selectedProjectId.set(projectId);
    this.isModalOpen.set(true);
    document.body.classList.add('no-scroll');
  }

  
  closeModal(): void {
    this.isModalOpen.set(false);
    this.selectedProjectId.set(null);
    document.body.classList.remove('no-scroll');
  }
}
