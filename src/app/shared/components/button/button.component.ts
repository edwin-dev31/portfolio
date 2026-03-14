import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * ButtonComponent
 * 
 * A reusable button component with multiple variants and sizes.
 * Supports primary, secondary, and ghost variants with accessibility features.
 * 
 * @example
 * <app-button variant="primary" size="md" [disabled]="false">
 *   Click me
 * </app-button>
 */
@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './button.component.html',
  styleUrl: './button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ButtonComponent {
  /**
   * Button variant style
   */
  variant = input<'primary' | 'secondary' | 'ghost'>('primary');

  /**
   * Button size
   */
  size = input<'sm' | 'md' | 'lg'>('md');

  /**
   * Disabled state
   */
  disabled = input<boolean>(false);

  /**
   * Button type attribute
   */
  type = input<'button' | 'submit' | 'reset'>('button');

  /**
   * Computed CSS classes based on variant and size
   */
  buttonClasses = computed(() => {
    return `btn btn--${this.variant()} btn--${this.size()}`;
  });
}
