import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { ButtonComponent } from '../../../../shared/components/button/button.component';

/**
 * LoginComponent
 * 
 * Provides authentication interface for admin users.
 * Features:
 * - Email and password form fields with validation
 * - Error message display for failed authentication
 * - Redirect to dashboard on successful login
 * - Optional "Remember me" checkbox
 * 
 * Requirements: 4.1, 4.6
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  /**
   * Signal for loading state during login
   */
  isLoading = signal<boolean>(false);

  /**
   * Signal for error message display
   */
  errorMessage = signal<string>('');

  /**
   * Reactive form for login
   */
  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    rememberMe: [false]
  });

  /**
   * Get email form control for template access
   */
  get emailControl() {
    return this.loginForm.get('email');
  }

  /**
   * Get password form control for template access
   */
  get passwordControl() {
    return this.loginForm.get('password');
  }

  /**
   * Get email validation error message
   */
  getEmailError(): string {
    const control = this.emailControl;
    if (control?.hasError('required')) {
      return 'El correo electrónico es requerido';
    }
    if (control?.hasError('email')) {
      return 'Ingresa un correo electrónico válido';
    }
    return '';
  }

  /**
   * Get password validation error message
   */
  getPasswordError(): string {
    const control = this.passwordControl;
    if (control?.hasError('required')) {
      return 'La contraseña es requerida';
    }
    if (control?.hasError('minlength')) {
      return 'La contraseña debe tener al menos 6 caracteres';
    }
    return '';
  }

  /**
   * Handle form submission
   * Validates form, calls AuthService.login(), and redirects on success
   */
  async onSubmit(): Promise<void> {
    // Clear previous error
    this.errorMessage.set('');

    // Validate form
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const { email, password } = this.loginForm.value;

    if (!email || !password) {
      return;
    }

    this.isLoading.set(true);

    try {
      // Attempt login
      await this.authService.login(email, password);

      // Redirect to dashboard on success
      await this.router.navigate(['/admin/dashboard']);
    } catch (error: any) {
      // Display error message
      this.errorMessage.set(error.message || 'Error al iniciar sesión. Por favor intenta de nuevo.');
    } finally {
      this.isLoading.set(false);
    }
  }
}
