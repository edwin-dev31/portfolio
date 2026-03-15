import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { throwError, timer } from 'rxjs';
import { catchError, retry, switchMap } from 'rxjs/operators';

/** Maximum number of retries for network errors */
const MAX_RETRIES = 2;

/**
 * Determines whether an error is retryable.
 * Retries on network failures (status 0) and 5xx server errors.
 */
function isRetryable(error: HttpErrorResponse): boolean {
  return error.status === 0 || error.status >= 500;
}

/**
 * Transforms an HttpErrorResponse into a user-friendly Error.
 */
function toUserFriendlyError(error: HttpErrorResponse): Error {
  if (error.status === 0) {
    return new Error('Sin conexión a internet. Verifica tu red e intenta de nuevo.');
  }
  if (error.status === 401) {
    return new Error('Sesión expirada. Por favor inicia sesión nuevamente.');
  }
  if (error.status === 403) {
    return new Error('No tienes permisos para realizar esta acción.');
  }
  if (error.status === 404) {
    return new Error('El recurso solicitado no fue encontrado.');
  }
  if (error.status === 429) {
    return new Error('Demasiadas solicitudes. Por favor espera un momento e intenta de nuevo.');
  }
  if (error.status >= 500) {
    return new Error('Error en el servidor. Por favor intenta de nuevo más tarde.');
  }
  return new Error('Error al procesar la solicitud. Por favor intenta de nuevo.');
}

/**
 * HTTP interceptor that:
 * - Retries network errors up to MAX_RETRIES times with exponential backoff
 * - Transforms HTTP errors into user-friendly messages
 *
 * Requirements: 16.1
 */
export const errorInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  let attempt = 0;

  return next(req).pipe(
    // Retry with exponential backoff for retryable errors
    catchError((error: HttpErrorResponse) => {
      if (isRetryable(error) && attempt < MAX_RETRIES) {
        attempt++;
        const delayMs = Math.pow(2, attempt) * 500; // 1s, 2s
        return timer(delayMs).pipe(
          switchMap(() => next(req))
        );
      }
      return throwError(() => error);
    }),
    // Final error transformation to user-friendly message
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        return throwError(() => toUserFriendlyError(error));
      }
      return throwError(() => error);
    })
  );
};
