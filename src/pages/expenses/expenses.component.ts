import { Component, ChangeDetectionStrategy, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { DataTableComponent, ColumnDefinition, EmptyStateConfig } from '../../components/data-table/data-table.component';
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
  private route = inject(ActivatedRoute);
  expenses = signal<Expense[]>([]);
  isLoading = signal(true);
  initialQuery = signal<string | null>(null);

  // FIX: Completed the column definitions for the data table to match the Expense type.
  columns: ColumnDefinition<Expense>[] = [
    { key: 'category', label: 'Category', type: 'string' },
    { key: 'vendor', label: 'Vendor', type: 'string' },
    { key: 'note', label: 'Notes', type: 'string' },
    { key: 'date', label: 'Date', type: 'date' },
    { key: 'amount_lkr', label: 'Amount', type: 'currency' },
    { key: 'status', label: 'Status', type: 'chip' },
  ];

  emptyStateConfig: EmptyStateConfig = {
    title: 'No Expenses Recorded',
    message: 'Track business expenses to get a clear financial picture.',
    actionText: 'Add New Expense'
  };

  constructor() {
    this.initialQuery.set(this.route.snapshot.queryParamMap.get('q'));
    this.loadExpenses(); // Initial load
    effect(() => {
      // Re-load when data changes
      this.api.dataChanged();
      this.loadExpenses();
    });
  }

  async loadExpenses() {
    this.isLoading.set(true);
    const query = this.initialQuery() ?? undefined;
    const data = await this.api.expenses.list({ query });
    this.expenses.set(data);
    this.isLoading.set(false);
  }

  handleRowAction(event: { action: string, item: Expense }) {
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

  handleEmptyStateAction() {
    this.openAddNewExpenseDrawer();
  }

  editExpense(expense: Expense) {
    this.uiStateService.openDrawer('new-expense', expense);
  }

  deleteExpenses(ids: (string | number)[]) {
    this.uiStateService.showConfirmation(
      'Delete Expenses',
      `Are you sure you want to delete ${ids.length} expense(s)?`,
      () => {
        this.api.expenses.deleteMany(ids);
      }
    );
  }
}