import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Invoice, Quotation, LineItem } from '../../models/types';

interface NormalizedPdfData {
  type: 'Invoice' | 'Quotation';
  number: string;
  customerName: string;
  issueDate: string;
  dueDateLabel: string;
  dueDate: string;
  lineItems?: LineItem[];
  subtotal: number;
  tax: number;
  amount: number;
  totalPaid?: number;
  balance?: number;
}


@Component({
  selector: 'app-invoice-pdf',
  templateUrl: './invoice-pdf.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe],
})
export class InvoicePdfComponent {
  data = input.required<Invoice | Quotation>();

  pdfData = computed<NormalizedPdfData>(() => {
    const doc = this.data();
    if ('invoiceNumber' in doc) { // It's an Invoice
      return {
        type: 'Invoice',
        number: doc.invoiceNumber,
        customerName: doc.customerName,
        issueDate: doc.issueDate,
        dueDateLabel: 'Due Date',
        dueDate: doc.dueDate,
        lineItems: doc.lineItems,
        subtotal: doc.subtotal ?? doc.amount,
        tax: doc.tax ?? 0,
        amount: doc.amount,
        totalPaid: doc.totalPaid,
        balance: doc.balance,
      };
    } else { // It's a Quotation
      return {
        type: 'Quotation',
        number: doc.quotationNumber,
        customerName: doc.customerName,
        issueDate: doc.issueDate,
        dueDateLabel: 'Expiry Date',
        dueDate: doc.expiryDate,
        lineItems: doc.lineItems,
        subtotal: doc.subtotal ?? doc.amount,
        tax: doc.tax ?? 0,
        amount: doc.amount,
      };
    }
  });
}