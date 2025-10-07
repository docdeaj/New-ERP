import { Component, ChangeDetectionStrategy, input, output, signal, computed, inject, effect, ElementRef, viewChild } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Product } from '../../models/types';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { HighlightPipe } from '../../pipes/highlight.pipe';

@Component({
  selector: 'app-product-picker',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe, ScrollingModule, HighlightPipe],
  templateUrl: './product-picker.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:click)': 'onDocumentClick($event)',
  }
})
export class ProductPickerComponent {
  value = input<number | null>(null); // Expecting product ID
  onSelect = output<Product>();

  private api = inject(ApiService);
  
  query = signal('');
  isDropdownOpen = signal(false);
  results = signal<Product[]>([]);
  allProducts = signal<Product[]>([]);
  isLoading = signal(false);
  activeIndex = signal(0);
  selectedProduct = signal<Product | null>(null);

  pickerContainer = viewChild<ElementRef<HTMLDivElement>>('pickerContainer');
  searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');

  activeResult = computed(() => this.results()[this.activeIndex()]);

  constructor() {
    this.fetchAllProducts();

    effect(() => {
        const selectedId = this.value();
        if (selectedId && this.allProducts().length > 0) {
            const product = this.allProducts().find(p => p.id === selectedId);
            this.selectedProduct.set(product || null);
        } else {
            this.selectedProduct.set(null);
        }
    });

    effect((onCleanup) => {
      const q = this.query().toLowerCase();
      this.activeIndex.set(0);

      const timer = setTimeout(() => {
        if (!q) {
          this.results.set(this.allProducts().slice(0, 10)); // Show some initial results
          return;
        }
        this.results.set(
          this.allProducts().filter(p => 
            p.name.toLowerCase().includes(q) || 
            p.sku.toLowerCase().includes(q)
          )
        );
      }, 150); // Debounce

      onCleanup(() => clearTimeout(timer));
    });

    effect(() => {
      if (this.isDropdownOpen() && !this.selectedProduct()) {
        setTimeout(() => this.searchInput()?.nativeElement.focus(), 0);
      }
    });
  }

  async fetchAllProducts() {
    this.isLoading.set(true);
    this.allProducts.set(await this.api.products.list());
    this.results.set(this.allProducts().slice(0, 10));
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

  selectItem(product: Product) {
    this.onSelect.emit(product);
    this.selectedProduct.set(product);
    this.query.set('');
    this.isDropdownOpen.set(false);
  }

  clearSelection(event: MouseEvent) {
    event.stopPropagation();
    this.selectedProduct.set(null);
    this.onSelect.emit(undefined); // Notify parent of clearing
    this.openDropdown();
  }

  getAvailableStock(product: Product): number {
    const onHand = Object.values(product.stock).reduce((a, b) => a + b, 0);
    const committed = Object.values(product.committed).reduce((a, b) => a + b, 0);
    return onHand - committed;
  }
}
