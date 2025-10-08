import { Component, ChangeDetectionStrategy, input, output, signal, computed, effect, inject, viewChild, ElementRef } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { UiStateService } from '../../services/ui-state.service';
import { QuickPeekComponent } from '../quick-peek/quick-peek.component';
import { AnalyticsService } from '../../services/analytics.service';

export interface ColumnDefinition<T> {
  key: keyof T;
  label: string;
  type: 'string' | 'currency' | 'date' | 'chip' | 'avatar' | 'number';
  avatarUrlKey?: keyof T;
}

export interface BulkAction {
  key: string;
  label: string;
  icon: string;
}

export interface RowAction {
  key: string;
  label: string;
  icon: string;
}

export interface EmptyStateConfig {
  title: string;
  message: string;
  actionText: string;
}


@Component({
  selector: 'app-data-table',
  templateUrl: './data-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, ScrollingModule, CurrencyPipe, DatePipe, QuickPeekComponent],
})
export class DataTableComponent<T extends { id: any, amount?: number }> {
  columns = input.required<ColumnDefinition<T>[]>();
  data = input.required<T[]>();
  context = input<string>('default'); // For context-aware actions/math
  initialSearchQuery = input<string | null>(null);
  emptyStateConfig = input<EmptyStateConfig | null>(null);
  title = input<string>('');
  description = input<string | null>(null);
  disableQuickPeek = input<boolean>(false);
  isLoading = input<boolean>(false);
  
  rowAction = output<{ action: string, item: T }>();
  bulkAction = output<{ action: string, selectedIds: (string | number)[] }>();
  emptyStateAction = output<void>();
  rowClicked = output<T>();

  // Search and Sort State
  searchQuery = signal('');
  sortColumn = signal<keyof T | null>(null);
  sortDirection = signal<'asc' | 'desc'>('asc');
  isSearchVisible = signal(false);
  isSearchAnimatingOut = signal(false);
  searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');

  // Selection State
  selectedIds = signal<Set<string | number>>(new Set());
  selectionMode = computed(() => this.selectedIds().size > 0);
  selectedCount = computed(() => this.selectedIds().size);
  isAllSelected = computed(() => this.data().length > 0 && this.selectedCount() === this.data().length);

  // Quick Peek State
  quickPeekItem = signal<T | null>(null);
  
  // Action Menu State
  isActionMenuOpen = signal<number | string | null>(null);

  // Long Press State
  private longPressTimer: any;
  private isLongPress = false; // This flag prevents click event after a long press

  private uiStateService = inject(UiStateService);
  private analytics = inject(AnalyticsService);
  
  // Accessibility IDs
  titleId = computed(() => `dt-title-${this.context()}`);
  descriptionId = computed(() => `dt-description-${this.context()}`);

  constructor() {
    // Effect to trigger search from global keypress
    effect(() => {
      const key = this.uiStateService.dataTableSearchTrigger();
      if (key) {
        this.isSearchVisible.set(true);
        this.searchQuery.set(key);
        this.uiStateService.dataTableSearchTrigger.set(null);
        setTimeout(() => this.searchInput()?.nativeElement.focus());
      }
    });

    // Effect to handle initial search query from input
    effect(() => {
        const initialQuery = this.initialSearchQuery();
        if (initialQuery) {
            this.searchQuery.set(initialQuery);
        }
    });
  }
  
  // Contextual Math
  selectionContextualSum = computed(() => {
    const context = this.context();
    if (context !== 'invoice' && context !== 'expense' && context !== 'quotation' && context !== 'purchase-order' && context !== 'receipt') {
      return 0;
    }
    const ids = this.selectedIds();
    if (ids.size === 0) return 0;
    
    return this.data()
      .filter(item => ids.has(item.id))
      .reduce((sum, item) => sum + (item.amount || 0), 0);
  });

