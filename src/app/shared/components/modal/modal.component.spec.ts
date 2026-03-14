import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ModalComponent } from './modal.component';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';

describe('ModalComponent', () => {
  let component: ModalComponent;
  let fixture: ComponentFixture<ModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalComponent]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ModalComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Modal visibility', () => {
    it('should not render modal when isOpen is false', () => {
      fixture.componentRef.setInput('isOpen', false);
      fixture.detectChanges();

      const backdrop = fixture.debugElement.query(By.css('.modal-backdrop'));
      expect(backdrop).toBeNull();
    });

    it('should render modal when isOpen is true', () => {
      fixture.componentRef.setInput('isOpen', true);
      fixture.detectChanges();

      const backdrop = fixture.debugElement.query(By.css('.modal-backdrop'));
      expect(backdrop).not.toBeNull();
    });

    it('should show modal dialog when open', () => {
      fixture.componentRef.setInput('isOpen', true);
      fixture.detectChanges();

      const dialog = fixture.debugElement.query(By.css('.modal-dialog'));
      expect(dialog).not.toBeNull();
    });
  });

  describe('Modal title', () => {
    it('should not render title when title is empty', () => {
      fixture.componentRef.setInput('isOpen', true);
      fixture.componentRef.setInput('title', '');
      fixture.detectChanges();

      const title = fixture.debugElement.query(By.css('.modal-title'));
      expect(title).toBeNull();
    });

    it('should render title when title is provided', () => {
      fixture.componentRef.setInput('isOpen', true);
      fixture.componentRef.setInput('title', 'Test Modal');
      fixture.detectChanges();

      const title = fixture.debugElement.query(By.css('.modal-title'));
      expect(title).not.toBeNull();
      expect(title.nativeElement.textContent).toBe('Test Modal');
    });

    it('should have correct id for aria-labelledby', () => {
      fixture.componentRef.setInput('isOpen', true);
      fixture.componentRef.setInput('title', 'Test Modal');
      fixture.detectChanges();

      const title = fixture.debugElement.query(By.css('.modal-title'));
      expect(title.nativeElement.id).toBe('modal-title');
    });
  });

  describe('Backdrop click', () => {
    it('should emit close event when backdrop is clicked', () => {
      fixture.componentRef.setInput('isOpen', true);
      fixture.detectChanges();

      const closeSpy = vi.fn();
      component.close.subscribe(closeSpy);

      const backdrop = fixture.debugElement.query(By.css('.modal-backdrop'));
      backdrop.nativeElement.click();

      expect(closeSpy).toHaveBeenCalled();
    });

    it('should not emit close event when dialog content is clicked', () => {
      fixture.componentRef.setInput('isOpen', true);
      fixture.detectChanges();

      const closeSpy = vi.fn();
      component.close.subscribe(closeSpy);

      const dialog = fixture.debugElement.query(By.css('.modal-dialog'));
      dialog.nativeElement.click();

      expect(closeSpy).not.toHaveBeenCalled();
    });
  });

  describe('Escape key', () => {
    it('should emit close event when Escape key is pressed and modal is open', () => {
      fixture.componentRef.setInput('isOpen', true);
      fixture.detectChanges();

      const closeSpy = vi.fn();
      component.close.subscribe(closeSpy);

      component.onEscapeKey();

      expect(closeSpy).toHaveBeenCalled();
    });

    it('should not emit close event when Escape key is pressed and modal is closed', () => {
      fixture.componentRef.setInput('isOpen', false);
      fixture.detectChanges();

      const closeSpy = vi.fn();
      component.close.subscribe(closeSpy);

      component.onEscapeKey();

      expect(closeSpy).not.toHaveBeenCalled();
    });
  });

  describe('Close button', () => {
    it('should render close button', () => {
      fixture.componentRef.setInput('isOpen', true);
      fixture.detectChanges();

      const closeButton = fixture.debugElement.query(By.css('.modal-close'));
      expect(closeButton).not.toBeNull();
    });

    it('should emit close event when close button is clicked', () => {
      fixture.componentRef.setInput('isOpen', true);
      fixture.detectChanges();

      const closeSpy = vi.fn();
      component.close.subscribe(closeSpy);

      const closeButton = fixture.debugElement.query(By.css('.modal-close'));
      closeButton.nativeElement.click();

      expect(closeSpy).toHaveBeenCalled();
    });

    it('should have aria-label for accessibility', () => {
      fixture.componentRef.setInput('isOpen', true);
      fixture.detectChanges();

      const closeButton = fixture.debugElement.query(By.css('.modal-close'));
      expect(closeButton.nativeElement.getAttribute('aria-label')).toBe('Close modal');
    });
  });

  describe('ARIA attributes', () => {
    it('should have role="dialog" on modal dialog', () => {
      fixture.componentRef.setInput('isOpen', true);
      fixture.detectChanges();

      const dialog = fixture.debugElement.query(By.css('.modal-dialog'));
      expect(dialog.nativeElement.getAttribute('role')).toBe('dialog');
    });

    it('should have aria-modal="true" on modal dialog', () => {
      fixture.componentRef.setInput('isOpen', true);
      fixture.detectChanges();

      const dialog = fixture.debugElement.query(By.css('.modal-dialog'));
      expect(dialog.nativeElement.getAttribute('aria-modal')).toBe('true');
    });

    it('should have aria-labelledby when title is provided', () => {
      fixture.componentRef.setInput('isOpen', true);
      fixture.componentRef.setInput('title', 'Test Modal');
      fixture.detectChanges();

      const dialog = fixture.debugElement.query(By.css('.modal-dialog'));
      expect(dialog.nativeElement.getAttribute('aria-labelledby')).toBe('modal-title');
    });

    it('should not have aria-labelledby when title is empty', () => {
      fixture.componentRef.setInput('isOpen', true);
      fixture.componentRef.setInput('title', '');
      fixture.detectChanges();

      const dialog = fixture.debugElement.query(By.css('.modal-dialog'));
      expect(dialog.nativeElement.getAttribute('aria-labelledby')).toBeNull();
    });
  });

  describe('Content projection', () => {
    it('should project content into modal body', () => {
      fixture.componentRef.setInput('isOpen', true);
      fixture.detectChanges();

      const modalBody = fixture.debugElement.query(By.css('.modal-body'));
      expect(modalBody).not.toBeNull();
    });
  });

  describe('Focus trap', () => {
    it('should focus first focusable element when modal opens', async () => {
      fixture.componentRef.setInput('isOpen', true);
      fixture.detectChanges();

      // Wait for focus trap to execute
      await new Promise(resolve => setTimeout(resolve, 10));

      const dialog = fixture.debugElement.query(By.css('.modal-dialog'));
      const focusableElements = dialog.nativeElement.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      if (focusableElements.length > 0) {
        // First focusable element should be the close button
        expect(document.activeElement).toBe(focusableElements[0]);
      }
    });
  });
});
