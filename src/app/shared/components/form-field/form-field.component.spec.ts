import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormFieldComponent } from './form-field.component';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

describe('FormFieldComponent', () => {
  let component: FormFieldComponent;
  let fixture: ComponentFixture<FormFieldComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormFieldComponent, ReactiveFormsModule]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FormFieldComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Label rendering', () => {
    it('should not render label when label is empty', () => {
      fixture.componentRef.setInput('label', '');
      fixture.detectChanges();

      const label = fixture.debugElement.query(By.css('.form-field__label'));
      expect(label).toBeNull();
    });

    it('should render label when label is provided', () => {
      fixture.componentRef.setInput('label', 'Email Address');
      fixture.detectChanges();

      const label = fixture.debugElement.query(By.css('.form-field__label'));
      expect(label).not.toBeNull();
      expect(label.nativeElement.textContent).toContain('Email Address');
    });

    it('should show required indicator when required is true', () => {
      fixture.componentRef.setInput('label', 'Email');
      fixture.componentRef.setInput('required', true);
      fixture.detectChanges();

      const required = fixture.debugElement.query(By.css('.form-field__required'));
      expect(required).not.toBeNull();
      expect(required.nativeElement.textContent).toBe('*');
    });
  });

  describe('Input types', () => {
    it('should render text input by default', () => {
      const input = fixture.debugElement.query(By.css('input[type="text"]'));
      expect(input).not.toBeNull();
    });

    it('should render email input when type is email', () => {
      fixture.componentRef.setInput('type', 'email');
      fixture.detectChanges();

      const input = fixture.debugElement.query(By.css('input[type="email"]'));
      expect(input).not.toBeNull();
    });

    it('should render textarea when type is textarea', () => {
      fixture.componentRef.setInput('type', 'textarea');
      fixture.detectChanges();

      const textarea = fixture.debugElement.query(By.css('textarea'));
      expect(textarea).not.toBeNull();
    });
  });

  describe('Placeholder', () => {
    it('should set placeholder on input', () => {
      fixture.componentRef.setInput('placeholder', 'Enter your email');
      fixture.detectChanges();

      const input = fixture.debugElement.query(By.css('input'));
      expect(input.nativeElement.placeholder).toBe('Enter your email');
    });

    it('should set placeholder on textarea', () => {
      fixture.componentRef.setInput('type', 'textarea');
      fixture.componentRef.setInput('placeholder', 'Enter your message');
      fixture.detectChanges();

      const textarea = fixture.debugElement.query(By.css('textarea'));
      expect(textarea.nativeElement.placeholder).toBe('Enter your message');
    });
  });

  describe('Disabled state', () => {
    it('should not be disabled by default', () => {
      const input = fixture.debugElement.query(By.css('input'));
      expect(input.nativeElement.disabled).toBe(false);
    });

    it('should be disabled when disabled input is true', () => {
      fixture.componentRef.setInput('disabled', true);
      fixture.detectChanges();

      const input = fixture.debugElement.query(By.css('input'));
      expect(input.nativeElement.disabled).toBe(true);
    });

    it('should disable textarea when disabled is true', () => {
      fixture.componentRef.setInput('type', 'textarea');
      fixture.componentRef.setInput('disabled', true);
      fixture.detectChanges();

      const textarea = fixture.debugElement.query(By.css('textarea'));
      expect(textarea.nativeElement.disabled).toBe(true);
    });
  });

  describe('Error display', () => {
    it('should not show error message when error is empty', () => {
      fixture.componentRef.setInput('error', '');
      fixture.detectChanges();

      const error = fixture.debugElement.query(By.css('.form-field__error'));
      expect(error).toBeNull();
    });

    it('should show error message when error is provided', () => {
      fixture.componentRef.setInput('error', 'This field is required');
      fixture.detectChanges();

      const error = fixture.debugElement.query(By.css('.form-field__error'));
      expect(error).not.toBeNull();
      expect(error.nativeElement.textContent).toContain('This field is required');
    });

    it('should apply error class to input when error exists', () => {
      fixture.componentRef.setInput('error', 'Invalid email');
      fixture.detectChanges();

      const input = fixture.debugElement.query(By.css('input'));
      expect(input.nativeElement.classList.contains('form-field__input--error')).toBe(true);
    });

    it('should apply error class to textarea when error exists', () => {
      fixture.componentRef.setInput('type', 'textarea');
      fixture.componentRef.setInput('error', 'Message too short');
      fixture.detectChanges();

      const textarea = fixture.debugElement.query(By.css('textarea'));
      expect(textarea.nativeElement.classList.contains('form-field__textarea--error')).toBe(true);
    });
  });

  describe('ARIA attributes', () => {
    it('should have aria-label when label is provided', () => {
      fixture.componentRef.setInput('label', 'Email');
      fixture.detectChanges();

      const input = fixture.debugElement.query(By.css('input'));
      expect(input.nativeElement.getAttribute('aria-label')).toBe('Email');
    });

    it('should have aria-label from placeholder when no label', () => {
      fixture.componentRef.setInput('placeholder', 'Enter email');
      fixture.detectChanges();

      const input = fixture.debugElement.query(By.css('input'));
      expect(input.nativeElement.getAttribute('aria-label')).toBe('Enter email');
    });

    it('should have aria-required when required is true', () => {
      fixture.componentRef.setInput('required', true);
      fixture.detectChanges();

      const input = fixture.debugElement.query(By.css('input'));
      expect(input.nativeElement.getAttribute('aria-required')).toBe('true');
    });

    it('should have aria-invalid when error exists', () => {
      fixture.componentRef.setInput('error', 'Invalid input');
      fixture.detectChanges();

      const input = fixture.debugElement.query(By.css('input'));
      expect(input.nativeElement.getAttribute('aria-invalid')).toBe('true');
    });

    it('should have aria-describedby pointing to error when error exists', () => {
      fixture.componentRef.setInput('error', 'Invalid input');
      fixture.detectChanges();

      const input = fixture.debugElement.query(By.css('input'));
      const errorId = input.nativeElement.getAttribute('aria-describedby');
      expect(errorId).toBeTruthy();

      const error = fixture.debugElement.query(By.css(`#${errorId}`));
      expect(error).not.toBeNull();
    });

    it('should have role="alert" on error message', () => {
      fixture.componentRef.setInput('error', 'Invalid input');
      fixture.detectChanges();

      const error = fixture.debugElement.query(By.css('.form-field__error'));
      expect(error.nativeElement.getAttribute('role')).toBe('alert');
    });

    it('should have aria-live="polite" on error message', () => {
      fixture.componentRef.setInput('error', 'Invalid input');
      fixture.detectChanges();

      const error = fixture.debugElement.query(By.css('.form-field__error'));
      expect(error.nativeElement.getAttribute('aria-live')).toBe('polite');
    });
  });

  describe('ControlValueAccessor', () => {
    it('should implement writeValue', () => {
      component.writeValue('test value');
      expect(component.value).toBe('test value');
    });

    it('should handle null value in writeValue', () => {
      component.writeValue(null as any);
      expect(component.value).toBe('');
    });

    it('should register onChange callback', () => {
      const fn = vi.fn();
      component.registerOnChange(fn);
      expect(component.onChange).toBe(fn);
    });

    it('should register onTouched callback', () => {
      const fn = vi.fn();
      component.registerOnTouched(fn);
      expect(component.onTouched).toBe(fn);
    });

    it('should call onChange when input value changes', () => {
      const onChangeSpy = vi.fn();
      component.registerOnChange(onChangeSpy);
      fixture.detectChanges();

      const input = fixture.debugElement.query(By.css('input'));
      input.nativeElement.value = 'new value';
      input.nativeElement.dispatchEvent(new Event('input'));

      expect(onChangeSpy).toHaveBeenCalledWith('new value');
    });

    it('should call onTouched when input loses focus', () => {
      const onTouchedSpy = vi.fn();
      component.registerOnTouched(onTouchedSpy);
      fixture.detectChanges();

      const input = fixture.debugElement.query(By.css('input'));
      input.nativeElement.dispatchEvent(new Event('blur'));

      expect(onTouchedSpy).toHaveBeenCalled();
    });

    it('should set disabled state', () => {
      component.setDisabledState(true);
      expect(component.isDisabled).toBe(true);

      component.setDisabledState(false);
      expect(component.isDisabled).toBe(false);
    });
  });

  describe('Field ID generation', () => {
    it('should generate unique field ID', () => {
      fixture.componentRef.setInput('label', 'Email Address');
      fixture.detectChanges();

      const fieldId = component.fieldId();
      expect(fieldId).toContain('field-email-address');
    });

    it('should generate error ID based on field ID', () => {
      fixture.componentRef.setInput('label', 'Email');
      fixture.detectChanges();

      const errorId = component.errorId();
      const fieldId = component.fieldId();
      expect(errorId).toBe(`${fieldId}-error`);
    });
  });
});