  availableBulkActions = computed<BulkAction[]>(() => {
    switch (this.context()) {
      case 'inventory':
        return [
          { key: 'transfer-stock', label: 'Transfer Stock', icon: 'fa-solid fa-right-left' },
          { key: 'export-csv', label: 'Export CSV', icon: 'fa-solid fa-file-csv' },
          { key: 'delete', label: 'Delete', icon: 'fa-solid fa-trash' }
        ];
      case 'invoice':
         return [
          { key: 'mark-paid', label: 'Mark as Paid', icon: 'fa-solid fa-check-double' },
          { key: 'export-pdf', label: 'Export PDFs', icon: 'fa-solid fa-file-pdf' },
          { key: 'export-csv', label: 'Export CSV', icon: 'fa-solid fa-file-csv' },
          { key: 'delete', label: 'Delete', icon: 'fa-solid fa-trash' }
        ];
      case 'quotation':
      case 'purchase-order':
      case 'receipt':
        return [
          { key: 'export-pdf', label: 'Export PDFs', icon: 'fa-solid fa-file-pdf' },
          { key: 'export-csv', label: 'Export CSV', icon: 'fa-solid fa-file-csv' },
          { key: 'delete', label: 'Delete', icon: 'fa-solid fa-trash' }
        ];
      case 'ar-aging':
      case 'ap-aging':
      case 'cheque':
      case 'recurring-expense':
      case 'tax-summary':
      case 'contact':
      case 'expense':
        return [
            { key: 'export-csv', label: 'Export CSV', icon: 'fa-solid fa-file-csv' },
            { key: 'delete', label: 'Delete', icon: 'fa-solid fa-trash' }
        ];
      default:
        return [
          { key: 'export', label: 'Export', icon: 'fa-solid fa-download' },
          { key: 'delete', label: 'Delete', icon: 'fa-solid fa-trash' }
        ];
    }
  });
  
  availableRowActions = computed<RowAction[]>(() => {
    switch(this.context()) {
      case 'invoice':
        return [
          { key: 'record-payment', label: 'Record Payment', icon: 'fa-solid fa-money-bill-wave' },
          { key: 'download-pdf', label: 'Download PDF', icon: 'fa-solid fa-file-arrow-down' },
          { key: 'edit', label: 'Edit', icon: 'fa-solid fa-pen' },
          { key: 'delete', label: 'Delete', icon: 'fa-solid fa-trash' },
        ];
      case 'purchase-order':
        return [
           { key: 'convert-to-stock', label: 'Convert to Stock', icon: 'fa-solid fa-boxes-stacked' },
           { key: 'download-pdf', label: 'Download PDF', icon: 'fa-solid fa-file-arrow-down' },
           { key: 'edit', label: 'Edit', icon: 'fa-solid fa-pen' },
           { key: 'delete', label: 'Delete', icon: 'fa-solid fa-trash' },
        ];
      case 'quotation':
        return [
           { key: 'convert-to-invoice', label: 'Convert to Invoice', icon: 'fa-solid fa-file-invoice' },
           { key: 'download-pdf', label: 'Download PDF', icon: 'fa-solid fa-file-arrow-down' },
           { key: 'edit', label: 'Edit', icon: 'fa-solid fa-pen' },
           { key: 'delete', label: 'Delete', icon: 'fa-solid fa-trash' },
        ];
      case 'receipt':
        return [
           { key: 'download-pdf', label: 'Download PDF', icon: 'fa-solid fa-file-arrow-down' },
           { key: 'delete', label: 'Delete', icon: 'fa-solid fa-trash' },
        ];
       case 'ar-aging':
        return [
          { key: 'view-invoices', label: 'View Invoices', icon: 'fa-solid fa-arrow-up-right-from-square' },
        ];
      case 'ap-aging':
        return [
          { key: 'view-bills', label: 'View Bills', icon: 'fa-solid fa-arrow-up-right-from-square' },
        ];
       default:
        return [
           { key: 'edit', label: 'Edit', icon: 'fa-solid fa-pen' },
           { key: 'delete', label: 'Delete', icon: 'fa-solid fa-trash' },
        ];
    }
  });

