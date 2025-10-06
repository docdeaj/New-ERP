import { Component, ChangeDetectionStrategy, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DataTableComponent, ColumnDefinition } from '../../components/data-table/data-table.component';
import { Invoice } from '../../models/types';
import { ApiService } from '../../services/api.service';
import { UiStateService } from '../../services/ui-state.service';
import { PdfGenerationService } from '../../services/pdf.service';

@Component({
  selector: 'app-invoices',
  templateUrl: './invoices.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, DataTableComponent],
})
export class InvoicesComponent {
  
  private api = inject(ApiService);
  private uiStateService = inject(UiStateService);
  private router = inject(Router);
  private pdfService = inject(PdfGenerationService);
  invoices = signal<Invoice[]>([]);
  isLoading = signal(true);

  columns: ColumnDefinition<Invoice>[] = [
    { key: 'invoiceNumber', label: 'Invoice #', type: 'string' },
    { key: 'customerName', label: 'Customer', type: 'avatar', avatarUrlKey: 'customerAvatarUrl' },
    { key: 'issueDate', label: 'Issue Date', type: 'date' },
    { key: 'dueDate', label: 'Due Date', type: 'date' },
    { key: 'amount', label: 'Amount', type: 'currency' },
    { key: 'status', label: 'Status', type: 'chip' },
  ];

  constructor() {
    this.loadInvoices(); // Initial load
    effect(() => {
      // Re-load when data changes
      this.api.dataChanged();
      this.loadInvoices();
    });
  }

  async loadInvoices() {
    this.isLoading.set(true);
    const data = await this.api.invoices.list();
    this.invoices.set(data);
    this.isLoading.set(false);
  }

  handleRowAction(event: { action: string, item: Invoice }) {
    if (event.action === 'record-payment') {
      this.router.navigate(['/payment-workspace', event.item.id]);
    } else if (event.action === 'download-pdf') {
      this.pdfService.generateInvoicePdf(event.item);
    } else {
      console.log('Row Action:', event.action, 'on item:', event.item);
    }
  }

  handleBulkAction(event: { action: string, selectedIds: (string | number)[] }) {
    console.log('Bulk Action:', event.action, 'on ids:', event.selectedIds);
  }
  
  openAddNewInvoiceDrawer() {
    this.uiStateService.openDrawer('new-invoice');
  }
}