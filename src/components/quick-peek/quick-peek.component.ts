import { Component, ChangeDetectionStrategy, input, output, computed, inject, viewChild, ElementRef, signal, effect } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Invoice, Product, Quotation, Expense, PurchaseOrder, Contact, Receipt, Cheque, ArAgingRow, ApAgingRow, RecurringExpense } from '../../models/types';
import { InvoicePdfComponent } from '../invoice-pdf/invoice-pdf.component';
import { PdfGenerationService } from '../../services/pdf.service';
import { UiStateService, DrawerContext } from '../../services/ui-state.service';

@Component({
  selector: 'app-quick-peek',
  templateUrl: './quick-peek.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe, InvoicePdfComponent],
})
export class QuickPeekComponent {
  item = input.required<Invoice | Product | any>();
  itemType = input.required<string>(); // 'invoice', 'product', etc.
  close = output<void>();

  private pdfService = inject(PdfGenerationService);
  private uiStateService = inject(UiStateService);

  pdfPreviewContainer = viewChild<ElementRef<HTMLDivElement>>('pdfPreviewContainer');
  previewScale = signal(1);

  // This computed signal simplifies the template and fixes a recurring JIT compiler error
  // with the @switch fall-through syntax.
  normalizedItemType = computed(() => {
    const type = this.itemType();
    if (type === 'inventory' || type === 'product') return 'product';
    if (type === 'recurring-expense' || type === 'recurring-forecast') return 'expense';
    if (type === 'quotation') return 'quotation';
    if (type === 'purchase-order') return 'purchase-order';
    if (type === 'contact') return 'contact';
    if (type === 'receipt' || type === 'receipt-history') return 'receipt';
    if (type === 'cheque' || type === 'cheque-register') return 'cheque';
    if (type === 'ar-aging') return 'ar-aging';
    if (type === 'ap-aging') return 'ap-aging';
    return type;
  });

  isEditable = computed(() => {
    const type = this.normalizedItemType();
    return ['invoice', 'product', 'expense', 'contact', 'purchase-order', 'quotation', 'cheque'].includes(type);
  });

  product = computed<Product | null>(() => {
    if (this.normalizedItemType() === 'product') {
      // The item from inventory page has productName key
      const p = this.item() as any;
      if (p.productName) {
        return { ...p, name: p.productName } as Product;
      }
      return p as Product;
    }
    return null;
  });

  profitMargin = computed(() => {
    const p = this.product();
    if (p && p.price > 0 && p.cost) {
      return ((p.price - p.cost) / p.price) * 100;
    }
    return 0;
  });

  isLoss = computed(() => (this.product()?.price ?? 0) < (this.product()?.cost ?? 0));

  constructor() {
    effect(() => {
        const item = this.item();
        const type = this.normalizedItemType();
        // Using a timeout to ensure the view is rendered before we measure it.
        if (item && (type === 'invoice' || type === 'quotation' || type === 'purchase-order')) {
            setTimeout(() => this.calculatePdfScale(), 50);
        }
    });
  }

  calculatePdfScale() {
      const container = this.pdfPreviewContainer()?.nativeElement;
      if (container) {
          // A4 width in pixels at 96 DPI is approx 794px
          const contentWidth = 794; 
          const containerWidth = container.offsetWidth;
          const scale = containerWidth / contentWidth;
          this.previewScale.set(scale);
      }
  }

  onClose() {
    this.close.emit();
  }

  onEdit() {
    const type = this.normalizedItemType();
    const data = this.item();
    let context: DrawerContext | null = null;

    switch(type) {
      case 'invoice': context = 'new-invoice'; break;
      case 'product': context = 'new-product'; break;
      case 'expense': context = 'new-expense'; break;
      case 'contact': context = 'new-contact'; break;
      case 'purchase-order': context = 'new-po'; break;
      case 'quotation': context = 'new-quotation'; break;
      case 'cheque': context = 'new-cheque'; break;
    }

    if (context) {
      this.uiStateService.openDrawer(context, data);
      this.onClose(); // Close the peek view after opening the drawer
    }
  }

  downloadPdf() {
    const type = this.normalizedItemType();
    if (type === 'invoice' || type === 'quotation' || type === 'purchase-order') {
      this.pdfService.generatePdf(this.item());
    }
  }

  asInvoice(item: any): Invoice { return item as Invoice; }
  asQuotation(item: any): Quotation { return item as Quotation; }
  asProduct(item: any): Product { return item as Product; }
  asExpense(item: any): Expense | RecurringExpense { return item as Expense | RecurringExpense; }
  asPurchaseOrder(item: any): PurchaseOrder { return item as PurchaseOrder; }
  asContact(item: any): Contact { return item as Contact; }
  asReceipt(item: any): Receipt { return item as Receipt; }
  asCheque(item: any): Cheque { return item as Cheque; }
  asArAgingRow(item: any): ArAgingRow { return item as ArAgingRow; }
  asApAgingRow(item: any): ApAgingRow { return item as ApAgingRow; }

  getStatusColor(status: string): string {
    switch (status?.toLowerCase()) {
      case 'paid': case 'received': case 'cleared': case 'accepted': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'pending': case 'ordered': case 'sent': case 'monthly': case 'yearly': case 'deposited': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'overdue': case 'bounced': case 'cancelled': case 'declined': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'draft': case 'partial': return 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      default: return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    }
  }
}
