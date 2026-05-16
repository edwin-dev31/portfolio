import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './button.component.html',
  styleUrl: './button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ButtonComponent {
  
  variant = input<'primary' | 'secondary' | 'ghost'>('primary');

  
  size = input<'sm' | 'md' | 'lg'>('md');

  
  disabled = input<boolean>(false);

  
  type = input<'button' | 'submit' | 'reset'>('button');

  
  buttonClasses = computed(() => {
    return `btn btn--${this.variant()} btn--${this.size()}`;
  });
}
