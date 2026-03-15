import { Component, ChangeDetectionStrategy, input, model, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CloudinaryService } from '../../../core/services/cloudinary.service';

/**
 * ImageUploadComponent
 * 
 * A reusable image upload component with preview and drag-and-drop support.
 * Supports multiple image uploads with configurable maximum limit.
 * 
 * @example
 * <app-image-upload 
 *   [(images)]="projectImages" 
 *   [maxImages]="5">
 * </app-image-upload>
 */
@Component({
  selector: 'app-image-upload',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './image-upload.component.html',
  styleUrl: './image-upload.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ImageUploadComponent {
  /**
   * Array of image URLs (two-way binding)
   */
  images = model<string[]>([]);

  /**
   * Maximum number of images allowed
   */
  maxImages = input<number>(5);

  /**
   * Preview URLs for uploaded images
   */
  previews = signal<string[]>([]);

  /**
   * Loading state during upload
   */
  isUploading = signal<boolean>(false);

  /**
   * Drag over state for visual feedback
   */
  isDragOver = signal<boolean>(false);

  /**
   * Handle file selection from input
   */
  async onFileSelect(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    await this.processFiles(Array.from(input.files));
  }

  /**
   * Handle drag over event
   */
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(true);
  }

  /**
   * Handle drag leave event
   */
  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
  }

  /**
   * Handle file drop
   */
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

  /**
   * Process and upload files
   */
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

  /**
   * Upload single image to Cloudinary
   */
  private async uploadImage(file: File): Promise<string> {
    try {
      return await this.cloudinaryService.uploadImage(file, 'portfolio');
    } catch (error) {
      console.error('Failed to upload image to Cloudinary:', error);
      // Fallback to object URL if upload fails (optional, but good for UX if you want to show SOMETHING)
      // Actually, better to throw so the user knows it failed.
      throw error;
    }
  }

  /**
   * Remove image at specific index
   */
  removeImage(index: number): void {
    this.images.update(current => current.filter((_, i) => i !== index));
    this.updatePreviews();
  }

  /**
   * Update preview URLs
   */
  private updatePreviews(): void {
    this.previews.set(this.images());
  }

  /**
   * Check if max images limit is reached
   */
  isMaxReached(): boolean {
    return this.images().length >= this.maxImages();
  }
}
