import { Component, ChangeDetectionStrategy, input, output, signal, computed, inject, effect, ElementRef, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Contact } from '../../models/types';
import { ScrollingModule } from '@angular/cdk/scrolling';

@Component({
  selector: 'app-supplier-picker',
  standalone: true,
  imports: [CommonModule, ScrollingModule, FormsModule],
  templateUrl: './supplier-picker.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:click)': 'onDocumentClick($event)',
  }
})
export class SupplierPickerComponent {
  value = input<Contact | null>(null);
  placeholder = input('Search supplier...');
  onSelect = output<Contact>();
  onClear = output<void>();

  private api = inject(ApiService);
  
  query = signal('');
  isDropdownOpen = signal(false);
  results = signal<Contact[]>([]);
  isLoading = signal(false);
  activeIndex = signal(0);

  searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');
  pickerContainer = viewChild<ElementRef<HTMLDivElement>>('pickerContainer');

  activeResult = computed(() => this.results()[this.activeIndex()]);

  constructor() {
    effect((onCleanup) => {
      const q = this.query();
      this.activeIndex.set(0);
      const timer = setTimeout(async () => {
        this.isLoading.set(true);
        const allContacts = await this.api.contacts.list({ query: q });
        this.results.set(allContacts.filter(c => c.type === 'Supplier'));
        this.isLoading.set(false);
      }, 150);
      onCleanup(() => clearTimeout(timer));
    });

    effect(() => {
      if (this.isDropdownOpen() && !this.value()) {
        setTimeout(() => this.searchInput()?.nativeElement.focus());
      }
    });
  }
  
  onDocumentClick(event: MouseEvent) {
    if (!this.pickerContainer()?.nativeElement.contains(event.target as Node)) {
      this.isDropdownOpen.set(false);
    }
  }

  onKeyDown(event: KeyboardEvent) {
    if (!this.isDropdownOpen()) return;
    const resultsCount = this.results().length;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (resultsCount > 0) this.activeIndex.update(i => (i + 1) % resultsCount);
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (resultsCount > 0) this.activeIndex.update(i => (i - 1 + resultsCount) % resultsCount);
        break;
      case 'Enter':
        event.preventDefault();
        if (resultsCount > 0 && this.activeResult()) this.selectItem(this.activeResult());
        break;
      case 'Escape':
        this.isDropdownOpen.set(false);
        break;
    }
  }

  openDropdown() {
    this.isDropdownOpen.set(true);
    // Reset query to show all on open, which triggers the effect
    this.query.set(''); 
  }

  selectItem(supplier: Contact) {
    this.onSelect.emit(supplier);
    this.query.set('');
    this.isDropdownOpen.set(false);
  }

  clearSelection(event?: MouseEvent) {
    event?.stopPropagation();
    this.onClear.emit();
    this.query.set('');
    this.openDropdown();
  }
}
