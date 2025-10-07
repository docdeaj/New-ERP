import { Component, ChangeDetectionStrategy, input, output, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { Contact } from '../../models/types';
import { CustomerPickerComponent } from '../customer-picker/customer-picker.component';
import { SupplierPickerComponent } from '../supplier-picker/supplier-picker.component';
import { DatePickerComponent } from '../date-picker/date-picker.component';

export interface ReportFilters {
  startDate?: string | null;
  endDate?: string | null;
  customer?: Contact | null;
  supplier?: Contact | null;
  category?: string | null;
}

@Component({
  selector: 'app-report-filter-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CustomerPickerComponent, SupplierPickerComponent, DatePickerComponent],
  templateUrl: './report-filter-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportFilterModalComponent {
  isOpen = input.required<boolean>();
  activeCategory = input.required<string>();
  initialFilters = input<ReportFilters | null>(null);

  close = output<void>();
  applyFilters = output<ReportFilters>();

  private fb = inject(FormBuilder);

  filterForm = this.fb.group({
    dateRange: [{ start: null, end: null } as { start: string | null; end: string | null } | null],
    customer: [null as Contact | null],
    supplier: [null as Contact | null],
    category: [''],
  });

  constructor() {
    // When the modal is opened with initial filters, patch the form
    effect(() => {
        if (this.isOpen() && this.initialFilters()) {
            const initial = this.initialFilters()!;
            this.filterForm.patchValue({
              ...initial,
              dateRange: {
                start: initial.startDate || null,
                end: initial.endDate || null,
              }
            });
        } else if (!this.isOpen()) {
            this.filterForm.reset();
        }
    });
  }

  onClose() {
    this.close.emit();
  }

  onApply() {
    if (this.filterForm.valid) {
      const { dateRange, ...rest } = this.filterForm.value;
      const filters: ReportFilters = {
        ...rest,
        startDate: dateRange?.start,
        endDate: dateRange?.end,
      };
      this.applyFilters.emit(filters);
      this.onClose();
    }
  }

  onReset() {
      this.filterForm.reset();
  }
}
