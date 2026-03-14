import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/public/components/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'project/:id',
    loadComponent: () => import('./features/public/components/project-detail/project-detail.component').then(m => m.ProjectDetailComponent)
  }
];
