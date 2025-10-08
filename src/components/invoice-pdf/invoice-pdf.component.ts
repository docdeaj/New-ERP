
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

  // FIX: Corrected all property access to use snake_case from the base models.
  pdfData = computed<NormalizedPdfData>(() => {
    const doc = this.data();
    if ('balance_lkr' in doc) { // Invoice
      return {
        type: 'Invoice',
        number: doc.number,
        customerLabel: 'Bill To',
        customerName: doc.partyName || 'N/A',
        issueDate: doc.issue_date,
        dueDateLabel: 'Due Date',
        dueDate: doc.due_date,
        status: doc.status,
        lineItems: doc.items ?? [],
        subtotal: doc.subtotal_lkr,
        tax: doc.tax_lkr,
        amount: doc.total_lkr,
        totalPaid: doc.paid_lkr,
        balance: doc.balance_lkr,
        accentColor: doc.status === 'Paid' ? 'green' : 'blue',
        notes: doc.notes,
      };
    } else if ('party_id' in doc && !('balance_lkr' in doc) && doc.number.startsWith('QUO')) { // Quotation
      const quo = doc as Quotation;
      return {
        type: 'Quotation',
        number: quo.number,
        customerLabel: 'Prepared For',
        customerName: quo.partyName || 'N/A',
        issueDate: quo.issue_date,
        dueDateLabel: 'Valid Until',
        dueDate: quo.due_date,
        status: quo.status,
        lineItems: quo.items ?? [],
        subtotal: quo.subtotal_lkr,
        tax: quo.tax_lkr,
        amount: quo.total_lkr,
        accentColor: 'yellow',
        notes: quo.notes,
      };
    } else if ('party_id' in doc && !('balance_lkr' in doc) && doc.number.startsWith('PO')) { // Purchase Order
        const po = doc as PurchaseOrder;
        return {
            type: 'Purchase Order',
            number: po.number,
            customerLabel: 'Supplier',
            customerName: po.partyName || 'N/A',
            issueDate: po.issue_date,
            dueDateLabel: 'Expected Date',
            dueDate: po.due_date,
            status: po.status,
            lineItems: po.items ?? [],
            subtotal: po.subtotal_lkr,
            tax: po.tax_lkr,
            amount: po.total_lkr,
            accentColor: po.status === 'Received' ? 'green' : 'gray',
            notes: po.notes,
        };
    } else { // Receipt
        const receipt = doc as Receipt;
        return {
            type: 'Receipt',
            number: receipt.number,
            customerLabel: 'Received From',
            customerName: receipt.partyName || 'N/A',
            issueDate: receipt.issue_date,
            dueDateLabel: 'For Invoice',
            dueDate: receipt.invoice_number || 'N/A',
            status: 'Paid',
            lineItems: [{ 
              product_id: receipt.invoice_id, 
              name: `Payment for Invoice ${receipt.invoice_number}`, 
              sku: '',
              qty: 1, 
              unit_price_lkr: receipt.amount_lkr, 
            }],
            subtotal: receipt.amount_lkr,
            tax: 0,
            amount: receipt.amount_lkr,
            totalPaid: receipt.amount_lkr,
            balance: 0,
            accentColor: 'green',
            paymentMethod: receipt.method
        };
    }
  });
}
