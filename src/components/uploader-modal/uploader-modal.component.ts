import { Component, ChangeDetectionStrategy, output, inject, signal, computed } from '@angular/core';
import { CommonModule, formatNumber } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormArray, FormGroup } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { GeminiService } from '../../services/gemini.service';

interface UploadFile {
  file: File;
  previewUrl: string;
  progress: number;
  error?: string;
  assetId?: string;
}

@Component({
  selector: 'app-uploader-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './uploader-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UploaderModalComponent {
  close = output<void>();
  uploadComplete = output<void>();

  private api = inject(ApiService);
  private fb = inject(FormBuilder);
  private geminiService = inject(GeminiService);

  isUploading = signal(false);
  isDragging = signal(false);
  filesToUpload = signal<UploadFile[]>([]);
  altTextStates = signal<('idle' | 'generating' | 'done')[]>([]);
  
  uploadForm = this.fb.group({
    files: this.fb.array([])
  });

  get filesFormArray() {
    return this.uploadForm.get('files') as FormArray;
  }
  
  onClose() {
    if (!this.isUploading()) {
      this.close.emit();
    }
  }

  onFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.addFiles(input.files);
      input.value = ''; // Reset input to allow selecting the same file again
    }
  }

  onFileDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragging.set(false);
    if (event.dataTransfer?.files) {
      this.addFiles(event.dataTransfer.files);
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragging.set(false);
  }

  addFiles(fileList: FileList) {
    const MAX_SIZE_MB = 25;
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'application/pdf'];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const currentIndex = this.filesToUpload().length;
      let error: string | undefined;

      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        error = `Exceeds ${MAX_SIZE_MB}MB limit`;
      } else if (!ALLOWED_TYPES.includes(file.type)) {
        error = `Unsupported type: ${file.type}`;
      }
      
      const previewUrl = URL.createObjectURL(file);
      
      this.filesToUpload.update(files => [...files, { file, previewUrl, progress: 0, error }]);
      
      this.filesFormArray.push(this.fb.group({
        alt: [{value: '', disabled: !!error}],
        tags: [{value: '', disabled: !!error}]
      }));

      this.altTextStates.update(states => [...states, 'idle']);

      if (file.type.startsWith('image/') && !error) {
        this.generateAltTextForFile(currentIndex);
      }
    }
  }

  removeFile(index: number) {
    const fileToRemove = this.filesToUpload()[index];
    if (fileToRemove) {
      URL.revokeObjectURL(fileToRemove.previewUrl);
    }
    this.filesToUpload.update(files => files.filter((_, i) => i !== index));
    this.filesFormArray.removeAt(index);
    this.altTextStates.update(states => {
      const newStates = [...states];
      newStates.splice(index, 1);
      return newStates;
    });
  }

  async uploadAll() {
    this.isUploading.set(true);
    
    const filesToProcess = this.filesToUpload().filter(f => !f.error);
    const formValues = this.filesFormArray.getRawValue().filter((_, i) => !this.filesToUpload()[i].error);
    
    const uploadPromises = filesToProcess.map(async (fileItem, index) => {
      const metadata = formValues[index];
      let assetId: string | null = null;
      
      try {
        const response = await this.api.media.initUpload({
          name: fileItem.file.name,
          type: fileItem.file.type,
          size: fileItem.file.size,
        });
        assetId = response.assetId;

        this.filesToUpload.update(currentFiles => {
          return currentFiles.map(f => f.file === fileItem.file ? { ...f, assetId } : f);
        });

        for (let p = 0; p <= 100; p += 20) {
          await new Promise(res => setTimeout(res, 150));
          this.filesToUpload.update(currentFiles => 
            currentFiles.map(f => f.assetId === assetId ? { ...f, progress: p } : f)
          );
        }
        
        await this.api.media.completeUpload(assetId, {
          name: fileItem.file.name,
          size: fileItem.file.size,
          mimeType: fileItem.file.type,
          type: fileItem.file.type.startsWith('image') ? 'image' : (fileItem.file.type.startsWith('video') ? 'video' : 'document'),
          alt: metadata.alt,
          tags: metadata.tags.split(',').map((t: string) => t.trim()).filter(Boolean)
        });

      } catch (error) {
        console.error('Upload failed for', fileItem.file.name, error);
        this.filesToUpload.update(currentFiles =>
          currentFiles.map(f => f.file === fileItem.file ? { ...f, error: 'Upload failed' } : f)
        );
      }
    });

    await Promise.all(uploadPromises);

    this.isUploading.set(false);
    if (this.filesToUpload().every(f => !f.error)) {
        this.uploadComplete.emit();
    }
  }

  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const encoded = reader.result as string;
        const base64 = encoded.split(',', 2)[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  }

  async generateAltTextForFile(index: number) {
    this.altTextStates.update(states => {
      const newStates = [...states];
      newStates[index] = 'generating';
      return newStates;
    });

    const fileItem = this.filesToUpload()[index];
    if (!fileItem) return;

    try {
      const base64Data = await this.fileToBase64(fileItem.file);
      const description = await this.geminiService.generateImageAltText(base64Data, fileItem.file.type);
      
      this.filesFormArray.at(index).get('alt')?.setValue(description);
      
      this.altTextStates.update(states => {
        const newStates = [...states];
        newStates[index] = 'done';
        return newStates;
      });
    } catch (error) {
      console.error('Alt text generation failed:', error);
      this.altTextStates.update(states => {
        const newStates = [...states];
        newStates[index] = 'idle'; // Reset on error
        return newStates;
      });
    }
  }

  formatBytes(bytes: number, decimals = 2): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }
}