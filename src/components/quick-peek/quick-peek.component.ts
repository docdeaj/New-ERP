import { Component, ChangeDetectionStrategy, input, output, computed, inject } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Invoice, Product } from '../../models/types';
import { InvoicePdfComponent } from '../invoice-pdf/invoice-pdf.component';
import { PdfGenerationService } from '../../services/pdf.service';

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

  // This computed signal simplifies the template and fixes a recurring JIT compiler error
  // with the @switch fall-through syntax.
  normalizedItemType = computed(() => {
    const type = this.itemType();
    return type === 'inventory' ? 'product' : type;
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

  onClose() {
    this.close.emit();
  }

  downloadPdf() {
    if (this.normalizedItemType() === 'invoice') {
      this.pdfService.generateInvoicePdf(this.asInvoice(this.item()));
    }
  }

  asInvoice(item: any): Invoice {
    return item as Invoice;
  }

  asProduct(item: any): Product {
    return item as Product;
  }

  getStatusColor(status: string): string {
    switch (status?.toLowerCase()) {
      case 'paid': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'overdue': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'draft': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  }
}