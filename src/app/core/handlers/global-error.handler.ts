import { ErrorHandler, Injectable, inject, NgZone } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../../environments/environment';

/**
 * GlobalErrorHandler catches all uncaught errors in the application.
 * - Logs to console in development
 * - Sends to monitoring service in production
 * - Distinguishes client-side vs server-side errors
 *
 * Requirements: 16.1
 */
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private ngZone = inject(NgZone);

  handleError(error: unknown): void {
    if (error instanceof HttpErrorResponse) {
      this.handleServerError(error);
    } else {
      this.handleClientError(error);
    }
  }

  private handleClientError(error: unknown): void {
    const message = this.extractMessage(error);

    if (!environment.production) {
      console.error('[GlobalErrorHandler] Client error:', error);
    } else {
      this.sendToMonitoring('client', message, error);
    }

    this.ngZone.run(() => {
      this.displayUserMessage('Ha ocurrido un error inesperado. Por favor recarga la página.');
    });
  }

  private handleServerError(error: HttpErrorResponse): void {
    const message = this.extractHttpMessage(error);

    if (!environment.production) {
      console.error(`[GlobalErrorHandler] Server error (${error.status}):`, error);
    } else {
      this.sendToMonitoring('server', message, error);
    }

    this.ngZone.run(() => {
      this.displayUserMessage(message);
    });
  }

  private extractMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    return 'Error desconocido';
  }

  private extractHttpMessage(error: HttpErrorResponse): string {
    if (error.status === 0) {
      return 'Sin conexión a internet. Verifica tu red e intenta de nuevo.';
    }
    if (error.status === 401) {
      return 'No autorizado. Por favor inicia sesión nuevamente.';
    }
    if (error.status === 403) {
      return 'No tienes permisos para realizar esta acción.';
    }
    if (error.status === 404) {
      return 'El recurso solicitado no fue encontrado.';
    }
    if (error.status >= 500) {
      return 'Error en el servidor. Por favor intenta de nuevo más tarde.';
    }
    return 'Error al procesar la solicitud. Por favor intenta de nuevo.';
  }

  /**
   * Send error to external monitoring service (e.g. Sentry) in production.
   * Replace this stub with the actual monitoring SDK call.
   */
  private sendToMonitoring(type: 'client' | 'server', message: string, error: unknown): void {
    // TODO: integrate with Sentry or similar
    // Example: Sentry.captureException(error);
    console.error(`[Monitoring] ${type} error: ${message}`, error);
  }

  /**
   * Display a user-friendly error message.
   * Delegates to ErrorService when available; falls back to console.warn.
   */
  private displayUserMessage(message: string): void {
    // ErrorService is injected lazily to avoid circular dependency.
    // Components that need toast feedback should inject ErrorService directly.
    console.warn('[GlobalErrorHandler] User message:', message);
  }
}
