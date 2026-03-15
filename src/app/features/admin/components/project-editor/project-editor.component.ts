import { Component, ChangeDetectionStrategy, OnInit, OnDestroy, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription, interval } from 'rxjs';
import { filter } from 'rxjs/operators';

import { DataService } from '../../../../core/services/data.service';
import { StateService } from '../../../../core/services/state.service';
import { Project } from '../../../../models/project.model';
import { ImageUploadComponent } from '../../../../shared/components/image-upload/image-upload.component';
import { RichTextEditorComponent } from '../../../../shared/components/rich-text-editor/rich-text-editor.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';

/**
 * ProjectEditorComponent
 * 
 * Admin component for creating and editing portfolio projects.
 * Features:
 * - Reactive form with validation
 * - Edit vs create mode detection from route params
 * - Auto-save drafts every 30 seconds
 * - Unsaved changes tracking
 * - Integration with ImageUploadComponent and RichTextEditorComponent
 * 
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.6, 7.7, 7.8, 7.9
 */
@Component({
  selector: 'app-project-editor',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ImageUploadComponent,
    RichTextEditorComponent,
    ButtonComponent
  ],
  templateUrl: './project-editor.component.html',
  styleUrl: './project-editor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProjectEditorComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private dataService = inject(DataService);
  private stateService = inject(StateService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // ==================== Form ====================

  projectForm = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    category: ['', Validators.required],
    description: ['', Validators.required],
    image: ['', Validators.required],
    tools: [[] as string[]],
    repository: [''],
    liveDemo: ['']
  });

  // ==================== State Signals ====================

  isEditMode = signal(false);
  isSaving = signal(false);
  hasUnsavedChanges = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  projectId = signal<string | null>(null);
  private formValid = signal(false);
  
  // Rich text editor content
  descriptionContent = signal<string>('');

  constructor() {
    // Sync description content with form
    effect(() => {
      const content = this.descriptionContent();
      this.projectForm.patchValue({ description: content }, { emitEvent: false });
    });
  }

  // ==================== Computed Signals ====================

  pageTitle = computed(() => 
    this.isEditMode() ? 'Edit Project' : 'Create New Project'
  );

  saveButtonText = computed(() => 
    this.isSaving() ? 'Saving...' : 'Save Project'
  );

  canSave = computed(() => 
    this.formValid() && !this.isSaving()
  );

  // ==================== Subscriptions ====================

  private autoSaveSubscription?: Subscription;
  private formChangesSubscription?: Subscription;

  // ==================== Lifecycle Hooks ====================

  ngOnInit(): void {
    // Check if we're in edit mode
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.projectId.set(id);
      this.isEditMode.set(true);
      this.loadProject(id);
    }

    // Track form validity changes
    this.formValid.set(this.projectForm.valid);

    // Track form changes for unsaved changes detection
    this.formChangesSubscription = this.projectForm.valueChanges.subscribe(() => {
      this.hasUnsavedChanges.set(true);
      this.clearMessages();
      this.formValid.set(this.projectForm.valid);
    });

    // Also track status changes separately
    this.projectForm.statusChanges.subscribe(() => {
      this.formValid.set(this.projectForm.valid);
    });

    // Auto-save drafts every 30 seconds if there are unsaved changes
    this.autoSaveSubscription = interval(30000)
      .pipe(filter(() => this.hasUnsavedChanges() && !this.isSaving()))
      .subscribe(() => {
        this.saveDraft();
      });
  }

  ngOnDestroy(): void {
    this.autoSaveSubscription?.unsubscribe();
    this.formChangesSubscription?.unsubscribe();
  }

  // ==================== Data Loading ====================

  /**
   * Load existing project data in edit mode
   */
  private async loadProject(id: string): Promise<void> {
    try {
      const project = await this.stateService.projects().find(p => p.id === id);
      
      if (!project) {
        // Try loading from data service
        await this.stateService.loadProjects();
        const loadedProject = this.stateService.projects().find(p => p.id === id);
        
        if (!loadedProject) {
          this.errorMessage.set('Project not found');
          this.router.navigate(['/admin/dashboard']);
          return;
        }
        
        this.populateForm(loadedProject);
      } else {
        this.populateForm(project);
      }
    } catch (error) {
      this.errorMessage.set('Failed to load project');
      console.error('Error loading project:', error);
    }
  }

  /**
   * Populate form with project data
   */
  private populateForm(project: Project): void {
    this.projectForm.patchValue({
      title: project.title,
      category: project.category,
      description: project.description,
      image: project.image,
      tools: project.tools,
      repository: project.links.repository,
      liveDemo: project.links.liveDemo
    });
    
    // Set description content for rich text editor
    this.descriptionContent.set(project.description);
    
    // Reset unsaved changes flag after loading
    this.hasUnsavedChanges.set(false);
  }

  // ==================== Save Operations ====================

  /**
   * Save project (create or update)
   */
  async saveProject(): Promise<void> {
    if (!this.canSave()) {
      this.markFormGroupTouched();
      return;
    }

    this.isSaving.set(true);
    this.clearMessages();

    try {
      const formValue = this.projectForm.value;
      const projectData: Partial<Project> = {
        title: formValue.title!,
        category: formValue.category!,
        description: formValue.description!,
        image: formValue.image!,
        tools: formValue.tools || [],
        links: {
          repository: formValue.repository || '',
          liveDemo: formValue.liveDemo || ''
        }
      };

      if (this.isEditMode()) {
        const id = this.projectId()!;
        await this.stateService.updateProject(id, projectData);
        this.successMessage.set('Project updated successfully');
      } else {
        await this.stateService.addProject(projectData);
        this.successMessage.set('Project created successfully');
      }

      this.hasUnsavedChanges.set(false);
      
      // Navigate back to dashboard after a short delay
      setTimeout(() => {
        this.router.navigate(['/admin/dashboard']);
      }, 1500);
    } catch (error) {
      this.errorMessage.set(
        error instanceof Error ? error.message : 'Failed to save project'
      );
      console.error('Error saving project:', error);
    } finally {
      this.isSaving.set(false);
    }
  }

  /**
   * Auto-save draft (silent save without navigation)
   */
  private async saveDraft(): Promise<void> {
    if (!this.projectForm.valid || !this.isEditMode()) {
      return;
    }

    try {
      const formValue = this.projectForm.value;
      const projectData: Partial<Project> = {
        title: formValue.title!,
        category: formValue.category!,
        description: formValue.description!,
        image: formValue.image!,
        tools: formValue.tools || [],
        links: {
          repository: formValue.repository || '',
          liveDemo: formValue.liveDemo || ''
        }
      };

      const id = this.projectId()!;
      await this.stateService.updateProject(id, projectData);
      
      this.hasUnsavedChanges.set(false);
      this.successMessage.set('Draft saved');
      
      // Clear success message after 2 seconds
      setTimeout(() => {
        this.successMessage.set(null);
      }, 2000);
    } catch (error) {
      console.error('Error auto-saving draft:', error);
    }
  }

  // ==================== Navigation Guard ====================

  /**
   * Can deactivate guard - checks for unsaved changes
   * Used by the canDeactivate guard
   */
  canDeactivate(): boolean | Promise<boolean> {
    if (!this.hasUnsavedChanges()) {
      return true;
    }

    return confirm(
      'You have unsaved changes. Are you sure you want to leave this page?'
    );
  }

  // ==================== Form Helpers ====================

  /**
   * Mark all form controls as touched to show validation errors
   */
  private markFormGroupTouched(): void {
    Object.keys(this.projectForm.controls).forEach(key => {
      const control = this.projectForm.get(key);
      control?.markAsTouched();
    });
  }

  /**
   * Clear success and error messages
   */
  private clearMessages(): void {
    this.errorMessage.set(null);
    this.successMessage.set(null);
  }

  /**
   * Cancel editing and navigate back
   */
  cancel(): void {
    if (this.hasUnsavedChanges()) {
      const confirmed = confirm(
        'You have unsaved changes. Are you sure you want to cancel?'
      );
      if (!confirmed) {
        return;
      }
    }
    
    this.router.navigate(['/admin/dashboard']);
  }

  // ==================== Form Field Helpers ====================

  /**
   * Check if a form field has an error
   */
  hasError(fieldName: string, errorType: string): boolean {
    const control = this.projectForm.get(fieldName);
    return !!(control?.hasError(errorType) && control?.touched);
  }

  /**
   * Get error message for a form field
   */
  getErrorMessage(fieldName: string): string {
    const control = this.projectForm.get(fieldName);
    
    if (!control || !control.errors || !control.touched) {
      return '';
    }

    if (control.errors['required']) {
      return 'This field is required';
    }

    if (control.errors['minlength']) {
      const minLength = control.errors['minlength'].requiredLength;
      return `Must be at least ${minLength} characters`;
    }

    return 'Invalid value';
  }

  // ==================== Image Upload Integration ====================

  /**
   * Handle image upload - set the first image as the main project image
   */
  onImagesChange(images: string[]): void {
    if (images.length > 0) {
      this.projectForm.patchValue({ image: images[0] });
    } else {
      this.projectForm.patchValue({ image: '' });
    }
  }

  /**
   * Get current images for image upload component
   */
  getCurrentImages(): string[] {
    const image = this.projectForm.get('image')?.value;
    return image ? [image] : [];
  }

  // ==================== Tools Management ====================

  /**
   * Add a tool to the tools array
   */
  addTool(tool: string): void {
    if (!tool.trim()) return;
    
    const currentTools = this.projectForm.get('tools')?.value || [];
    if (!currentTools.includes(tool.trim())) {
      this.projectForm.patchValue({
        tools: [...currentTools, tool.trim()]
      });
    }
  }

  /**
   * Remove a tool from the tools array
   */
  removeTool(index: number): void {
    const currentTools = this.projectForm.get('tools')?.value || [];
    this.projectForm.patchValue({
      tools: currentTools.filter((_, i) => i !== index)
    });
  }

  /**
   * Get current tools array
   */
  getTools(): string[] {
    return this.projectForm.get('tools')?.value || [];
  }
}
