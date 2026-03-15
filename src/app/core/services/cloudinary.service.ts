import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CloudinaryService {
  private readonly cloudName = environment.cloudinary.cloudName;
  private readonly apiKey = environment.cloudinary.apiKey;
  private readonly apiSecret = environment.cloudinary.apiSecret;

  async uploadImage(file: File, folder: string = 'portfolio'): Promise<string> {
    const timestamp = Math.round(new Date().getTime() / 1000).toString();

    const params: Record<string, string> = {
      folder: folder,
      timestamp: timestamp
    };

    const signature = await this.generateSignature(params);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', this.apiKey);
    formData.append('timestamp', timestamp);
    formData.append('folder', folder);
    formData.append('signature', signature);

    const url = `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Upload failed');
      }

      const data = await response.json();
      return data.secure_url;
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw error;
    }
  }

  private async generateSignature(params: Record<string, string>): Promise<string> {
    const sortedKeys = Object.keys(params).sort();
    
    const serializedParams = sortedKeys
      .map(key => `${key}=${params[key]}`)
      .join('&');
    
    const stringToSign = serializedParams + this.apiSecret;
    
    return await this.sha1(stringToSign);
  }

  private async sha1(message: string): Promise<string> {
    const msgUint8 = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-1', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  }
}
