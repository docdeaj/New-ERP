import { Component, ChangeDetectionStrategy, output, signal, ElementRef, viewChild, afterNextRender, effect, computed, inject } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { HighlightPipe } from '../../pipes/highlight.pipe';
import { Invoice, Product, PurchaseOrder, RecurringExpense, Quotation } from '../../models/types';
import { InvoicePdfComponent } from '../invoice-pdf/invoice-pdf.component';
import { PdfGenerationService } from '../../services/pdf.service';
import { UiStateService, DrawerContext } from '../../services/ui-state.service';
import { Router } from '@angular/router';
import { AnalyticsService } from '../../services/analytics.service';

interface SearchResultItem {
  type: string;
  icon: string;
  title: string;
  secondary?: string;
  meta?: any;
  data: any;
  id: string; // For aria-activedescendant
}

interface SearchResultGroup {
  group: string;
  items: SearchResultItem[];
}

type SearchFilter = 'All' | 'Invoices' | 'Quotations' | 'Products' | 'POs' | 'Recurring';

@Component({
  selector: 'app-universal-search',
  templateUrl: './universal-search.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe, HighlightPipe, InvoicePdfComponent],
  host: {
    'class': 'fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-20',
    'role': 'dialog',
    'aria-modal': 'true',
    '(keydown)': 'handleKeyboardNav($event)',
  }
})
export class UniversalSearchComponent {
  close = output<void>();
  searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');
  pdfPreviewContainer = viewChild<ElementRef<HTMLDivElement>>('pdfPreviewContainer');
  pdfPreviewWrapper = viewChild<ElementRef<HTMLDivElement>>('pdfPreviewWrapper');

  api = inject(ApiService);
  pdfService = inject(PdfGenerationService);
  uiState = inject(UiStateService);
  router = inject(Router);
  analytics = inject(AnalyticsService);
  
  query = signal('');
  results = signal<SearchResultGroup[]>([]);
  isLoading = signal(false);
  recents = signal<string[]>(['INV-2024-002', 'Wireless Mouse', '#po']);
  activeFilter = signal<SearchFilter>('All');
  filters: SearchFilter[] = ['All', 'Invoices', 'Quotations', 'Products', 'POs', 'Recurring'];

  // Navigation state
  activeGroupIndex = signal(0);
  activeItemIndex = signal(0);
  focusTarget = signal<'list' | 'preview'>('list');
  previewScale = signal(1);

  // Static items
  sidebarItems: SearchResultItem[] = [
    { id: 'nav-dashboard', type: 'nav', icon: 'fa-solid fa-chart-pie', title: 'Dashboard', secondary: 'Navigate to Dashboard', data: { path: '/dashboard' } },
    { id: 'nav-pos', type: 'nav', icon: 'fa-solid fa-cash-register', title: 'POS', secondary: 'Navigate to Point of Sale', data: { path: '/pos' } },
  ];
  quickActions: SearchResultItem[] = [
      { id: 'action-new-invoice', type: 'action', icon: 'fa-solid fa-file-invoice-dollar', title: 'New Invoice', secondary: 'Create a new customer invoice', data: {} },
      { id: 'action-add-expense', type: 'action', icon: 'fa-solid fa-money-bill-wave', title: 'Add Expense', secondary: 'Record a new business expense', data: {} },
      { id: 'action-new-po', type: 'action', icon: 'fa-solid fa-cart-shopping', title: 'New Purchase Order', secondary: 'Create a new PO for a supplier', data: {} },
  ];
  
  baseResults = computed<SearchResultGroup[]>(() => {
    if (this.query()) return [];
    return [
      { group: 'Quick Actions', items: this.quickActions },
      { group: 'Navigation', items: this.sidebarItems },
    ]
  });

  selectedItem = computed<SearchResultItem | null>(() => {
    const res = this.results();
    const group = res[this.activeGroupIndex()];
    return group?.items[this.activeItemIndex()] ?? null;
  });

  activeItemId = computed(() => {
    const item = this.selectedItem();
    return item ? item.id : null;
  });

