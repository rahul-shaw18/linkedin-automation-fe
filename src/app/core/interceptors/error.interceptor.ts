import { HttpContextToken, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { RdxToastManager } from '@radix-ng/primitives/toast';

export const SKIP_ERROR_NOTIFICATION = new HttpContextToken<boolean>(() => false);

let lastErrorMsg = '';
let lastErrorTime = 0;

export function getErrorMessage(error: HttpErrorResponse): string {
  if (error.status === 0) {
    return 'Unable to connect to the server. Please check your internet connection.';
  }

  const body = error.error;
  if (body && typeof body === 'object') {
    const message = (body as Record<string, unknown>)['message'];
    if (Array.isArray(message) && message.length > 0) {
      return message.join('. ');
    }
    if (typeof message === 'string' && message.trim().length > 0) {
      return message;
    }
  }

  switch (error.status) {
    case 400:
      return 'The request was invalid. Please check your input.';
    case 401:
      return 'Your session has expired. Please sign in again.';
    case 403:
      return 'You do not have permission to perform this action.';
    case 404:
      return 'The requested resource was not found.';
    case 409:
      return 'A conflict occurred with the current state of the resource.';
    case 429:
      return 'Too many requests. Please wait a moment and try again.';
    default:
      return error.status >= 500
        ? 'A server error occurred. Please try again later.'
        : 'Request failed. Please try again.';
  }
}

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toastManager = inject(RdxToastManager);

  // Suppress popups for silent background queries (health, session check, SSE)
  const isSilent =
    req.context.get(SKIP_ERROR_NOTIFICATION) ||
    req.url.includes('/health') ||
    req.url.includes('/auth/linkedin/me') ||
    req.url.includes('/posts/events/');

  return next(req).pipe(
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse && !isSilent) {
        const errorMsg = getErrorMessage(err);
        const now = Date.now();
        if (errorMsg !== lastErrorMsg || now - lastErrorTime > 2000) {
          lastErrorMsg = errorMsg;
          lastErrorTime = now;
          toastManager.add({
            type: 'error',
            title: err.status >= 500 ? 'Server Error' : 'Request Failed',
            description: errorMsg,
            priority: 'high',
            timeout: 5000,
          });
        }
      }

      return throwError(() => err);
    }),
  );
};
