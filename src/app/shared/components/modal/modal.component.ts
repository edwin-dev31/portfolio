import { Component, ChangeDetectionStrategy, input, output, effect, ElementRef, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * ModalComponent
 * 
 * A reusable modal dialog component with accessibility features.
 * Supports backdrop click and Escape key to close.
 * Implements focus trap for keyboard navigation.
 * 
 * @example
 * <app-modal [isOpen]="showModal" [title]="'Confirm Action'" (close)="onClose()">
 *   <p>Are you sure you want to proceed?</p>
 * </app-modal>
 */
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
  /**
   * Controls modal visibility
   */
  isOpen = input.required<boolean>();

  /**
   * Modal title
   */
  title = input<string>('');

  /**
   * Event emitted when modal should close
   */
  close = output<void>();

  /**
   * Reference to the modal dialog element for focus management
   */
  private dialogElement = viewChild<ElementRef<HTMLElement>>('dialog');

  constructor() {
    // Focus trap effect when modal opens
    effect(() => {
      if (this.isOpen()) {
        this.trapFocus();
      }
    });
  }

  /**
   * Handle backdrop click to close modal
   */
  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.close.emit();
    }
  }

  /**
   * Handle Escape key to close modal
   */
  onEscapeKey(): void {
    if (this.isOpen()) {
      this.close.emit();
    }
  }

  /**
   * Trap focus within modal for accessibility
   */
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
