import { Component, ChangeDetectionStrategy, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataTableComponent, ColumnDefinition } from '../../components/data-table/data-table.component';
import { Quotation } from '../../models/types';
import { ApiService } from '../../services/api.service';
import { UiStateService } from '../../services/ui-state.service';

@Component({
  selector: 'app-quotations',
  templateUrl: './quotations.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, DataTableComponent],
})
export class QuotationsComponent {
  private api = inject(ApiService);
  private uiStateService = inject(UiStateService);
  quotations = signal<Quotation[]>([]);
  isLoading = signal(true);

  columns: ColumnDefinition<Quotation>[] = [
    { key: 'quotationNumber', label: 'Quotation #', type: 'string' },
    { key: 'customerName', label: 'Customer', type: 'avatar', avatarUrlKey: 'customerAvatarUrl' },
    { key: 'issueDate', label: 'Issue Date', type: 'date' },
    { key: 'expiryDate', label: 'Expiry Date', type: 'date' },
    { key: 'amount', label: 'Amount', type: 'currency' },
    { key: 'status', label: 'Status', type: 'chip' },
  ];

  constructor() {
    this.loadQuotations();
    effect(() => {
      this.api.dataChanged();
      this.loadQuotations();
    });
  }

  async loadQuotations() {
    this.isLoading.set(true);
    const data = await this.api.quotations.list();
    this.quotations.set(data);
    this.isLoading.set(false);
  }

  handleRowAction(event: { action: string, item: Quotation }) {
    if (event.action === 'convert-to-invoice') {
      this.uiStateService.openDrawer('new-invoice', event.item);
      this.api.updateQuotationStatus(event.item.id, 'Accepted');
    } else {
      console.log('Row Action:', event.action, 'on item:', event.item);
    }
  }

  handleBulkAction(event: { action: string, selectedIds: (string | number)[] }) {
    if (event.action === 'delete') {
      this.api.quotations.deleteMany(event.selectedIds);
    } else {
      console.log('Bulk Action:', event.action, 'on ids:', event.selectedIds);
    }
  }
  
  openAddNewQuotationDrawer() {
    this.uiStateService.openDrawer('new-quotation');
  }
}
