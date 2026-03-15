import { Routes } from '@angular/router';
import { authGuard, canDeactivateGuard } from '../../core/guards';

/**
 * Admin feature routes
 * Protected by authGuard except for login route
 */
export const adminRoutes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./components/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./components/admin-shell/admin-shell.component').then(m => m.AdminShellComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'projects/new',
        loadComponent: () => import('./components/project-editor/project-editor.component').then(m => m.ProjectEditorComponent),
        canDeactivate: [canDeactivateGuard]
      },
      {
        path: 'projects/:id/edit',
        loadComponent: () => import('./components/project-editor/project-editor.component').then(m => m.ProjectEditorComponent),
        canDeactivate: [canDeactivateGuard]
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  }
];
