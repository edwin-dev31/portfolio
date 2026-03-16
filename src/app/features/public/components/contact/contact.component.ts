import { Component, ChangeDetectionStrategy, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { StateService } from '../../../../core/services/state.service';
import { ContactFormService } from '../../../../core/services/contact-form.service';
import { Contact } from '../../../../models/contact.model';
import { ContactMessage } from '../../../../models/contact-message.model';
import { Profile } from '../../../../models/profile.model';

/**
 * ContactComponent
 * 
 * Displays contact information and a contact form with validation.
 * 
 * Features:
 * - Shows email and social links from profile
 * - Contact form with validation
 * - ARIA labels for accessibility
 * - Availability status indicator
 * - Responsive design
 * 
 * @example
 * <app-contact />
 */
@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContactComponent implements OnInit {
  private stateService = inject(StateService);
  private contactFormService = inject(ContactFormService);
  private fb = inject(FormBuilder);

  contact = signal<Contact | null>(null);
  profile = signal<Profile | null>(null);
  isLoading = signal(true);
  isSubmitting = signal(false);
  submitSuccess = signal(false);
  submitError = signal<string | null>(null);

  contactForm: FormGroup;

  constructor() {
    this.contactForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      subject: ['Proposal for new project', [Validators.required, Validators.minLength(3)]],
      message: ['I would like to discuss a potential project with you.', [Validators.required, Validators.minLength(10)]]
    });
  }

  ngOnInit(): void {
    this.loadData();
  }

  private async loadData(): Promise<void> {
    try {
      await Promise.all([
        this.stateService.loadContact(),
        this.stateService.loadProfile()
      ]);
      
      this.contact.set(this.stateService.contact());
      this.profile.set(this.stateService.profile());
    } catch (error) {
      console.error('Failed to load contact data:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Check if a form field has an error and has been touched
   */
  hasError(fieldName: string): boolean {
    const field = this.contactForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  /**
   * Get error message for a form field
   */
  getErrorMessage(fieldName: string): string {
    const field = this.contactForm.get(fieldName);
    if (!field || !field.errors) return '';

    if (field.errors['required']) {
      return 'This field is required';
    }
    if (field.errors['email']) {
      return 'Please enter a valid email address';
    }
    if (field.errors['minlength']) {
      const minLength = field.errors['minlength'].requiredLength;
      return `Must be at least ${minLength} characters`;
    }

    return 'Invalid value';
  }

  /**
   * Handle form submission
   */
  async onSubmit(): Promise<void> {
    if (this.contactForm.invalid) {
      this.contactForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.submitError.set(null);
    this.submitSuccess.set(false);

    try {
      const message: ContactMessage = this.contactForm.value;
      
      await new Promise((resolve, reject) => {
        this.contactFormService.sendMessage(message).subscribe({
          next: (response: any) => {
            resolve(response);
          },
          error: (error: any) => {
            console.error('Form submission error:', error);
            reject(error);
          }
        });
      });
      
      this.submitSuccess.set(true);
      this.contactForm.reset();
    } catch (error) {
      this.submitError.set('Failed to send message. Please try again.');
    } finally {
      this.isSubmitting.set(false);
    }
  }

  /**
   * Get current year for availability
   */
  get currentYear(): number {
    return new Date().getFullYear();
  }

  /**
   * Check if available for work
   */
  get isAvailable(): boolean {
    const profile = this.profile();
    return profile ? profile.yearAvailable >= this.currentYear : false;
  }

  /**
   * Ensure URL has proper protocol
   * @param url - URL to normalize
   * @returns URL with https:// protocol
   */
  normalizeUrl(url: string): string {
    if (!url) return '';
    
    // If URL already has protocol, return as is
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    
    // Add https:// protocol
    return `https://${url}`;
  }
}
