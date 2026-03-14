import { Component, ChangeDetectionStrategy, input, computed, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';

/**
 * FormFieldComponent
 * 
 * A reusable form field component with consistent styling and validation.
 * Supports text, email, and textarea input types.
 * Implements ControlValueAccessor for reactive forms integration.
 * 
 * @example
 * <app-form-field
 *   [label]="'Email'"
 *   [type]="'email'"
 *   [error]="'Please enter a valid email'"
 *   [required]="true"
 *   [(ngModel)]="email">
 * </app-form-field>
 */
@Component({
  selector: 'app-form-field',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './form-field.component.html',
  styleUrl: './form-field.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => FormFieldComponent),
      multi: true
    }
  ]
})
export class FormFieldComponent implements ControlValueAccessor {
  /**
   * Field label
   */
  label = input<string>('');

  /**
   * Input type (text, email, textarea)
   */
  type = input<'text' | 'email' | 'textarea'>('text');

  /**
   * Placeholder text
   */
  placeholder = input<string>('');

  /**
   * Error message to display
   */
  error = input<string>('');

  /**
   * Required field indicator
   */
  required = input<boolean>(false);

  /**
   * Disabled state
   */
  disabled = input<boolean>(false);

  /**
   * Unique ID for the input field
   */
  fieldId = computed(() => {
    const label = this.label().toLowerCase().replace(/\s+/g, '-');
    return `field-${label}-${Math.random().toString(36).substr(2, 9)}`;
  });

  /**
   * Error ID for aria-describedby
   */
  errorId = computed(() => `${this.fieldId()}-error`);

  // ControlValueAccessor implementation
  value: string = '';
  onChange: (value: string) => void = () => {};
  onTouched: () => void = () => {};
  isDisabled: boolean = false;

  writeValue(value: string): void {
    this.value = value || '';
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
  }

  onInput(event: Event): void {
    const target = event.target as HTMLInputElement | HTMLTextAreaElement;
    this.value = target.value;
    this.onChange(this.value);
  }

  onBlur(): void {
    this.onTouched();
  }
}
