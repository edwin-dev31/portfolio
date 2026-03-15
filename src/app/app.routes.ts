import { Routes } from '@angular/router';

/**
 * Root application routes
 *
 * - Public feature loaded lazily via loadChildren
 * - Admin feature loaded lazily via loadChildren
 * - Wildcard route renders NotFoundComponent for unknown paths
 *
 * Requirements: 8.1, 8.2, 8.5
 */
export const routes: Routes = [
  {
    path: '',
    loadChildren: () =>
      import('./features/public/public.routes').then(m => m.publicRoutes)
  },
  {
    path: 'admin',
    loadChildren: () =>
      import('./features/admin/admin.routes').then(m => m.adminRoutes)
  },
  {
    path: '**',
    loadComponent: () =>
      import('./shared/components/not-found/not-found.component').then(
        m => m.NotFoundComponent
      ),
    title: '404 – Page Not Found'
  }
];
