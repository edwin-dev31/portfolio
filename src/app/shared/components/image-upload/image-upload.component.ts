import { Component, ChangeDetectionStrategy, input, model, signal, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CloudinaryService } from '../../../core/services/cloudinary.service';

@Component({
  selector: 'app-image-upload',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './image-upload.component.html',
  styleUrl: './image-upload.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ImageUploadComponent {
  
  images = model<string[]>([]);

  
  maxImages = input<number>(5);

  
  previews = signal<string[]>([]);

  
  isUploading = signal<boolean>(false);

  
  isDragOver = signal<boolean>(false);

  constructor() {
    
    effect(() => {
      this.previews.set(this.images());
    });
  }

  
  async onFileSelect(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    await this.processFiles(Array.from(input.files));
  }

  
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(true);
  }

  
  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
  }

  
  async onDrop(event: DragEvent): Promise<void> {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);

    if (!event.dataTransfer?.files) return;

    const files = Array.from(event.dataTransfer.files).filter(file => 
      file.type.startsWith('image/')
    );

    await this.processFiles(files);
  }

  
  private async processFiles(files: File[]): Promise<void> {
    const currentImages = this.images();
    const remainingSlots = this.maxImages() - currentImages.length;
    
    if (remainingSlots <= 0) return;

    const filesToUpload = files.slice(0, remainingSlots);
    
    this.isUploading.set(true);

    try {
      const uploadPromises = filesToUpload.map(file => this.uploadImage(file));
      const urls = await Promise.all(uploadPromises);
      
      this.images.update(current => [...current, ...urls]);
      this.updatePreviews();
    } finally {
      this.isUploading.set(false);
    }
  }

  private cloudinaryService = inject(CloudinaryService);

  
  private async uploadImage(file: File): Promise<string> {
    try {
      return await this.cloudinaryService.uploadImage(file, 'portfolio');
    } catch (error) {
      console.error('Failed to upload image to Cloudinary:', error);
      
      
      throw error;
    }
  }

  
  removeImage(index: number): void {
    this.images.update(current => current.filter((_, i) => i !== index));
    this.updatePreviews();
  }

  
  private updatePreviews(): void {
    this.previews.set(this.images());
  }

  
  isMaxReached(): boolean {
    return this.images().length >= this.maxImages();
  }
}
