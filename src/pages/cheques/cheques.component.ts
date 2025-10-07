// FIX: This file was corrupted and incomplete. It has been recreated based on the structure of other page components.
import { Component, ChangeDetectionStrategy, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataTableComponent, ColumnDefinition } from '../../components/data-table/data-table.component';
import { Cheque } from '../../models/types';
import { ApiService } from '../../services/api.service';
import { UiStateService } from '../../services/ui-state.service';

@Component({
  selector: 'app-cheques',
  templateUrl: './cheques.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, DataTableComponent],
})
export class ChequesComponent {
  private api = inject(ApiService);
  private uiStateService = inject(UiStateService);
  cheques = signal<Cheque[]>([]);
  isLoading = signal(true);

  columns: ColumnDefinition<Cheque>[] = [
    { key: 'chequeNumber', label: 'Cheque #', type: 'string' },
    { key: 'payee', label: 'Payee', type: 'string' },
    { key: 'payer', label: 'Payer', type: 'string' },
    { key: 'bank', label: 'Bank', type: 'string' },
    { key: 'chequeDate', label: 'Cheque Date', type: 'date' },
    { key: 'amount', label: 'Amount', type: 'currency' },
    { key: 'status', label: 'Status', type: 'chip' },
  ];

  constructor() {
    this.loadCheques();
    effect(() => {
      this.api.dataChanged();
      this.loadCheques();
    });
  }

  async loadCheques() {
    this.isLoading.set(true);
    const data = await this.api.cheques.list();
    this.cheques.set(data);
    this.isLoading.set(false);
  }

  handleRowAction(event: { action: string, item: Cheque }) {
    if (event.action === 'edit') {
      this.editCheque(event.item);
    } else if (event.action === 'delete') {
      this.deleteCheques([event.item.id]);
    } else {
      console.log('Row Action:', event.action, 'on item:', event.item);
    }
  }

  handleBulkAction(event: { action: string, selectedIds: (string | number)[] }) {
    if (event.action === 'delete') {
      this.deleteCheques(event.selectedIds);
    } else {
      console.log('Bulk Action:', event.action, 'on ids:', event.selectedIds);
    }
  }
  
  openAddNewDrawer() {
    this.uiStateService.openDrawer('new-cheque');
  }

  editCheque(cheque: Cheque) {
    this.uiStateService.openDrawer('new-cheque', cheque);
  }

  deleteCheques(ids: (string | number)[]) {
    this.uiStateService.showConfirmation(
      'Delete Cheques',
      `Are you sure you want to delete ${ids.length} cheque(s)?`,
      () => {
        this.api.cheques.deleteMany(ids);
      }
    );
  }
}
