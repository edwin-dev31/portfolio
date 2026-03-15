import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { NgClass } from '@angular/common';
import { ErrorService, Toast } from '../../../core/services/error.service';

/**
 * ToastComponent renders the active toast notifications from ErrorService.
 * Placed in the root AppComponent template so it's always visible.
 *
 * Requirements: 16.1
 */
@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (errorService.hasToasts()) {
      <div class="toast-container" aria-live="polite" aria-atomic="false">
        @for (toast of errorService.toasts(); track toast.id) {
          <div
            class="toast"
            [ngClass]="'toast--' + toast.type"
            role="alert"
          >
            <span class="toast__message">{{ toast.message }}</span>
            <button
              class="toast__close"
              type="button"
              aria-label="Cerrar notificación"
              (click)="errorService.dismiss(toast.id)"
            >✕</button>
          </div>
        }
      </div>
    }
  `,
  styles: [`
    .toast-container {
      position: fixed;
      bottom: 1.5rem;
      right: 1.5rem;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      max-width: 360px;
    }

    .toast {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 0.875rem 1rem;
      border-radius: var(--radius-md, 8px);
      font-size: var(--text-sm, 0.875rem);
      line-height: 1.4;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      animation: toast-in 200ms ease-out;

      &--error   { background: #c53030; color: #fff; }
      &--warning { background: #c05621; color: #fff; }
      &--info    { background: #2b6cb0; color: #fff; }
      &--success { background: #276749; color: #fff; }
    }

    .toast__message { flex: 1; }

    .toast__close {
      background: none;
      border: none;
      color: inherit;
      cursor: pointer;
      font-size: 0.75rem;
      opacity: 0.8;
      padding: 0;
      line-height: 1;

      &:hover { opacity: 1; }
    }

    @keyframes toast-in {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class ToastComponent {
  protected readonly errorService = inject(ErrorService);
}
