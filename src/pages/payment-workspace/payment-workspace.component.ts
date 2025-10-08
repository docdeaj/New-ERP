

import { Component, ChangeDetectionStrategy, inject, signal, effect, computed } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { Invoice, Receipt, ReceiptPaymentMethod } from '../../models/types';
import { PaymentFormComponent } from '../../components/payment-form/payment-form.component';
import { DataTableComponent, ColumnDefinition } from '../../components/data-table/data-table.component';
import { PdfGenerationService } from '../../services/pdf.service';

@Component({
  selector: 'app-payment-workspace',
  templateUrl: './payment-workspace.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, RouterLink, PaymentFormComponent, DataTableComponent, CurrencyPipe, DatePipe],
})
export class PaymentWorkspaceComponent {
  private route = inject(ActivatedRoute);
  private api = inject(ApiService);
  private pdfService = inject(PdfGenerationService);

  invoiceId = signal<string | number | null>(null);
  invoice = signal<Invoice | null>(null);
  receipts = signal<Receipt[]>([]);
  isLoading = signal(true);
  
  receiptColumns: ColumnDefinition<Receipt>[] = [
    { key: 'number', label: 'Receipt #', type: 'string' },
    { key: 'issue_date', label: 'Payment Date', type: 'date' },
    { key: 'method', label: 'Method', type: 'chip' },
    { key: 'amount_lkr', label: 'Amount', type: 'currency' },
  ];

  constructor() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('invoiceId');
      if (id) {
        this.invoiceId.set(id);
        this.loadData(id);
      }
    });

    effect(() => {
      // Listen for data changes (e.g., a new receipt is created) and reload
      this.api.dataChanged();
      const id = this.invoiceId();
      if (id) {
        this.loadData(id);
      }
    });
  }

  async loadData(invoiceId: string | number) {
    this.isLoading.set(true);
    const [invoiceData, receiptsData] = await Promise.all([
      this.api.invoices.getById(invoiceId),
      this.api.receipts.getByInvoiceId(invoiceId),
    ]);
    this.invoice.set(invoiceData || null);
    this.receipts.set(receiptsData);
    this.isLoading.set(false);
  }

  async handlePaymentSuccess(paymentDetails: { method: ReceiptPaymentMethod, amountTendered: number | null }) {
    const inv = this.invoice();
    if (!inv) return;

    await this.api.createReceipt({
      invoiceId: inv.id,
      amount: inv.balance_lkr, // Pay the remaining balance
      method: paymentDetails.method,
      paymentDate: new Date().toISOString(),
    });
    // The effect will handle reloading the data automatically
  }

  downloadInvoicePdf() {
    const inv = this.invoice();
    if (inv) {
      this.pdfService.generatePdf(inv);
    }
  }

  getStatusColor(status: string): string {
    switch (status?.toLowerCase()) {
      case 'paid': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'overdue': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  }
}