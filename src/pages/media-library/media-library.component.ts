
// FIX: Import `effect` from `@angular/core` to resolve compilation error.
import { Component, ChangeDetectionStrategy, inject, signal, OnInit, computed, effect, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { MediaItem } from '../../models/types';
import { UiStateService } from '../../services/ui-state.service';
import { UploaderModalComponent } from '../../components/uploader-modal/uploader-modal.component';

type MediaFilterType = 'image' | 'video' | 'document';

@Component({
  selector: 'app-media-library',
  templateUrl: './media-library.component.html',
  styleUrls: ['./media-library.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, UploaderModalComponent],
})
export class MediaLibraryComponent implements OnInit {
  private api = inject(ApiService);
  private uiStateService = inject(UiStateService);
  private cdr = inject(ChangeDetectorRef);

  // --- State Signals ---
  mediaItems = signal<MediaItem[]>([]);
  isLoading = signal(true);
  
  // UI State
  viewMode = signal<'grid' | 'list'>('grid');
  searchQuery = signal('');
  activeFilters = signal<Set<MediaFilterType>>(new Set());
  
  // Selection State
  selectedIds = signal<Set<string>>(new Set());
  isAllSelected = computed(() => this.filteredItems().length > 0 && this.selectedIds().size === this.filteredItems().length);
  selectionMode = computed(() => this.selectedIds().size > 0);

  // Details Panel State
  selectedItemForDetail = signal<MediaItem | null>(null);
  isSavingDetails = signal(false);
  
  // Uploader State
  isUploaderOpen = signal(false);

  // --- Computed Signals ---
  filteredItems = computed(() => {
    const allItems = this.mediaItems();
    const query = this.searchQuery().toLowerCase();
    const filters = this.activeFilters();

    return allItems.filter(item => {
      const matchesQuery = query ? item.name.toLowerCase().includes(query) || item.tags?.some(t => t.toLowerCase().includes(query)) : true;
      const matchesType = filters.size > 0 ? filters.has(item.type) : true;
      return matchesQuery && matchesType;
    });
  });

  constructor() {
    effect(() => {
      // When data changes in the API service (e.g., after deletion), reload the media.
      this.api.dataChanged();
      this.loadMedia();
    });
  }

  ngOnInit() {
    this.loadMedia();
  }

  async loadMedia() {
    this.isLoading.set(true);
    const items = await this.api.media.list();
    this.mediaItems.set(items);
    this.isLoading.set(false);
  }

  // --- Filter Methods ---
  toggleFilter(filter: MediaFilterType) {
    this.activeFilters.update(filters => {
      const newFilters = new Set(filters);
      if (newFilters.has(filter)) {
        newFilters.delete(filter);
      } else {
        newFilters.add(filter);
      }
      return newFilters;
    });
  }

  setFilter(filter: MediaFilterType | null) {
    if (filter === null) {
      this.activeFilters.set(new Set());
    } else {
      this.activeFilters.set(new Set([filter]));
    }
  }

  // --- Selection Methods ---
  toggleSelection(event: MouseEvent, id: string) {
    event.stopPropagation();
    this.selectedIds.update(currentSet => {
      const newSet = new Set(currentSet);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }

  toggleSelectAll() {
    if (this.isAllSelected()) {
      this.selectedIds.set(new Set());
    } else {
      const allIds = new Set(this.filteredItems().map(item => item.id));
      this.selectedIds.set(allIds);
    }
  }

  clearSelection() {
    this.selectedIds.set(new Set());
  }

  // --- UI Methods ---
  selectItemForDetail(item: MediaItem) {
    if (this.selectedItemForDetail()?.id === item.id) {
        this.selectedItemForDetail.set(null); // Toggle off if same item is clicked
    } else {
        this.selectedItemForDetail.set(item);
    }
  }

  closeDetailPanel() {
    this.selectedItemForDetail.set(null);
  }
  
  async saveDetails(item: MediaItem, newAlt: string, newTags: string) {
    this.isSavingDetails.set(true);
    const tagsArray = newTags.split(',').map(t => t.trim()).filter(Boolean);
    try {
        await this.api.media.update(item.id, { alt: newAlt, tags: tagsArray });
        // The effect will trigger a reload, but we can also update the local item for instant feedback
        this.selectedItemForDetail.update(current => current ? {...current, alt: newAlt, tags: tagsArray} : null);
    } catch (e) {
        console.error("Failed to save details", e);
    } finally {
        this.isSavingDetails.set(false);
    }
  }
  
  deleteSelectedItems() {
    this.uiStateService.showConfirmation(
      'Delete Media',
      `Are you sure you want to delete ${this.selectedIds().size} item(s)? This action cannot be undone.`,
      () => {
        this.api.media.deleteMany(Array.from(this.selectedIds()));
        this.clearSelection();
        this.closeDetailPanel();
      }
    );
  }
  
  deleteSingleItem(event: MouseEvent, item: MediaItem) {
    event.stopPropagation();
    this.uiStateService.showConfirmation(
      'Delete Media',
      `Are you sure you want to delete "${item.name}"? This action cannot be undone.`,
      () => {
        this.api.media.deleteMany([item.id]);
        if (this.selectedItemForDetail()?.id === item.id) {
          this.closeDetailPanel();
        }
      }
    );
  }

  // --- Utility Methods ---
  formatBytes(bytes: number, decimals = 2): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }
  
  getIconForType(type: MediaItem['type']): string {
    switch(type) {
      case 'image': return 'fa-solid fa-image';
      case 'video': return 'fa-solid fa-film';
      case 'document': return 'fa-solid fa-file-alt';
      default: return 'fa-solid fa-file';
    }
  }
}
