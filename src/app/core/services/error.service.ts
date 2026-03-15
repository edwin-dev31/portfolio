import { Injectable, signal, computed } from '@angular/core';

export type ToastType = 'error' | 'warning' | 'info' | 'success';

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

const AUTO_DISMISS_MS = 5000;

/**
 * ErrorService manages toast notifications using Angular signals.
 * Supports error, warning, info, and success types.
 * Toasts auto-dismiss after 5 seconds.
 *
 * Requirements: 16.1
 */
@Injectable({
  providedIn: 'root'
})
export class ErrorService {
  private _toasts = signal<Toast[]>([]);
  private nextId = 0;

  /** Readonly signal of active toasts */
  readonly toasts = this._toasts.asReadonly();

  /** True when there is at least one active toast */
  readonly hasToasts = computed(() => this._toasts().length > 0);

  // ── Public API ──────────────────────────────────────────────────────────

  showErrorToast(message: string): void {
    this.addToast(message, 'error');
  }

  showWarningToast(message: string): void {
    this.addToast(message, 'warning');
  }

  showInfoToast(message: string): void {
    this.addToast(message, 'info');
  }

  showSuccessToast(message: string): void {
    this.addToast(message, 'success');
  }

  /** Show a toast of any supported type */
  show(message: string, type: ToastType = 'info'): void {
    this.addToast(message, type);
  }

  /** Manually dismiss a toast by its id */
  dismiss(id: number): void {
    this._toasts.update(toasts => toasts.filter(t => t.id !== id));
  }

  // ── Private helpers ──────────────────────────────────────────────────────

  private addToast(message: string, type: ToastType): void {
    const id = ++this.nextId;
    const toast: Toast = { id, message, type };

    this._toasts.update(toasts => [...toasts, toast]);

    // Auto-dismiss after 5 seconds
    setTimeout(() => this.dismiss(id), AUTO_DISMISS_MS);
  }
}
