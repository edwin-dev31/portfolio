import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ContactMessage } from '../../models';

/**
 * ContactFormService handles form submissions via external webhook
 */
@Injectable({
  providedIn: 'root'
})
export class ContactFormService {
  private http = inject(HttpClient);
  private webhookUrl = environment.contactWebhookUrl;

  /**
   * Send a contact message using the configured webhook
   * @param message - The contact message to send
   * @returns Observable of the response
   */
  sendMessage(message: ContactMessage): Observable<any> {
    return this.http.post(this.webhookUrl, message);
  }
}
