import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './card.component.html',
  styleUrl: './card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CardComponent {
  
  elevation = input<'none' | 'sm' | 'md' | 'lg' | 'xl'>('md');

  
  padding = input<'none' | 'sm' | 'md' | 'lg' | 'xl'>('md');

  
  hoverable = input<boolean>(true);

  
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
