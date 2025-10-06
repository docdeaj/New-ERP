import { Component, ChangeDetectionStrategy, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataTableComponent, ColumnDefinition } from '../../components/data-table/data-table.component';
import { RecurringExpense } from '../../models/types';
import { ApiService } from '../../services/api.service';
import { UiStateService } from '../../services/ui-state.service';

@Component({
  selector: 'app-recurring-expenses',
  templateUrl: './recurring-expenses.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, DataTableComponent],
})
export class RecurringExpensesComponent {
  
  private api = inject(ApiService);
  private uiStateService = inject(UiStateService);
  recurringExpenses = signal<RecurringExpense[]>([]);
  isLoading = signal(true);

  columns: ColumnDefinition<RecurringExpense>[] = [
    { key: 'description', label: 'Description', type: 'string' },
    { key: 'vendor', label: 'Vendor', type: 'string' },
    { key: 'category', label: 'Category', type: 'string' },
    { key: 'amount', label: 'Amount', type: 'currency' },
    { key: 'cadence', label: 'Cadence', type: 'chip' },
    { key: 'nextDueDate', label: 'Next Due Date', type: 'date' },
  ];

  constructor() {
    this.loadRecurringExpenses();
    effect(() => {
      this.api.dataChanged();
      this.loadRecurringExpenses();
    });
  }

  async loadRecurringExpenses() {
    this.isLoading.set(true);
    const data = await this.api.recurringExpenses.list();
    this.recurringExpenses.set(data);
    this.isLoading.set(false);
  }

  handleRowAction(event: { action: string, item: RecurringExpense }) {
    console.log('Row Action:', event.action, 'on item:', event.item);
  }

  handleBulkAction(event: { action: string, selectedIds: (string | number)[] }) {
    console.log('Bulk Action:', event.action, 'on ids:', event.selectedIds);
  }
  
  openAddNewExpenseDrawer() {
    this.uiStateService.openDrawer('new-expense');
  }
}
