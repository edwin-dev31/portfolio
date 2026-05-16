import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { ButtonComponent } from '../../../../shared/components/button/button.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonComponent, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  
  isLoading = signal<boolean>(false);

  
  errorMessage = signal<string>('');

  
  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  
  get emailControl() {
    return this.loginForm.get('email');
  }

  
  get passwordControl() {
    return this.loginForm.get('password');
  }

  
  getEmailError(): string {
    const control = this.emailControl;
    if (control?.hasError('required')) {
      return 'Email is required';
    }
    if (control?.hasError('email')) {
      return 'Enter a valid email address';
    }
    return '';
  }

  
  getPasswordError(): string {
    const control = this.passwordControl;
    if (control?.hasError('required')) {
      return 'Password is required';
    }
    if (control?.hasError('minlength')) {
      return 'Password must be at least 6 characters';
    }
    return '';
  }

  
  async onSubmit(): Promise<void> {
    
    this.errorMessage.set('');

    
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
      
      await this.authService.login(email, password);

      
      await this.router.navigate(['/admin/dashboard']);
    } catch (error: any) {
      
      this.errorMessage.set(error.message || 'Login failed. Please try again.');
    } finally {
      this.isLoading.set(false);
    }
  }
}