  constructor() {
    this.analytics.emitEvent('search_open', {});
    afterNextRender(() => this.searchInput()?.nativeElement.focus());
    effect((onCleanup) => {
      const currentQuery = this.query();
      // This effect should also depend on the filter
      this.activeFilter(); 

      this.activeGroupIndex.set(0);
      this.activeItemIndex.set(0);
      
      const timerId = setTimeout(() => {
        if (currentQuery.length === 0 && this.activeFilter() === 'All') {
          this.results.set(this.baseResults());
          this.isLoading.set(false);
          return;
        }
        this.isLoading.set(true);
        this.performSearch(currentQuery);
      }, 150);

      onCleanup(() => clearTimeout(timerId));
    });

    // Effect for scaling PDF preview
    effect(() => {
        const item = this.selectedItem();
        if ((item?.type === 'invoice' || item?.type === 'quotation') && this.pdfPreviewContainer() && this.pdfPreviewWrapper()) {
            this.calculatePdfScale();
        }
    });
  }
  
  calculatePdfScale() {
    setTimeout(() => {
      const container = this.pdfPreviewContainer()?.nativeElement;
      const wrapper = this.pdfPreviewWrapper()?.nativeElement;
      if (container && wrapper) {
        // A4 width in pixels at 96 DPI is approx 794px
        const contentWidth = 794; 
        const containerWidth = container.offsetWidth;
        const scale = containerWidth / contentWidth;
        this.previewScale.set(scale);
      }
    });
  }

  async performSearch(query: string) {
    const lowerQuery = query.toLowerCase();
    const filter = this.activeFilter();
    const [invoices, products, pos, recurring, quotations] = await Promise.all([
      (filter === 'All' || filter === 'Invoices') ? this.api.invoices.list({ query }) : Promise.resolve([]),
      (filter === 'All' || filter === 'Products') ? this.api.products.list({ query }) : Promise.resolve([]),
      (filter === 'All' || filter === 'POs') ? this.api.purchaseOrders.list({ query }) : Promise.resolve([]),
      (filter === 'All' || filter === 'Recurring') ? this.api.recurringExpenses.list({ query }) : Promise.resolve([]),
      (filter === 'All' || filter === 'Quotations') ? this.api.quotations.list({ query }) : Promise.resolve([]),
    ]);

    const newResults: SearchResultGroup[] = [];

    const groupOrder = ['nav', 'action', 'invoice', 'quotation', 'recurring', 'product', 'po'];
    const dataMap: { [key: string]: any[] } = {
      nav: (filter === 'All') ? this.sidebarItems.filter(i => i.title.toLowerCase().includes(lowerQuery)) : [],
      action: (filter === 'All') ? this.quickActions.filter(i => i.title.toLowerCase().includes(lowerQuery)) : [],
      invoice: invoices,
      quotation: quotations,
      product: products,
      po: pos,
      recurring: recurring,
    };
    
    for (const type of groupOrder) {
      if (dataMap[type] && dataMap[type].length > 0) {
        newResults.push({
          group: this.getGroupName(type),
          items: dataMap[type].map((item: any) => this.mapToSearchResult(item, type))
        });
      }
    }
    
    this.results.set(newResults);
    this.isLoading.set(false);
  }
  
  getGroupName(type: string): string {
    switch(type) {
      case 'nav': return 'Navigation';
      case 'action': return 'Quick Actions';
      case 'invoice': return 'Invoices';
      case 'quotation': return 'Quotations';
      case 'product': return 'Products';
      case 'po': return 'Purchase Orders';
      case 'recurring': return 'Recurring Expenses';
      default: return 'Results';
    }
  }

