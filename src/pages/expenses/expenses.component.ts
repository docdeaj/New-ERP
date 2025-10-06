import { Component, ChangeDetectionStrategy, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataTableComponent, ColumnDefinition } from '../../components/data-table/data-table.component';
import { Expense } from '../../models/types';
import { ApiService } from '../../services/api.service';
import { UiStateService } from '../../services/ui-state.service';

@Component({
  selector: 'app-expenses',
  templateUrl: './expenses.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, DataTableComponent],
})
export class ExpensesComponent {
  
  private api = inject(ApiService);
  private uiStateService = inject(UiStateService);
  expenses = signal<Expense[]>([]);
  isLoading = signal(true);

  // FIX: Completed the column definitions for the data table.
  columns: ColumnDefinition<Expense>[] = [
    { key: 'category', label: 'Category', type: 'string' },
    { key: 'vendor', label: 'Vendor', type: 'string' },
    { key: 'date', label: 'Date', type: 'date' },
    { key: 'amount', label: 'Amount', type: 'currency' },
    { key: 'status', label: 'Status', type: 'chip' },
  ];

  constructor() {
    this.loadExpenses(); // Initial load
    effect(() => {
      // Re-load when data changes
      this.api.dataChanged();
      this.loadExpenses();
    });
  }

  async loadExpenses() {
    this.isLoading.set(true);
    const data = await this.api.expenses.list();
    this.expenses.set(data);
    this.isLoading.set(false);
  }

  handleRowAction(event: { action: string, item: Expense }) {
    console.log('Row Action:', event.action, 'on item:', event.item);
  }

  handleBulkAction(event: { action: string, selectedIds: (string | number)[] }) {
    console.log('Bulk Action:', event.action, 'on ids:', event.selectedIds);
  }
  
  openAddNewExpenseDrawer() {
    this.uiStateService.openDrawer('new-expense');
  }
}