  filteredAndSortedData = computed(() => {
    let dataSlice = [...this.data()];
    const query = this.searchQuery().toLowerCase();
    if (query) {
      dataSlice = dataSlice.filter(item => 
        this.columns().some(col => String(item[col.key]).toLowerCase().includes(query))
      );
    }
    const col = this.sortColumn();
    if (col) {
      const dir = this.sortDirection();
      dataSlice.sort((a, b) => {
        const valA = a[col];
        const valB = b[col];
        if (valA < valB) return dir === 'asc' ? -1 : 1;
        if (valA > valB) return dir === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return dataSlice;
  });
  
  // --- Event Handlers ---

  onRowClick(item: T) {
    // If a long press just occurred, the flag will be true, and we do nothing.
    // The click event fires after mouseup, so we just ignore it.
    if (this.isLongPress) {
      return;
    }

    if (this.selectionMode()) {
      // If we are already in selection mode, a simple click toggles the item.
      this.toggleSelection(item.id);
    } else {
      if (this.disableQuickPeek()) {
        this.rowClicked.emit(item);
      } else {
        // Otherwise, a simple click opens the quick peek view.
        this.quickPeekItem.set(item);
      }
    }
  }

  onRowMouseDown(item: T) {
    // On mousedown, reset the long press flag and start the timer.
    this.isLongPress = false;
    this.longPressTimer = setTimeout(() => {
      this.isLongPress = true; // Mark that a long press has happened.
      // The primary action of a long press is to initiate selection mode.
      this.toggleSelection(item.id);
    }, 500); // Using 500ms for a more deliberate long press action.
  }
  
  // Stops the long press timer. Called on mouseup and mouseleave.
  cancelLongPress() {
    clearTimeout(this.longPressTimer);
  }

  onMenuButtonClick(event: MouseEvent, itemId: number | string) {
    event.stopPropagation();
    const willOpen = this.isActionMenuOpen() !== itemId;
    if (willOpen) {
      this.analytics.emitEvent('menu_open', {
        context: this.context(),
        entity_id: itemId
      });
    }
    this.isActionMenuOpen.update(current => current === itemId ? null : itemId);
  }
  
  onActionClick(event: MouseEvent, action: string, item: T) {
    event.stopPropagation();
    this.isActionMenuOpen.set(null);
    this.analytics.emitEvent('menu_action', {
      context: this.context(),
      action: action,
      entity_id: item.id,
    });
    this.rowAction.emit({ action, item });
  }
  
  onSearchInput(event: Event) {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  onToggleSearch() {
    if (this.isSearchVisible()) {
      this.isSearchAnimatingOut.set(true);
      setTimeout(() => {
        this.isSearchVisible.set(false);
        this.isSearchAnimatingOut.set(false);
      }, 300); // Animation duration
    } else {
      this.isSearchVisible.set(true);
      setTimeout(() => this.searchInput()?.nativeElement.focus());
    }
  }

  onBulkAction(action: string) {
    const selectedIds = Array.from(this.selectedIds());
    if (action === 'export-csv') {
      this.exportAsCsv(selectedIds);
    } else {
      this.bulkAction.emit({ action, selectedIds });
    }
  }

  onEmptyStateAction() {
    this.emptyStateAction.emit();
  }

  // --- State Changers ---

  toggleSort(columnKey: keyof T) {
    if (this.sortColumn() === columnKey) {
      this.sortDirection.update(dir => (dir === 'asc' ? 'desc' : 'asc'));
    } else {
      this.sortColumn.set(columnKey);
      this.sortDirection.set('asc');
    }
  }

  toggleSelection(id: string | number) {
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
    const allIds = this.data().map(item => item.id);
    this.selectedIds.update(currentSet => {
      if (this.isAllSelected()) {
        return new Set();
      } else {
        return new Set(allIds);
      }
    });
  }

  clearSelection() {
    this.selectedIds.set(new Set());
  }

  // --- CSV Export ---
  private exportAsCsv(selectedIds: (string | number)[]) {
    const dataToExport = selectedIds.length > 0
      ? this.data().filter(item => selectedIds.includes(item.id))
      : this.filteredAndSortedData();

    if (dataToExport.length === 0) return;

    const columns = this.columns();
    const headers = columns.map(c => c.label).join(',');
    const rows = dataToExport.map(item => {
      return columns.map(col => {
        const cellData = item[col.key];
        let value = cellData === null || cellData === undefined ? '' : String(cellData);
        // Escape quotes by doubling them and wrap the whole field in quotes if it contains a comma, quote, or newline
        if (value.includes('"') || value.includes(',') || value.includes('\n')) {
          value = `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',');
    }).join('\r\n');

    const csvContent = `${headers}\r\n${rows}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      const filename = `${this.context()}_export_${new Date().toISOString().split('T')[0]}.csv`;
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }


  // --- UI Helpers ---

  getStatusColor(status: string): string {
    switch (status?.toLowerCase()) {
      case 'paid': case 'received': case 'cleared': case 'accepted': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'pending': case 'ordered': case 'sent': case 'monthly': case 'yearly': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'overdue': case 'bounced': case 'cancelled': case 'declined': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'draft': return 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      default: return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    }
  }
}