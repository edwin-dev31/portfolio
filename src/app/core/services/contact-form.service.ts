import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ContactMessage } from '../../models';

@Injectable({
  providedIn: 'root'
})
export class ContactFormService {
  private http = inject(HttpClient);
  private webhookUrl = environment.contactWebhookUrl;

  
  sendMessage(message: ContactMessage): Observable<any> {
    return this.http.post(this.webhookUrl, message);
  }
}
