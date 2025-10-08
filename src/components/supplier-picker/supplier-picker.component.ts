import { Component, ChangeDetectionStrategy, input, output, signal, computed, inject, effect, ElementRef, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Contact } from '../../models/types';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { HighlightPipe } from '../../pipes/highlight.pipe';

@Component({
  selector: 'app-supplier-picker',
  standalone: true,
  imports: [CommonModule, ScrollingModule, FormsModule, HighlightPipe],
  templateUrl: './supplier-picker.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:click)': 'onDocumentClick($event)',
  }
})
export class SupplierPickerComponent {
  value = input<Contact | null>(null);
  placeholder = input('Search or add supplier...');
  onSelect = output<Contact>();
  onClear = output<void>();

  private api = inject(ApiService);
  
  query = signal('');
  isDropdownOpen = signal(false);
  results = signal<Contact[]>([]);
  allSuppliers = signal<Contact[]>([]);
  isLoading = signal(false);
  activeIndex = signal(0);
  selectedSupplier = signal<Contact | null>(null);

  pickerContainer = viewChild<ElementRef<HTMLDivElement>>('pickerContainer');
  searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');

  activeResult = computed(() => this.results()[this.activeIndex()]);

  constructor() {
    this.fetchAllSuppliers();

    effect(() => {
        const selectedId = this.value()?.id;
        if (selectedId && this.allSuppliers().length > 0) {
            const supplier = this.allSuppliers().find(p => p.id === selectedId);
            this.selectedSupplier.set(supplier || null);
        } else {
            this.selectedSupplier.set(null);
        }
    });

    effect((onCleanup) => {
      const q = this.query().toLowerCase();
      this.activeIndex.set(0);

      const timer = setTimeout(() => {
        if (!q) {
          this.results.set(this.allSuppliers().slice(0, 10)); // Show some initial results
          return;
        }
        this.results.set(
          this.allSuppliers().filter(s => 
            s.name.toLowerCase().includes(q)
          )
        );
      }, 150); // Debounce

      onCleanup(() => clearTimeout(timer));
    });

    effect(() => {
      if (this.isDropdownOpen() && !this.selectedSupplier()) {
        setTimeout(() => this.searchInput()?.nativeElement.focus(), 0);
      }
    });
  }

  async fetchAllSuppliers() {
    this.isLoading.set(true);
    const contacts = await this.api.contacts.list();
    this.allSuppliers.set(contacts.filter(c => c.type === 'Supplier'));
    this.results.set(this.allSuppliers().slice(0, 10));
    this.isLoading.set(false);
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
  }

  selectItem(supplier: Contact) {
    this.onSelect.emit(supplier);
    this.selectedSupplier.set(supplier);
    this.query.set('');
    this.isDropdownOpen.set(false);
  }

  clearSelection(event: MouseEvent) {
    event.stopPropagation();
    this.selectedSupplier.set(null);
    this.onClear.emit();
    this.openDropdown();
  }
}
