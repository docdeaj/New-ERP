import { Component, ChangeDetectionStrategy, output, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { MediaItem } from '../../models/types';

@Component({
  selector: 'app-mini-media-browser',
  templateUrl: './mini-media-browser.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule],
})
export class MiniMediaBrowserComponent implements OnInit {
  close = output<void>();
  select = output<MediaItem>();

  private api = inject(ApiService);
  mediaItems = signal<MediaItem[]>([]);
  isLoading = signal(true);
  selectedItem = signal<MediaItem | null>(null);

  ngOnInit() {
    this.loadMedia();
  }

  async loadMedia() {
    this.isLoading.set(true);
    const items = await this.api.media.list();
    this.mediaItems.set(items);
    this.isLoading.set(false);
  }

  onItemClick(item: MediaItem) {
    this.selectedItem.set(item);
  }

  onConfirmSelection() {
    if (this.selectedItem()) {
      this.select.emit(this.selectedItem()!);
    }
  }

  onClose() {
    this.close.emit();
  }
}