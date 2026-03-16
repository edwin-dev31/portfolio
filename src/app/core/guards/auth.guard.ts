import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Functional auth guard that protects admin routes
 * Redirects to /admin/login if user is not authenticated
 * 
 * Requirements: 4.2, 8.3
 */
export const authGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const user = await authService.waitForAuth();

  if (user) {
    return true;
  }

  // Redirect to login page if not authenticated
  return router.createUrlTree(['/admin/login']);
};
