import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { DashboardComponent } from './dashboard.component';
import { StateService } from '../../../../core/services/state.service';
import { DataService } from '../../../../core/services/data.service';
import { signal } from '@angular/core';
import { Project } from '../../../../models';
import { vi } from 'vitest';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let mockStateService: any;
  let mockDataService: any;
  let mockRouter: any;

  const mockProjects: Project[] = [
    {
      id: '1',
      title: 'Test Project 1',
      category: 'web',
      description: 'Test description 1',
      image: 'test1.jpg',
      tools: ['Angular', 'TypeScript'],
      links: { repository: 'https://github.com/test1', liveDemo: 'https://test1.com' }
    },
    {
      id: '2',
      title: 'Test Project 2',
      category: 'mobile',
      description: 'Test description 2',
      image: 'test2.jpg',
      tools: ['React Native'],
      links: { repository: 'https://github.com/test2', liveDemo: 'https://test2.com' }
    }
  ];

  beforeEach(async () => {
    mockStateService = {
      loadProjects: vi.fn(),
      deleteProject: vi.fn(),
      projects: signal(mockProjects),
      isLoadingProjects: signal(false)
    };

    mockDataService = {
      deleteProject: vi.fn()
    };

    mockRouter = {
      navigate: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        { provide: StateService, useValue: mockStateService },
        { provide: DataService, useValue: mockDataService },
        { provide: Router, useValue: mockRouter }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load projects on init', async () => {
    mockStateService.loadProjects.mockResolvedValue(undefined);
    
    await component.ngOnInit();
    
    expect(mockStateService.loadProjects).toHaveBeenCalled();
  });

  it('should navigate to project editor when creating new project', () => {
    component.createNewProject();
    
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/admin/projects/new']);
  });

  it('should navigate to project editor with id when editing project', () => {
    const projectId = '123';
    
    component.editProject(projectId);
    
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/admin/projects/edit', projectId]);
  });

  it('should open delete modal when confirming delete', () => {
    const project = mockProjects[0];
    
    component.confirmDelete(project);
    
    expect(component.showDeleteModal()).toBe(true);
    expect(component.projectToDelete()).toBe(project);
  });

  it('should close delete modal when canceling delete', () => {
    component.showDeleteModal.set(true);
    component.projectToDelete.set(mockProjects[0]);
    
    component.cancelDelete();
    
    expect(component.showDeleteModal()).toBe(false);
    expect(component.projectToDelete()).toBeNull();
  });

  it('should delete project and close modal on successful deletion', async () => {
    const project = mockProjects[0];
    component.projectToDelete.set(project);
    component.showDeleteModal.set(true);
    
    mockDataService.deleteProject.mockResolvedValue(undefined);
    mockStateService.deleteProject.mockResolvedValue(undefined);
    
    await component.deleteProject();
    
    expect(mockDataService.deleteProject).toHaveBeenCalledWith(project.id);
    expect(mockStateService.deleteProject).toHaveBeenCalledWith(project.id);
    expect(component.showDeleteModal()).toBe(false);
    expect(component.projectToDelete()).toBeNull();
  });

  it('should display correct project count', () => {
    expect(component.publishedCount()).toBe(2);
  });

  it('should return published badge class', () => {
    const badgeClass = component.getStatusBadgeClass(mockProjects[0]);
    expect(badgeClass).toBe('badge--published');
  });

  it('should return published status text', () => {
    const statusText = component.getStatusText(mockProjects[0]);
    expect(statusText).toBe('Publicado');
  });
});
