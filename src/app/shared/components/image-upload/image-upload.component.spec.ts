import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ImageUploadComponent } from './image-upload.component';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';

describe('ImageUploadComponent', () => {
  let component: ImageUploadComponent;
  let fixture: ComponentFixture<ImageUploadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImageUploadComponent]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ImageUploadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initial state', () => {
    it('should have empty images array by default', () => {
      expect(component.images()).toEqual([]);
    });

    it('should have maxImages of 5 by default', () => {
      expect(component.maxImages()).toBe(5);
    });

    it('should not be uploading initially', () => {
      expect(component.isUploading()).toBe(false);
    });

    it('should not be in drag over state initially', () => {
      expect(component.isDragOver()).toBe(false);
    });

    it('should have empty previews initially', () => {
      expect(component.previews()).toEqual([]);
    });
  });

  describe('Max images configuration', () => {
    it('should accept custom maxImages value', () => {
      fixture.componentRef.setInput('maxImages', 3);
      fixture.detectChanges();

      expect(component.maxImages()).toBe(3);
    });

    it('should not be at max when images are below limit', () => {
      component.images.set(['image1.jpg', 'image2.jpg']);
      expect(component.isMaxReached()).toBe(false);
    });

    it('should be at max when images reach limit', () => {
      fixture.componentRef.setInput('maxImages', 2);
      component.images.set(['image1.jpg', 'image2.jpg']);
      
      expect(component.isMaxReached()).toBe(true);
    });
  });

  describe('Image removal', () => {
    it('should remove image at specified index', () => {
      component.images.set(['image1.jpg', 'image2.jpg', 'image3.jpg']);
      
      component.removeImage(1);
      
      expect(component.images()).toEqual(['image1.jpg', 'image3.jpg']);
    });

    it('should update previews after removal', () => {
      component.images.set(['image1.jpg', 'image2.jpg']);
      component['updatePreviews']();
      
      component.removeImage(0);
      
      expect(component.previews()).toEqual(['image2.jpg']);
    });

    it('should handle removing first image', () => {
      component.images.set(['image1.jpg', 'image2.jpg']);
      
      component.removeImage(0);
      
      expect(component.images()).toEqual(['image2.jpg']);
    });

    it('should handle removing last image', () => {
      component.images.set(['image1.jpg', 'image2.jpg']);
      
      component.removeImage(1);
      
      expect(component.images()).toEqual(['image1.jpg']);
    });
  });

  describe('Drag and drop', () => {
    it('should set drag over state on dragover', () => {
      const event = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn()
      } as unknown as DragEvent;
      
      component.onDragOver(event);
      
      expect(component.isDragOver()).toBe(true);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should clear drag over state on dragleave', () => {
      component.isDragOver.set(true);
      const event = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn()
      } as unknown as DragEvent;
      
      component.onDragLeave(event);
      
      expect(component.isDragOver()).toBe(false);
    });

    it('should apply drag over class when dragging', () => {
      component.isDragOver.set(true);
      fixture.detectChanges();

      const dropzone = fixture.debugElement.query(By.css('.image-upload__dropzone'));
      expect(dropzone.nativeElement.classList.contains('image-upload__dropzone--drag-over')).toBe(true);
    });
  });

  describe('Loading state', () => {
    it('should show loading indicator when uploading', () => {
      component.isUploading.set(true);
      fixture.detectChanges();

      const loading = fixture.debugElement.query(By.css('.image-upload__loading'));
      expect(loading).not.toBeNull();
    });

    it('should show spinner when uploading', () => {
      component.isUploading.set(true);
      fixture.detectChanges();

      const spinner = fixture.debugElement.query(By.css('.image-upload__spinner'));
      expect(spinner).not.toBeNull();
    });

    it('should not show loading indicator when not uploading', () => {
      component.isUploading.set(false);
      fixture.detectChanges();

      const loading = fixture.debugElement.query(By.css('.image-upload__loading'));
      expect(loading).toBeNull();
    });
  });

  describe('Max reached state', () => {
    it('should show max reached message when limit is reached', () => {
      fixture.componentRef.setInput('maxImages', 2);
      component.images.set(['image1.jpg', 'image2.jpg']);
      fixture.detectChanges();

      const maxReached = fixture.debugElement.query(By.css('.image-upload__max-reached'));
      expect(maxReached).not.toBeNull();
    });

    it('should disable dropzone when max is reached', () => {
      fixture.componentRef.setInput('maxImages', 2);
      component.images.set(['image1.jpg', 'image2.jpg']);
      fixture.detectChanges();

      const dropzone = fixture.debugElement.query(By.css('.image-upload__dropzone'));
      expect(dropzone.nativeElement.classList.contains('image-upload__dropzone--disabled')).toBe(true);
    });

    it('should disable file input when max is reached', () => {
      fixture.componentRef.setInput('maxImages', 2);
      component.images.set(['image1.jpg', 'image2.jpg']);
      fixture.detectChanges();

      const input = fixture.debugElement.query(By.css('input[type="file"]'));
      expect(input.nativeElement.disabled).toBe(true);
    });
  });

  describe('Image previews', () => {
    it('should not show previews when no images', () => {
      component.images.set([]);
      fixture.detectChanges();

      const previews = fixture.debugElement.query(By.css('.image-upload__previews'));
      expect(previews).toBeNull();
    });

    it('should show previews when images exist', () => {
      component.images.set(['image1.jpg', 'image2.jpg']);
      component['updatePreviews']();
      fixture.detectChanges();

      const previews = fixture.debugElement.query(By.css('.image-upload__previews'));
      expect(previews).not.toBeNull();
    });

    it('should render correct number of preview items', () => {
      component.images.set(['image1.jpg', 'image2.jpg', 'image3.jpg']);
      component['updatePreviews']();
      fixture.detectChanges();

      const previewItems = fixture.debugElement.queryAll(By.css('.image-upload__preview-item'));
      expect(previewItems.length).toBe(3);
    });

    it('should render image with correct src', () => {
      component.images.set(['test-image.jpg']);
      component['updatePreviews']();
      fixture.detectChanges();

      const img = fixture.debugElement.query(By.css('.image-upload__preview-image'));
      expect(img.nativeElement.src).toContain('test-image.jpg');
    });

    it('should have remove button for each preview', () => {
      component.images.set(['image1.jpg', 'image2.jpg']);
      component['updatePreviews']();
      fixture.detectChanges();

      const removeButtons = fixture.debugElement.queryAll(By.css('.image-upload__remove-btn'));
      expect(removeButtons.length).toBe(2);
    });

    it('should call removeImage when remove button is clicked', () => {
      component.images.set(['image1.jpg', 'image2.jpg']);
      component['updatePreviews']();
      fixture.detectChanges();

      const removeImageSpy = vi.spyOn(component, 'removeImage');
      const removeButton = fixture.debugElement.query(By.css('.image-upload__remove-btn'));
      removeButton.nativeElement.click();

      expect(removeImageSpy).toHaveBeenCalledWith(0);
    });
  });

  describe('Accessibility', () => {
    it('should have aria-label on file input', () => {
      const input = fixture.debugElement.query(By.css('input[type="file"]'));
      expect(input.nativeElement.getAttribute('aria-label')).toBe('Upload images');
    });

    it('should have aria-label on remove buttons', () => {
      component.images.set(['image1.jpg']);
      component['updatePreviews']();
      fixture.detectChanges();

      const removeButton = fixture.debugElement.query(By.css('.image-upload__remove-btn'));
      expect(removeButton.nativeElement.getAttribute('aria-label')).toBe('Remove image 1');
    });

    it('should have alt text on preview images', () => {
      component.images.set(['image1.jpg']);
      component['updatePreviews']();
      fixture.detectChanges();

      const img = fixture.debugElement.query(By.css('.image-upload__preview-image'));
      expect(img.nativeElement.alt).toBe('Preview 1');
    });
  });

  describe('Image counter', () => {
    it('should display current image count', () => {
      component.images.set(['image1.jpg', 'image2.jpg']);
      fixture.detectChanges();

      const hint = fixture.debugElement.query(By.css('.image-upload__hint'));
      expect(hint.nativeElement.textContent).toContain('2 / 5 images');
    });

    it('should update counter when images change', () => {
      component.images.set(['image1.jpg']);
      fixture.detectChanges();

      let hint = fixture.debugElement.query(By.css('.image-upload__hint'));
      expect(hint.nativeElement.textContent).toContain('1 / 5 images');

      component.images.set(['image1.jpg', 'image2.jpg', 'image3.jpg']);
      fixture.detectChanges();

      hint = fixture.debugElement.query(By.css('.image-upload__hint'));
      expect(hint.nativeElement.textContent).toContain('3 / 5 images');
    });
  });

  describe('File input', () => {
    it('should accept multiple files', () => {
      const input = fixture.debugElement.query(By.css('input[type="file"]'));
      expect(input.nativeElement.multiple).toBe(true);
    });

    it('should accept only image files', () => {
      const input = fixture.debugElement.query(By.css('input[type="file"]'));
      expect(input.nativeElement.accept).toBe('image/*');
    });
  });
});
