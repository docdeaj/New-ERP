

import { Component, ChangeDetectionStrategy, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { DataTableComponent, ColumnDefinition, EmptyStateConfig } from '../../components/data-table/data-table.component';
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
  private route = inject(ActivatedRoute);
  private pdfService = inject(PdfGenerationService);
  invoices = signal<Invoice[]>([]);
  isLoading = signal(true);
  initialQuery = signal<string | null>(null);

  // FIX: Corrected column definition keys to match the Invoice model (snake_case).
  columns: ColumnDefinition<Invoice>[] = [
    { key: 'number', label: 'Invoice #', type: 'string' },
    { key: 'partyName', label: 'Customer', type: 'avatar', avatarUrlKey: 'partyAvatarUrl' },
    { key: 'issue_date', label: 'Issue Date', type: 'date' },
    { key: 'due_date', label: 'Due Date', type: 'date' },
    { key: 'total_lkr', label: 'Amount', type: 'currency' },
    { key: 'status', label: 'Status', type: 'chip' },
  ];

  emptyStateConfig: EmptyStateConfig = {
    title: 'No Invoices Yet',
    message: 'Get started by creating your first invoice.',
    actionText: 'Add New Invoice'
  };

  constructor() {
    this.initialQuery.set(this.route.snapshot.queryParamMap.get('q'));
    this.loadInvoices(); // Initial load
    effect(() => {
      // Re-load when data changes
      this.api.dataChanged();
      this.loadInvoices();
    });
  }

  async loadInvoices() {
    this.isLoading.set(true);
    const query = this.initialQuery() ?? undefined;
    const data = await this.api.invoices.list({ query });
    this.invoices.set(data);
    this.isLoading.set(false);
  }

  handleRowAction(event: { action: string, item: Invoice }) {
    switch (event.action) {
      case 'record-payment':
        this.router.navigate(['/payment-workspace', event.item.id]);
        break;
      case 'download-pdf':
        this.pdfService.generatePdf(event.item);
        break;
      case 'edit':
        this.uiStateService.openDrawer('new-invoice', event.item);
        break;
      case 'delete':
        this.deleteInvoices([event.item.id]);
        break;
      default:
        console.log('Row Action:', event.action, 'on item:', event.item);
    }
  }

  handleBulkAction(event: { action: string, selectedIds: (string | number)[] }) {
    if (event.action === 'delete') {
      this.deleteInvoices(event.selectedIds);
    } else if (event.action === 'export-pdf') {
        const selectedInvoices = this.invoices().filter(inv => event.selectedIds.includes(inv.id));
        this.pdfService.generateBulkPdfZip(selectedInvoices);
    } else {
      console.log('Bulk Action:', event.action, 'on ids:', event.selectedIds);
    }
  }
  
  openAddNewInvoiceDrawer() {
    this.uiStateService.openDrawer('new-invoice');
  }

  handleEmptyStateAction() {
    this.openAddNewInvoiceDrawer();
  }

  deleteInvoices(ids: (string | number)[]) {
    this.uiStateService.showConfirmation(
      'Delete Invoices',
      `Are you sure you want to delete ${ids.length} invoice(s)? This action cannot be undone.`,
      () => {
        this.api.invoices.deleteMany(ids);
      }
    );
  }
}