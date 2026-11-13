import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/scheduler/dashboard.component').then((m) => m.DashboardComponent),
  },
  {
    path: 'auth/callback',
    loadComponent: () =>
      import('./features/auth/oauth-callback.component').then((m) => m.OAuthCallbackComponent),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
