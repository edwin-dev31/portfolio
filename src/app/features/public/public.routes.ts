import { Routes } from '@angular/router';

/**
 * Public feature routes
 * Accessible without authentication
 * Implements lazy loading for optimal performance
 * 
 * Requirements: 8.1, 8.2, 8.6
 */
export const publicRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/home/home.component').then(m => m.HomeComponent),
    title: 'Home'
  },
  {
    path: 'project/:id',
    loadComponent: () => import('./components/project-detail/project-detail.component').then(m => m.ProjectDetailComponent),
    title: 'Project Detail'
  },
  {
    path: 'contact',
    loadComponent: () => import('./components/contact/contact.component').then(m => m.ContactComponent),
    title: 'Contact'
  }
];
