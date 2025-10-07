import { Component, ChangeDetectionStrategy, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataTableComponent, ColumnDefinition } from '../../components/data-table/data-table.component';
import { Receipt } from '../../models/types';
import { ApiService } from '../../services/api.service';
import { UiStateService } from '../../services/ui-state.service';

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
  receipts = signal<Receipt[]>([]);
  isLoading = signal(true);

  columns: ColumnDefinition<Receipt>[] = [
    { key: 'receiptNumber', label: 'Receipt #', type: 'string' },
    { key: 'invoiceNumber', label: 'Invoice #', type: 'string' },
    { key: 'customerName', label: 'Customer', type: 'string' },
    { key: 'paymentDate', label: 'Payment Date', type: 'date' },
    { key: 'amount', label: 'Amount', type: 'currency' },
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

  handleRowAction(event: { action: string, item: Receipt }) {
    if (event.action === 'delete') {
      this.deleteReceipts([event.item.id]);
    } else {
      console.log('Row Action:', event.action, 'on item:', event.item);
    }
  }

  handleBulkAction(event: { action: string, selectedIds: (string | number)[] }) {
    if (event.action === 'delete') {
      this.deleteReceipts(event.selectedIds);
    } else {
      console.log('Bulk Action:', event.action, 'on ids:', event.selectedIds);
    }
  }
  
  openAddNewReceiptDrawer() {
    this.uiStateService.openDrawer('new-receipt');
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
