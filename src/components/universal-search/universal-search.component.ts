import { Component, ChangeDetectionStrategy, output, signal, ElementRef, viewChild, afterNextRender, effect, computed, inject } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { HighlightPipe } from '../../pipes/highlight.pipe';
import { Invoice, Product, PurchaseOrder, RecurringExpense, Quotation } from '../../models/types';
import { InvoicePdfComponent } from '../invoice-pdf/invoice-pdf.component';
import { PdfGenerationService } from '../../services/pdf.service';

interface SearchResultItem {
  type: string;
  icon: string;
  title: string;
  secondary?: string;
  meta?: any;
  data: any;
}

interface SearchResultGroup {
  group: string;
  items: SearchResultItem[];
}

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
  
  query = signal('');
  results = signal<SearchResultGroup[]>([]);
  isLoading = signal(false);
  recents = signal<string[]>(['INV-2024-002', 'Wireless Mouse', '#po']);

  // Navigation state
  activeGroupIndex = signal(0);
  activeItemIndex = signal(0);
  focusTarget = signal<'list' | 'preview'>('list');
  previewScale = signal(1);

  // Static items
  sidebarItems: SearchResultItem[] = [
    { type: 'nav', icon: 'fa-solid fa-chart-pie', title: 'Dashboard', secondary: 'Navigate to Dashboard', data: { path: '/dashboard' } },
    { type: 'nav', icon: 'fa-solid fa-cash-register', title: 'POS', secondary: 'Navigate to Point of Sale', data: { path: '/pos' } },
  ];
  quickActions: SearchResultItem[] = [
      { type: 'action', icon: 'fa-solid fa-file-invoice-dollar', title: 'New Invoice', secondary: 'Create a new customer invoice', data: {} },
      { type: 'action', icon: 'fa-solid fa-money-bill-wave', title: 'Add Expense', secondary: 'Record a new business expense', data: {} },
      { type: 'action', icon: 'fa-solid fa-cart-shopping', title: 'New Purchase Order', secondary: 'Create a new PO for a supplier', data: {} },
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

  constructor() {
    afterNextRender(() => this.searchInput()?.nativeElement.focus());
    effect((onCleanup) => {
      const currentQuery = this.query();
      this.activeGroupIndex.set(0);
      this.activeItemIndex.set(0);
      if (currentQuery.length === 0) {
        this.results.set(this.baseResults());
        return;
      }
      this.isLoading.set(true);
      const timerId = setTimeout(() => this.performSearch(currentQuery), 150);
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
    const [invoices, products, pos, recurring, quotations] = await Promise.all([
      this.api.invoices.list({ query }),
      this.api.products.list({ query }),
      this.api.purchaseOrders.list({ query }),
      this.api.recurringExpenses.list({ query }),
      this.api.quotations.list({ query }),
    ]);

    const newResults: SearchResultGroup[] = [];

    const groupOrder = ['nav', 'action', 'invoice', 'quotation', 'recurring', 'product', 'po'];
    const dataMap: { [key: string]: any[] } = {
      nav: this.sidebarItems.filter(i => i.title.toLowerCase().includes(lowerQuery)),
      action: this.quickActions.filter(i => i.title.toLowerCase().includes(lowerQuery)),
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
     switch(type) {
      case 'nav': return item;
      case 'action': return item;
      case 'invoice': return { type, icon: 'fa-solid fa-file-invoice-dollar', title: item.invoiceNumber, secondary: item.customerName, meta: { amount: item.amount, status: item.status, date: item.dueDate }, data: item };
      case 'quotation': return { type, icon: 'fa-solid fa-file-lines', title: item.quotationNumber, secondary: item.customerName, meta: { amount: item.amount, status: item.status, date: item.expiryDate }, data: item };
      case 'product': return { type, icon: 'fa-solid fa-box', title: item.name, secondary: `SKU: ${item.sku}`, meta: { price: item.price }, data: item };
      case 'po': return { type, icon: 'fa-solid fa-cart-shopping', title: item.poNumber, secondary: item.supplierName, meta: { amount: item.amount, status: item.status, date: item.expectedDate }, data: item };
      case 'recurring': return { type, icon: 'fa-solid fa-sync', title: item.description, secondary: `Next: ${new Date(item.nextDueDate).toLocaleDateString()}`, meta: { amount: item.amount, cadence: item.cadence }, data: item };
      default: return { type: 'unknown', icon: 'fa-solid fa-question-circle', title: 'Unknown Item', data: item };
     }
  }

  onInput(event: Event) { this.query.set((event.target as HTMLInputElement).value); }
  onClose() { this.close.emit(); }
  setActive(groupIndex: number, itemIndex: number) {
    this.activeGroupIndex.set(groupIndex);
    this.activeItemIndex.set(itemIndex);
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
      if (this.focusTarget() === 'list') {
        event.preventDefault(); this.focusTarget.set('preview');
      }
    } else if (key === 'ArrowLeft') {
      if (this.focusTarget() === 'preview') {
        event.preventDefault(); this.focusTarget.set('list');
      }
    }
  }
  
  handleSelect() {
    console.log('Selected:', this.selectedItem());
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