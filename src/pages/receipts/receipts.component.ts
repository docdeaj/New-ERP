

import { Component, ChangeDetectionStrategy, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataTableComponent, ColumnDefinition } from '../../components/data-table/data-table.component';
import { Receipt } from '../../models/types';
import { ApiService } from '../../services/api.service';
import { UiStateService } from '../../services/ui-state.service';
import { PdfGenerationService } from '../../services/pdf.service';

@Component({
  selector: 'app-receipts',
  templateUrl: './receipts.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, DataTableComponent],
})
export class ReceiptsComponent {
  private api = inject(ApiService);
  private uiStateService = inject(UiStateService);
  private pdfService = inject(PdfGenerationService);
  receipts = signal<Receipt[]>([]);
  isLoading = signal(true);

  // FIX: Corrected column definition keys to match the Receipt model.
  columns: ColumnDefinition<Receipt>[] = [
    { key: 'number', label: 'Receipt #', type: 'string' },
    { key: 'invoice_number', label: 'Invoice #', type: 'string' },
    { key: 'partyName', label: 'Customer', type: 'string' },
    { key: 'issue_date', label: 'Payment Date', type: 'date' },
    { key: 'amount_lkr', label: 'Amount', type: 'currency' },
    { key: 'method', label: 'Method', type: 'chip' },
  ];

  constructor() {
    this.loadReceipts();
    effect(() => {
      this.api.dataChanged();
      this.loadReceipts();
    });
  }

  async loadReceipts() {
    this.isLoading.set(true);
    const data = await this.api.receipts.list();
    this.receipts.set(data);
    this.isLoading.set(false);
  }
  
  openPreview(receipt: Receipt) {
    this.uiStateService.showDocumentPreview(receipt);
  }

  handleRowAction(event: { action: string, item: Receipt }) {
    switch (event.action) {
      case 'delete':
        this.deleteReceipts([event.item.id]);
        break;
      case 'download-pdf':
        this.pdfService.generatePdf(event.item);
        break;
      default:
        console.log('Row Action:', event.action, 'on item:', event.item);
    }
  }

  handleBulkAction(event: { action: string, selectedIds: (string | number)[] }) {
    if (event.action === 'delete') {
      this.deleteReceipts(event.selectedIds);
    } else if (event.action === 'export-pdf') {
      const selectedReceipts = this.receipts().filter(r => event.selectedIds.includes(r.id));
      if (selectedReceipts.length > 0) {
        this.pdfService.generateBulkPdfZip(selectedReceipts);
      }
    } else {
      console.log('Bulk Action:', event.action, 'on ids:', event.selectedIds);
    }
  }
  
  openAddNewReceiptDrawer() {
    this.uiStateService.openDrawer('record-payment');
  }

  deleteReceipts(ids: (string | number)[]) {
    this.uiStateService.showConfirmation(
      'Delete Receipts',
      `Are you sure you want to delete ${ids.length} receipt(s)? This may affect invoice balances.`,
      () => {
        this.api.receipts.deleteMany(ids);
      }
    );
  }
}