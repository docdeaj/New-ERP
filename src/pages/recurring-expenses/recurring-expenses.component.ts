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
    if (event.action === 'edit') {
      this.editExpense(event.item);
    } else if (event.action === 'delete') {
      this.deleteExpenses([event.item.id]);
    } else {
      console.log('Row Action:', event.action, 'on item:', event.item);
    }
  }

  handleBulkAction(event: { action: string, selectedIds: (string | number)[] }) {
    if (event.action === 'delete') {
      this.deleteExpenses(event.selectedIds);
    } else {
      console.log('Bulk Action:', event.action, 'on ids:', event.selectedIds);
    }
  }
  
  openAddNewExpenseDrawer() {
    this.uiStateService.openDrawer('new-expense');
  }

  editExpense(expense: RecurringExpense) {
    this.uiStateService.openDrawer('new-recurring-expense', expense);
  }

  deleteExpenses(ids: (string | number)[]) {
    this.uiStateService.showConfirmation(
      'Delete Recurring Expenses',
      `Are you sure you want to delete ${ids.length} recurring expense(s)?`,
      () => {
        this.api.recurringExpenses.deleteMany(ids);
      }
    );
  }
}
