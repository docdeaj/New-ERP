import { Component, ChangeDetectionStrategy, input, output, computed, viewChild, ElementRef, signal, effect, afterNextRender, inject } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Invoice, Quotation, PurchaseOrder, LineItem, Receipt } from '../../models/types';
import { InvoicePdfComponent } from '../invoice-pdf/invoice-pdf.component';
import { PdfGenerationService } from '../../services/pdf.service';
import { UiStateService } from '../../services/ui-state.service';

type PrintableDocument = Invoice | Quotation | PurchaseOrder | Receipt;

interface NormalizedDocumentData {
  type: 'Invoice' | 'Quotation' | 'Purchase Order' | 'Receipt';
  number: string;
  customerName: string; // or supplier name
  status: string;
  balance?: number;
}

@Component({
  selector: 'app-document-preview-modal',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe, InvoicePdfComponent],
  templateUrl: './document-preview-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocumentPreviewModalComponent {
  data = input.required<PrintableDocument>();
  close = output<void>();
  edit = output<PrintableDocument>();
  
  private pdfService = inject(PdfGenerationService);

  pdfContainer = viewChild<ElementRef<HTMLDivElement>>('pdfContainer');
  pdfWrapper = viewChild<ElementRef<HTMLDivElement>>('pdfWrapper');
  scale = signal(1);

  constructor() {
    afterNextRender(() => {
      this.calculateScale();
    });
  }

  normalizedData = computed<NormalizedDocumentData>(() => {
    const doc = this.data();
    if ('invoiceNumber' in doc && 'dueDate' in doc) {
      return { type: 'Invoice', number: doc.invoiceNumber, customerName: doc.customerName, status: doc.status, balance: doc.balance };
    } else if ('quotationNumber' in doc) {
      return { type: 'Quotation', number: doc.quotationNumber, customerName: doc.customerName, status: doc.status };
    } else if ('poNumber' in doc) { // PurchaseOrder
      return { type: 'Purchase Order', number: doc.poNumber, customerName: doc.supplierName, status: doc.status };
    } else { // Receipt
      return { type: 'Receipt', number: doc.receiptNumber, customerName: doc.customerName, status: 'Paid' };
    }
  });

  isEditable = computed(() => {
    const type = this.normalizedData().type;
    return type !== 'Receipt';
  });

  calculateScale() {
    // A slight delay to ensure rendering is complete
    setTimeout(() => {
      const container = this.pdfContainer()?.nativeElement;
      const wrapper = this.pdfWrapper()?.nativeElement;
      if (container && wrapper) {
        // A4 width in pixels is approx 794px at 96 DPI
        const contentWidth = 794; 
        const containerWidth = container.offsetWidth;
        const scale = containerWidth / contentWidth;
        this.scale.set(scale);
      }
    }, 50);
  }

  onClose() { this.close.emit(); }
  onEdit() { this.edit.emit(this.data()); }
  onDownloadPdf() { this.pdfService.generatePdf(this.data()); }

  // Type guards for template
  asInvoice(item: any): Invoice { return item as Invoice; }
  asQuotation(item: any): Quotation { return item as Quotation; }
  asPurchaseOrder(item: any): PurchaseOrder { return item as PurchaseOrder; }
  asReceipt(item: any): Receipt { return item as Receipt; }
  
  getStatusColor(status: string): string {
    switch (status?.toLowerCase()) {
      case 'paid': case 'received': case 'accepted': case 'cleared': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'pending': case 'ordered': case 'sent': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'overdue': case 'cancelled': case 'declined': case 'bounced': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'draft': case 'partial': return 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      default: return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    }
  }
}
