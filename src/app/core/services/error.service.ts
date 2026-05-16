import { Injectable, signal, computed } from '@angular/core';

export type ToastType = 'error' | 'warning' | 'info' | 'success';

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

const AUTO_DISMISS_MS = 5000;

@Injectable({
  providedIn: 'root'
})
export class ErrorService {
  private _toasts = signal<Toast[]>([]);
  private nextId = 0;

  
  readonly toasts = this._toasts.asReadonly();

  
  readonly hasToasts = computed(() => this._toasts().length > 0);

  

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

  
  show(message: string, type: ToastType = 'info'): void {
    this.addToast(message, type);
  }

  
  dismiss(id: number): void {
    this._toasts.update(toasts => toasts.filter(t => t.id !== id));
  }

  

  private addToast(message: string, type: ToastType): void {
    const id = ++this.nextId;
    const toast: Toast = { id, message, type };

    this._toasts.update(toasts => [...toasts, toast]);

    
    setTimeout(() => this.dismiss(id), AUTO_DISMISS_MS);
  }
}
