import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { MediaItem } from '../../models/types';

@Component({
  selector: 'app-media-library',
  templateUrl: './media-library.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule],
})
export class MediaLibraryComponent implements OnInit {
  private api = inject(ApiService);
  mediaItems = signal<MediaItem[]>([]);
  isLoading = signal(true);

  ngOnInit() {
    this.loadMedia();
  }

  async loadMedia() {
    this.isLoading.set(true);
    const items = await this.api.media.list();
    this.mediaItems.set(items);
    this.isLoading.set(false);
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