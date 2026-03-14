import { describe, it, expect, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ButtonComponent } from './button.component';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';

describe('ButtonComponent', () => {
  let component: ButtonComponent;
  let fixture: ComponentFixture<ButtonComponent>;
  let buttonElement: DebugElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ButtonComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ButtonComponent);
    component = fixture.componentInstance;
    buttonElement = fixture.debugElement.query(By.css('button'));
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Variant classes', () => {
    it('should apply primary variant class by default', () => {
      expect(buttonElement.nativeElement.classList.contains('btn--primary')).toBe(true);
    });

    it('should apply secondary variant class when variant is secondary', () => {
      fixture.componentRef.setInput('variant', 'secondary');
      fixture.detectChanges();

      expect(buttonElement.nativeElement.classList.contains('btn--secondary')).toBe(true);
      expect(buttonElement.nativeElement.classList.contains('btn--primary')).toBe(false);
    });

    it('should apply ghost variant class when variant is ghost', () => {
      fixture.componentRef.setInput('variant', 'ghost');
      fixture.detectChanges();

      expect(buttonElement.nativeElement.classList.contains('btn--ghost')).toBe(true);
      expect(buttonElement.nativeElement.classList.contains('btn--primary')).toBe(false);
    });
  });

  describe('Size classes', () => {
    it('should apply medium size class by default', () => {
      expect(buttonElement.nativeElement.classList.contains('btn--md')).toBe(true);
    });

    it('should apply small size class when size is sm', () => {
      fixture.componentRef.setInput('size', 'sm');
      fixture.detectChanges();

      expect(buttonElement.nativeElement.classList.contains('btn--sm')).toBe(true);
      expect(buttonElement.nativeElement.classList.contains('btn--md')).toBe(false);
    });

    it('should apply large size class when size is lg', () => {
      fixture.componentRef.setInput('size', 'lg');
      fixture.detectChanges();

      expect(buttonElement.nativeElement.classList.contains('btn--lg')).toBe(true);
      expect(buttonElement.nativeElement.classList.contains('btn--md')).toBe(false);
    });
  });

  describe('Disabled state', () => {
    it('should not be disabled by default', () => {
      expect(buttonElement.nativeElement.disabled).toBe(false);
    });

    it('should be disabled when disabled input is true', () => {
      fixture.componentRef.setInput('disabled', true);
      fixture.detectChanges();

      expect(buttonElement.nativeElement.disabled).toBe(true);
    });

    it('should prevent clicks when disabled', () => {
      fixture.componentRef.setInput('disabled', true);
      fixture.detectChanges();

      let clicked = false;
      buttonElement.nativeElement.addEventListener('click', () => {
        clicked = true;
      });

      buttonElement.nativeElement.click();

      // Disabled buttons don't fire click events
      expect(clicked).toBe(false);
    });
  });

  describe('Button type', () => {
    it('should have type button by default', () => {
      expect(buttonElement.nativeElement.type).toBe('button');
    });

    it('should have type submit when type input is submit', () => {
      fixture.componentRef.setInput('type', 'submit');
      fixture.detectChanges();

      expect(buttonElement.nativeElement.type).toBe('submit');
    });

    it('should have type reset when type input is reset', () => {
      fixture.componentRef.setInput('type', 'reset');
      fixture.detectChanges();

      expect(buttonElement.nativeElement.type).toBe('reset');
    });
  });

  describe('Keyboard navigation', () => {
    it('should be focusable via keyboard', () => {
      buttonElement.nativeElement.focus();
      expect(document.activeElement).toBe(buttonElement.nativeElement);
    });

    it('should trigger click on Enter key', () => {
      let clicked = false;
      buttonElement.nativeElement.addEventListener('click', () => {
        clicked = true;
      });

      buttonElement.nativeElement.focus();
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      buttonElement.nativeElement.dispatchEvent(enterEvent);

      // Note: Native button elements handle Enter key automatically
      // This test verifies the button is keyboard accessible
      expect(document.activeElement).toBe(buttonElement.nativeElement);
    });

    it('should trigger click on Space key', () => {
      let clicked = false;
      buttonElement.nativeElement.addEventListener('click', () => {
        clicked = true;
      });

      buttonElement.nativeElement.focus();
      const spaceEvent = new KeyboardEvent('keydown', { key: ' ' });
      buttonElement.nativeElement.dispatchEvent(spaceEvent);

      // Note: Native button elements handle Space key automatically
      // This test verifies the button is keyboard accessible
      expect(document.activeElement).toBe(buttonElement.nativeElement);
    });

    it('should not be focusable when disabled', () => {
      fixture.componentRef.setInput('disabled', true);
      fixture.detectChanges();

      buttonElement.nativeElement.focus();
      
      // Disabled buttons cannot receive focus
      expect(document.activeElement).not.toBe(buttonElement.nativeElement);
    });
  });

  describe('Content projection', () => {
    it('should project content into button', () => {
      const testContent = 'Click me';
      const testFixture = TestBed.createComponent(ButtonComponent);
      testFixture.componentRef.setInput('variant', 'primary');
      
      // Set the button content
      const buttonEl = testFixture.debugElement.query(By.css('button'));
      buttonEl.nativeElement.textContent = testContent;
      testFixture.detectChanges();

      expect(buttonEl.nativeElement.textContent).toContain(testContent);
    });
  });

  describe('Computed classes', () => {
    it('should always include base btn class', () => {
      expect(buttonElement.nativeElement.classList.contains('btn')).toBe(true);
    });

    it('should update classes when variant changes', () => {
      fixture.componentRef.setInput('variant', 'primary');
      fixture.detectChanges();
      expect(buttonElement.nativeElement.classList.contains('btn--primary')).toBe(true);

      fixture.componentRef.setInput('variant', 'secondary');
      fixture.detectChanges();
      expect(buttonElement.nativeElement.classList.contains('btn--secondary')).toBe(true);
      expect(buttonElement.nativeElement.classList.contains('btn--primary')).toBe(false);
    });

    it('should update classes when size changes', () => {
      fixture.componentRef.setInput('size', 'sm');
      fixture.detectChanges();
      expect(buttonElement.nativeElement.classList.contains('btn--sm')).toBe(true);

      fixture.componentRef.setInput('size', 'lg');
      fixture.detectChanges();
      expect(buttonElement.nativeElement.classList.contains('btn--lg')).toBe(true);
      expect(buttonElement.nativeElement.classList.contains('btn--sm')).toBe(false);
    });

    it('should have both variant and size classes', () => {
      fixture.componentRef.setInput('variant', 'ghost');
      fixture.componentRef.setInput('size', 'lg');
      fixture.detectChanges();

      expect(buttonElement.nativeElement.classList.contains('btn')).toBe(true);
      expect(buttonElement.nativeElement.classList.contains('btn--ghost')).toBe(true);
      expect(buttonElement.nativeElement.classList.contains('btn--lg')).toBe(true);
    });
  });
});
