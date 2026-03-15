import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

import { ProjectEditorComponent } from './project-editor.component';
import { DataService } from '../../../../core/services/data.service';
import { StateService } from '../../../../core/services/state.service';
import { Project } from '../../../../models/project.model';

describe('ProjectEditorComponent', () => {
  let component: ProjectEditorComponent;
  let fixture: ComponentFixture<ProjectEditorComponent>;
  let mockDataService: any;
  let mockStateService: any;
  let mockRouter: any;
  let mockActivatedRoute: any;

  const mockProject: Project = {
    id: 'test-1',
    title: 'Test Project',
    category: 'web-app',
    description: 'Test description',
    image: 'test.jpg',
    tools: ['Angular', 'TypeScript'],
    links: {
      repository: 'https://github.com/test/repo',
      liveDemo: 'https://test.com'
    }
  };

  beforeEach(async () => {
    mockDataService = {
      createProject: vi.fn(),
      updateProject: vi.fn()
    };

    mockStateService = {
      projects: vi.fn().mockReturnValue([mockProject]),
      addProject: vi.fn(),
      updateProject: vi.fn(),
      loadProjects: vi.fn()
    };

    mockRouter = {
      navigate: vi.fn()
    };

    mockActivatedRoute = {
      snapshot: {
        paramMap: {
          get: vi.fn().mockReturnValue(null)
        }
      }
    };

    await TestBed.configureTestingModule({
      imports: [ProjectEditorComponent, ReactiveFormsModule],
      providers: [
        { provide: DataService, useValue: mockDataService },
        { provide: StateService, useValue: mockStateService },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectEditorComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Create Mode', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should initialize in create mode when no id in route', () => {
      expect(component.isEditMode()).toBe(false);
      expect(component.pageTitle()).toBe('Create New Project');
    });

    it('should initialize form with empty values', () => {
      expect(component.projectForm.value).toEqual({
        title: '',
        category: '',
        description: '',
        image: '',
        tools: [],
        repository: '',
        liveDemo: ''
      });
    });

    it('should mark form as invalid when required fields are empty', () => {
      expect(component.projectForm.valid).toBe(false);
      expect(component.canSave()).toBe(false);
    });

    it('should mark form as valid when all required fields are filled', async () => {
      component.projectForm.patchValue({
        title: 'New Project',
        category: 'web-app',
        description: 'Description',
        image: 'image.jpg'
      });

      fixture.detectChanges();
      await fixture.whenStable();

      expect(component.projectForm.valid).toBe(true);
      expect(component.canSave()).toBe(true);
    });

    it('should validate title minimum length', () => {
      const titleControl = component.projectForm.get('title');
      titleControl?.setValue('ab');
      titleControl?.markAsTouched();

      expect(titleControl?.hasError('minlength')).toBe(true);
      expect(component.getErrorMessage('title')).toContain('at least 3 characters');
    });

    it('should create new project on save', async () => {
      mockStateService.addProject.mockResolvedValue(undefined);

      component.projectForm.patchValue({
        title: 'New Project',
        category: 'web-app',
        description: 'Description',
        image: 'image.jpg',
        tools: ['Angular'],
        repository: 'https://github.com/test',
        liveDemo: 'https://test.com'
      });

      fixture.detectChanges();
      await fixture.whenStable();

      await component.saveProject();

      expect(mockStateService.addProject).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'New Project',
          category: 'web-app',
          description: 'Description',
          image: 'image.jpg'
        })
      );
      expect(component.hasUnsavedChanges()).toBe(false);
    });
  });

  describe('Edit Mode', () => {
    beforeEach(() => {
      mockActivatedRoute.snapshot.paramMap.get.mockReturnValue('test-1');
      fixture.detectChanges();
    });

    it('should initialize in edit mode when id is in route', () => {
      expect(component.isEditMode()).toBe(true);
      expect(component.pageTitle()).toBe('Edit Project');
      expect(component.projectId()).toBe('test-1');
    });

    it('should load and populate form with existing project data', () => {
      // The form should be populated with mockProject data
      expect(component.projectForm.get('title')?.value).toBe(mockProject.title);
      expect(component.projectForm.get('category')?.value).toBe(mockProject.category);
    });

    it('should update existing project on save', async () => {
      mockStateService.updateProject.mockResolvedValue(undefined);

      component.projectForm.patchValue({
        title: 'Updated Project'
      });

      fixture.detectChanges();
      await fixture.whenStable();

      await component.saveProject();

      expect(mockStateService.updateProject).toHaveBeenCalledWith(
        'test-1',
        expect.objectContaining({ title: 'Updated Project' })
      );
    });
  });

  describe('Unsaved Changes', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should track unsaved changes when form is modified', () => {
      expect(component.hasUnsavedChanges()).toBe(false);

      component.projectForm.patchValue({ title: 'Changed' });

      expect(component.hasUnsavedChanges()).toBe(true);
    });

    it('should show confirmation dialog when navigating away with unsaved changes', () => {
      vi.spyOn(window, 'confirm').mockReturnValue(false);
      component.hasUnsavedChanges.set(true);

      const canDeactivate = component.canDeactivate();

      expect(window.confirm).toHaveBeenCalled();
      expect(canDeactivate).toBe(false);
    });

    it('should allow navigation when no unsaved changes', () => {
      component.hasUnsavedChanges.set(false);

      const canDeactivate = component.canDeactivate();

      expect(canDeactivate).toBe(true);
    });
  });

  describe('Tools Management', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should add tool to tools array', () => {
      component.addTool('React');

      expect(component.getTools()).toContain('React');
    });

    it('should not add empty tool', () => {
      component.addTool('   ');

      expect(component.getTools().length).toBe(0);
    });

    it('should not add duplicate tool', () => {
      component.addTool('Angular');
      component.addTool('Angular');

      expect(component.getTools().length).toBe(1);
    });

    it('should remove tool from tools array', () => {
      component.addTool('React');
      component.addTool('Vue');

      component.removeTool(0);

      expect(component.getTools()).toEqual(['Vue']);
    });
  });

  describe('Image Upload Integration', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should set first image as main project image', () => {
      component.onImagesChange(['image1.jpg', 'image2.jpg']);

      expect(component.projectForm.get('image')?.value).toBe('image1.jpg');
    });

    it('should clear image when images array is empty', () => {
      component.projectForm.patchValue({ image: 'test.jpg' });

      component.onImagesChange([]);

      expect(component.projectForm.get('image')?.value).toBe('');
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should display error message when save fails', async () => {
      mockStateService.addProject.mockRejectedValue(new Error('Save failed'));

      component.projectForm.patchValue({
        title: 'Test',
        category: 'test',
        description: 'test',
        image: 'test.jpg'
      });

      fixture.detectChanges();
      await fixture.whenStable();

      await component.saveProject();

      expect(component.errorMessage()).toBe('Save failed');
    });

    it('should prevent save when form is invalid', async () => {
      component.projectForm.patchValue({ title: '' });

      await component.saveProject();

      expect(mockStateService.addProject).not.toHaveBeenCalled();
    });
  });
});
