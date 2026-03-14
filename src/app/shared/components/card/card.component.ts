import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * CardComponent
 * 
 * A reusable card component with glassmorphism effect.
 * Supports different elevation levels and padding variants.
 * Includes hover micro-interactions with custom easing.
 * 
 * @example
 * <app-card elevation="md" padding="lg">
 *   <h3>Card Title</h3>
 *   <p>Card content goes here</p>
 * </app-card>
 */
@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './card.component.html',
  styleUrl: './card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CardComponent {
  /**
   * Card elevation level (affects shadow depth)
   */
  elevation = input<'none' | 'sm' | 'md' | 'lg' | 'xl'>('md');

  /**
   * Card padding size
   */
  padding = input<'none' | 'sm' | 'md' | 'lg' | 'xl'>('md');

  /**
   * Enable hover effect
   */
  hoverable = input<boolean>(true);

  /**
   * Computed CSS classes based on elevation, padding, and hover state
   */
  cardClasses = computed(() => {
    const classes = ['card'];
    
    classes.push(`card--elevation-${this.elevation()}`);
    classes.push(`card--padding-${this.padding()}`);
    
    if (this.hoverable()) {
      classes.push('card--hoverable');
    }
    
    return classes.join(' ');
  });
}