  mapToSearchResult(item: any, type: string): SearchResultItem {
     const uniquePart = (item.id || item.title).toString().replace(/\s+/g, '-');
     const id = `search-item-${type}-${uniquePart}`;
     switch(type) {
      case 'nav': return { ...item, id };
      case 'action': return { ...item, id };
      case 'invoice': return { id, type, icon: 'fa-solid fa-file-invoice-dollar', title: item.invoiceNumber, secondary: item.customerName, meta: { amount: item.amount, status: item.status, date: item.dueDate }, data: item };
      case 'quotation': return { id, type, icon: 'fa-solid fa-file-lines', title: item.quotationNumber, secondary: item.customerName, meta: { amount: item.amount, status: item.status, date: item.expiryDate }, data: item };
      case 'product': return { id, type, icon: 'fa-solid fa-box', title: item.name, secondary: `SKU: ${item.sku}`, meta: { price: item.price }, data: item };
      case 'po': return { id, type, icon: 'fa-solid fa-cart-shopping', title: item.poNumber, secondary: item.supplierName, meta: { amount: item.amount, status: item.status, date: item.expectedDate }, data: item };
      case 'recurring': return { id, type, icon: 'fa-solid fa-sync', title: item.description, secondary: `Next: ${new Date(item.nextDueDate).toLocaleDateString()}`, meta: { amount: item.amount, cadence: item.cadence }, data: item };
      default: return { id, type: 'unknown', icon: 'fa-solid fa-question-circle', title: 'Unknown Item', data: item };
     }
  }

  onInput(event: Event) { this.query.set((event.target as HTMLInputElement).value); }
  onClose() { this.close.emit(); }
  setActive(groupIndex: number, itemIndex: number) {
    this.activeGroupIndex.set(groupIndex);
    this.activeItemIndex.set(itemIndex);
  }

  selectFilter(filter: SearchFilter) {
    this.activeFilter.set(filter);
  }

  downloadPreviewPdf() {
    const item = this.selectedItem();
    if (item?.type === 'invoice' || item?.type === 'quotation') {
      this.pdfService.generatePdf(item.data);
    }
  }

  handleKeyboardNav(event: KeyboardEvent) {
    const key = event.key;
    if (key === 'ArrowDown') { event.preventDefault(); this.navigateDown(); }
    else if (key === 'ArrowUp') { event.preventDefault(); this.navigateUp(); }
    else if (key === 'Enter') { event.preventDefault(); this.handleSelect(); }
    else if (key === 'Tab' || key === 'ArrowRight') {
      if (this.focusTarget() === 'list' && this.selectedItem()) {
        event.preventDefault(); this.focusTarget.set('preview');
      }
    } else if (key === 'ArrowLeft') {
      if (this.focusTarget() === 'preview') {
        event.preventDefault(); this.focusTarget.set('list');
      }
    }
  }
  
  handleSelect() {
    const item = this.selectedItem();
    if (!item) return;

    this.analytics.emitEvent('search_select', {
      query: this.query(),
      item_type: item.type,
      item_id: item.data.id,
      item_title: item.title,
    });

    switch (item.type) {
      case 'nav':
        this.router.navigate([item.data.path]);
        break;
      case 'action': {
        let context: DrawerContext | null = null;
        if (item.title === 'New Invoice') context = 'new-invoice';
        else if (item.title === 'Add Expense') context = 'new-expense';
        else if (item.title === 'New Purchase Order') context = 'new-po';
        if (context) this.uiState.openDrawer(context);
        break;
      }
      case 'invoice':
      case 'quotation':
      case 'po':
        this.uiState.showDocumentPreview(item.data);
        break;
      default:
        console.log('Selected item with no default action:', item);
    }
    this.onClose();
  }

  navigateDown() {
    this.focusTarget.set('list');
    const res = this.results();
    if (res.length === 0) return;
    const currentGroup = res[this.activeGroupIndex()];
    if (this.activeItemIndex() < currentGroup.items.length - 1) {
      this.activeItemIndex.update(i => i + 1);
    } else if (this.activeGroupIndex() < res.length - 1) {
      this.activeGroupIndex.update(g => g + 1);
      this.activeItemIndex.set(0);
    }
  }

  navigateUp() {
    this.focusTarget.set('list');
    if (this.activeItemIndex() > 0) {
      this.activeItemIndex.update(i => i - 1);
    } else if (this.activeGroupIndex() > 0) {
      this.activeGroupIndex.update(g => g - 1);
      this.activeItemIndex.set(this.results()[this.activeGroupIndex()].items.length - 1);
    }
  }
  
  asInvoice(item: any): Invoice { return item as Invoice; }
  asQuotation(item: any): Quotation { return item as Quotation; }
  asProduct(item: any): Product { return item as Product; }
  asPurchaseOrder(item: any): PurchaseOrder { return item as PurchaseOrder; }
  asRecurringExpense(item: any): RecurringExpense { return item as RecurringExpense; }
}