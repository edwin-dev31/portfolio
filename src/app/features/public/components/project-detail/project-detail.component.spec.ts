import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { ProjectDetailComponent } from './project-detail.component';
import { StateService } from '../../../../core/services/state.service';
import { signal } from '@angular/core';
import { Project } from '../../../../models/project.model';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('ProjectDetailComponent', () => {
  let component: ProjectDetailComponent;
  let fixture: ComponentFixture<ProjectDetailComponent>;
  let mockStateService: any;
  let mockRouter: any;
  let mockActivatedRoute: any;

  const mockProject: Project = {
    id: '1',
    title: 'Test Project',
    category: 'web',
    description: 'Test description',
    image: 'test.jpg',
    tools: ['Angular', 'TypeScript'],
    links: {
      repository: 'https://github.com/test',
      liveDemo: 'https://test.com'
    }
  };

  beforeEach(async () => {
    const projectsSignal = signal<Project[]>([mockProject]);

    mockStateService = {
      loadProjects: vi.fn().mockResolvedValue(undefined),
      selectProject: vi.fn(),
      projects: projectsSignal
    };

    mockRouter = {
      navigate: vi.fn()
    };

    mockActivatedRoute = {
      snapshot: {
        paramMap: {
          get: vi.fn().mockReturnValue('1')
        }
      }
    };

    await TestBed.configureTestingModule({
      imports: [ProjectDetailComponent],
      providers: [
        { provide: StateService, useValue: mockStateService },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectDetailComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load project by ID from route params', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    
    expect(component.project()).toEqual(mockProject);
    expect(mockStateService.selectProject).toHaveBeenCalledWith('1');
  });

  it('should show not found when project ID is missing', async () => {
    mockActivatedRoute.snapshot.paramMap.get.mockReturnValue(null);
    
    fixture.detectChanges();
    await fixture.whenStable();
    
    expect(component.notFound()).toBe(true);
    expect(component.isLoading()).toBe(false);
  });

  it('should show not found when project does not exist', async () => {
    mockActivatedRoute.snapshot.paramMap.get.mockReturnValue('999');
    
    fixture.detectChanges();
    await fixture.whenStable();
    
    expect(component.notFound()).toBe(true);
    expect(component.project()).toBeNull();
  });

  it('should open lightbox with image URL', () => {
    const imageUrl = 'test-image.jpg';
    
    component.openLightbox(imageUrl);
    
    expect(component.lightboxOpen()).toBe(true);
    expect(component.lightboxImage()).toBe(imageUrl);
  });

  it('should close lightbox and restore body scroll', () => {
    component.openLightbox('test.jpg');
    
    component.closeLightbox();
    
    expect(component.lightboxOpen()).toBe(false);
    expect(component.lightboxImage()).toBe('');
  });

  it('should close lightbox on backdrop click', () => {
    component.openLightbox('test.jpg');
    const mockEvent = {
      target: document.createElement('div'),
      currentTarget: document.createElement('div')
    } as any;
    mockEvent.target = mockEvent.currentTarget;
    
    component.onLightboxBackdropClick(mockEvent);
    
    expect(component.lightboxOpen()).toBe(false);
  });

  it('should not close lightbox when clicking on image', () => {
    component.openLightbox('test.jpg');
    const mockEvent = {
      target: document.createElement('img'),
      currentTarget: document.createElement('div')
    } as any;
    
    component.onLightboxBackdropClick(mockEvent);
    
    expect(component.lightboxOpen()).toBe(true);
  });

  it('should close lightbox on escape key', () => {
    component.openLightbox('test.jpg');
    const mockEvent = new KeyboardEvent('keydown', { key: 'Escape' });
    
    component.onEscapeKey(mockEvent);
    
    expect(component.lightboxOpen()).toBe(false);
  });

  it('should not close lightbox on other keys', () => {
    component.openLightbox('test.jpg');
    const mockEvent = new KeyboardEvent('keydown', { key: 'Enter' });
    
    component.onEscapeKey(mockEvent);
    
    expect(component.lightboxOpen()).toBe(true);
  });

  it('should navigate back to home', () => {
    component.goBack();
    
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);
  });

  it('should open external link in new tab', () => {
    const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    const url = 'https://example.com';
    
    component.openLink(url);
    
    expect(windowOpenSpy).toHaveBeenCalledWith(url, '_blank', 'noopener,noreferrer');
    windowOpenSpy.mockRestore();
  });

  it('should not open link if URL is empty', () => {
    const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    
    component.openLink('');
    
    expect(windowOpenSpy).not.toHaveBeenCalled();
    windowOpenSpy.mockRestore();
  });

  it('should handle load projects error', async () => {
    const emptyProjectsSignal = signal<Project[]>([]);
    mockStateService.projects = emptyProjectsSignal;
    mockStateService.loadProjects.mockRejectedValue(new Error('Load failed'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    fixture.detectChanges();
    await fixture.whenStable();
    
    expect(component.notFound()).toBe(true);
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('should not load projects if already loaded', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    
    expect(mockStateService.loadProjects).not.toHaveBeenCalled();
  });

  it('should load projects if not already loaded', async () => {
    const emptyProjectsSignal = signal<Project[]>([]);
    mockStateService.projects = emptyProjectsSignal;
    
    fixture.detectChanges();
    await fixture.whenStable();
    
    expect(mockStateService.loadProjects).toHaveBeenCalled();
  });
});
