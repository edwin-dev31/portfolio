import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

/**
 * AdminShellComponent
 * 
 * Layout wrapper for admin area with navigation sidebar,
 * user info, logout button, and theme toggle.
 * Responsive with mobile menu support.
 * 
 * Requirements: 6.6
 */
@Component({
  selector: 'app-admin-shell',
  standalone: true,
  imports: [
    CommonModule, 
    RouterOutlet, 
    RouterLink, 
    RouterLinkActive
  ],
  templateUrl: './admin-shell.component.html',
  styleUrl: './admin-shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminShellComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  // State
  currentUser = this.authService.currentUser;
  isMobileMenuOpen = signal(false);

  /**
   * Toggle mobile menu
   */
  toggleMobileMenu(): void {
    this.isMobileMenuOpen.update(isOpen => !isOpen);
  }

  /**
   * Close mobile menu
   */
  closeMobileMenu(): void {
    this.isMobileMenuOpen.set(false);
  }

  /**
   * Logout user and redirect to login
   */
  async logout(): Promise<void> {
    try {
      await this.authService.logout();
      this.router.navigate(['/admin/login']);
    } catch (error) {
      console.error('Error logging out:', error);
      alert('Error al cerrar sesión. Por favor intenta de nuevo.');
    }
  }

  /**
   * Get user display name or email
   */
  getUserDisplayName(): string {
    const user = this.currentUser();
    if (!user) return 'Usuario';
    return user.displayName || user.email || 'Usuario';
  }

  /**
   * Get user initials for avatar
   */
  getUserInitials(): string {
    const user = this.currentUser();
    if (!user) return 'U';
    
    if (user.displayName) {
      const names = user.displayName.split(' ');
      if (names.length >= 2) {
        return `${names[0][0]}${names[1][0]}`.toUpperCase();
      }
      return user.displayName.substring(0, 2).toUpperCase();
    }
    
    if (user.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    
    return 'U';
  }
}
