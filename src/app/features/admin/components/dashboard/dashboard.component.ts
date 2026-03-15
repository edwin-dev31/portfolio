import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * DashboardComponent
 * 
 * Admin dashboard - placeholder for future implementation
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard">
      <h1>Admin Dashboard</h1>
      <p>Dashboard implementation coming soon...</p>
    </div>
  `,
  styles: [`
    .dashboard {
      padding: var(--space-xl);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent {}
