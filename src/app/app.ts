import { Component, signal, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './core/services/theme.service';
import { ThemeToggleComponent } from './shared/components/theme-toggle/theme-toggle.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ThemeToggleComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('portfolio-angular');
  private themeService = inject(ThemeService);
  
  constructor() {
    // Initialize theme on app startup
    this.themeService.initializeTheme();
  }
}
