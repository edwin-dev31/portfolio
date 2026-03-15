import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../../core/services/theme.service';

/**
 * ThemeToggleComponent
 * 
 * A button component that toggles between light and dark themes.
 * Shows sun icon for light mode and moon icon for dark mode.
 * 
 * @example
 * <app-theme-toggle />
 */
@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './theme-toggle.component.html',
  styleUrl: './theme-toggle.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ThemeToggleComponent {
  private themeService = inject(ThemeService);

  /**
   * Current theme signal
   */
  currentTheme = this.themeService.currentTheme;

  /**
   * Toggle between light and dark themes
   */
  toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}
