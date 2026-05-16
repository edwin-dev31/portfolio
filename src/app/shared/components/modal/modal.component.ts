import { Component, ChangeDetectionStrategy, input, output, effect, ElementRef, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.escape)': 'onEscapeKey()'
  }
})
export class ModalComponent {
  
  isOpen = input.required<boolean>();

  
  title = input<string>('');

  
  close = output<void>();

  
  private dialogElement = viewChild<ElementRef<HTMLElement>>('dialog');

  constructor() {
    
    effect(() => {
      if (this.isOpen()) {
        this.trapFocus();
      }
    });
  }

  
  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.close.emit();
    }
  }

  
  onEscapeKey(): void {
    if (this.isOpen()) {
      this.close.emit();
    }
  }

  
  private trapFocus(): void {
    setTimeout(() => {
      const dialog = this.dialogElement();
      if (dialog) {
        const focusableElements = dialog.nativeElement.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements.length > 0) {
          (focusableElements[0] as HTMLElement).focus();
        }
      }
    }, 0);
  }
}
