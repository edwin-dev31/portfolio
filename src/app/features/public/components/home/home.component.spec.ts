import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { HomeComponent } from './home.component';
import { StateService } from '../../../../core/services/state.service';
import { signal } from '@angular/core';
import { Project } from '../../../../models/project.model';
import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;
  let mockStateService: any;
  let mockRouter: any;

  // Mock IntersectionObserver
  beforeAll(() => {
    (globalThis as any).IntersectionObserver = class IntersectionObserver {
      constructor() {}
      disconnect() {}
      observe() {}
      takeRecords() { return []; }
      unobserve() {}
    };
  });

  const mockProjects: Project[] = [
    {
      id: '1',
      title: 'Test Project 1',
      category: 'web',
      description: 'Test description 1',
      image: 'test1.jpg',
      tools: ['Angular', 'TypeScript'],
      links: {
        repository: 'https://github.com/test1',
        liveDemo: 'https://test1.com'
      }
    },
    {
      id: '2',
      title: 'Test Project 2',
      category: 'mobile',
      description: 'Test description 2',
      image: 'test2.jpg',
      tools: ['React Native'],
      links: {
        repository: 'https://github.com/test2',
        liveDemo: 'https://test2.com'
      }
    }
  ];

  beforeEach(async () => {
    const publishedProjectsSignal = signal<Project[]>(mockProjects);
    const isLoadingSignal = signal<boolean>(false);

    mockStateService = {
      loadProjects: vi.fn().mockResolvedValue(undefined),
      publishedProjects: publishedProjectsSignal,
      isLoadingProjects: isLoadingSignal
    };

    mockRouter = {
      navigate: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        { provide: StateService, useValue: mockStateService },
        { provide: Router, useValue: mockRouter }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load projects on init', () => {
    fixture.detectChanges();
    
    expect(mockStateService.loadProjects).toHaveBeenCalled();
  });

  it('should display published projects from state service', () => {
    fixture.detectChanges();
    
    expect(component.projects()).toEqual(mockProjects);
  });

  it('should show loading state while projects are loading', async () => {
    // Create new component with loading state
    const publishedProjectsSignal = signal<Project[]>([]);
    const isLoadingSignal = signal<boolean>(true);

    const loadingStateService = {
      loadProjects: vi.fn().mockResolvedValue(undefined),
      publishedProjects: publishedProjectsSignal,
      isLoadingProjects: isLoadingSignal
    };

    await TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        { provide: StateService, useValue: loadingStateService },
        { provide: Router, useValue: mockRouter }
      ]
    }).compileComponents();

    const loadingFixture = TestBed.createComponent(HomeComponent);
    const loadingComponent = loadingFixture.componentInstance;
    
    loadingFixture.detectChanges();
    
    expect(loadingComponent.isLoading()).toBe(true);
  });

  it('should navigate to project detail when project is clicked', () => {
    const projectId = '1';
    
    component.onProjectClick(projectId);
    
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/project', projectId]);
  });

  it('should handle empty projects array', async () => {
    // Create new component with empty projects
    const emptyProjectsSignal = signal<Project[]>([]);
    const isLoadingSignal = signal<boolean>(false);

    const emptyStateService = {
      loadProjects: vi.fn().mockResolvedValue(undefined),
      publishedProjects: emptyProjectsSignal,
      isLoadingProjects: isLoadingSignal
    };

    await TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        { provide: StateService, useValue: emptyStateService },
        { provide: Router, useValue: mockRouter }
      ]
    }).compileComponents();

    const emptyFixture = TestBed.createComponent(HomeComponent);
    const emptyComponent = emptyFixture.componentInstance;
    
    emptyFixture.detectChanges();
    
    expect(emptyComponent.projects()).toEqual([]);
  });

  it('should handle load projects error gracefully', async () => {
    mockStateService.loadProjects.mockRejectedValue(new Error('Load failed'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    fixture.detectChanges();
    await fixture.whenStable();
    
    expect(consoleSpy).toHaveBeenCalledWith('Failed to load projects:', expect.any(Error));
    consoleSpy.mockRestore();
  });
});
