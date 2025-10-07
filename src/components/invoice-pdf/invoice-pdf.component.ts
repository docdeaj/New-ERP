import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Invoice, Quotation, LineItem, PurchaseOrder, Receipt } from '../../models/types';

type PdfSourceData = Invoice | Quotation | PurchaseOrder | Receipt;

interface NormalizedPdfData {
  type: 'Invoice' | 'Quotation' | 'Purchase Order' | 'Receipt';
  number: string;
  customerLabel: string;
  customerName: string;
  issueDate: string;
  dueDateLabel: string;
  dueDate: string; // Also used for Expiry Date, Expected Date, or Invoice Number for Receipts
  status: string;
  lineItems: LineItem[];
  subtotal: number;
  tax: number;
  amount: number;
  totalPaid?: number;
  balance?: number;
  accentColor: 'blue' | 'yellow' | 'green' | 'gray';
  paymentMethod?: string;
  notes?: string;
}

@Component({
  selector: 'app-invoice-pdf',
  templateUrl: './invoice-pdf.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe],
})
export class InvoicePdfComponent {
  data = input.required<PdfSourceData>();

  pdfData = computed<NormalizedPdfData>(() => {
    const doc = this.data();
    if ('invoiceNumber' in doc && 'dueDate' in doc) { // Invoice
      return {
        type: 'Invoice',
        number: doc.invoiceNumber,
        customerLabel: 'Bill To',
        customerName: doc.customerName,
        issueDate: doc.issueDate,
        dueDateLabel: 'Due Date',
        dueDate: doc.dueDate,
        status: doc.status,
        lineItems: doc.lineItems ?? [],
        subtotal: doc.subtotal ?? (doc.amount - (doc.tax ?? 0)),
        tax: doc.tax ?? 0,
        amount: doc.amount,
        totalPaid: doc.totalPaid,
        balance: doc.balance,
        accentColor: doc.status === 'Paid' ? 'green' : 'blue',
        notes: (doc as any).notes,
      };
    } else if ('quotationNumber' in doc) { // Quotation
      return {
        type: 'Quotation',
        number: doc.quotationNumber,
        customerLabel: 'Prepared For',
        customerName: doc.customerName,
        issueDate: doc.issueDate,
        dueDateLabel: 'Valid Until',
        dueDate: doc.expiryDate,
        status: doc.status,
        lineItems: doc.lineItems ?? [],
        subtotal: doc.subtotal ?? (doc.amount - (doc.tax ?? 0)),
        tax: doc.tax ?? 0,
        amount: doc.amount,
        accentColor: 'yellow',
        notes: (doc as any).notes,
      };
    } else if ('poNumber' in doc) { // Purchase Order
        return {
            type: 'Purchase Order',
            number: doc.poNumber,
            customerLabel: 'Supplier',
            customerName: doc.supplierName,
            issueDate: doc.orderDate,
            dueDateLabel: 'Expected Date',
            dueDate: doc.expectedDate,
            status: doc.status,
            lineItems: doc.lineItems ?? [],
            subtotal: doc.subtotal ?? (doc.amount - (doc.tax ?? 0)),
            tax: doc.tax ?? 0,
            amount: doc.amount,
            accentColor: doc.status === 'Received' ? 'green' : 'gray',
            notes: (doc as any).notes,
        };
    } else { // Receipt
        return {
            type: 'Receipt',
            number: doc.receiptNumber,
            customerLabel: 'Received From',
            customerName: doc.customerName,
            issueDate: doc.paymentDate,
            dueDateLabel: 'For Invoice',
            dueDate: doc.invoiceNumber,
            status: 'Paid',
            lineItems: [{ 
              productId: doc.invoiceId, 
              productName: `Payment for Invoice ${doc.invoiceNumber}`, 
              quantity: 1, 
              unitPrice: doc.amount, 
              total: doc.amount 
            }],
            subtotal: doc.amount,
            tax: 0,
            amount: doc.amount,
            totalPaid: doc.amount,
            balance: 0,
            accentColor: 'green',
            paymentMethod: doc.method
        };
    }
  });
}
