import { Component, ChangeDetectionStrategy, input, output, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { ReceiptPaymentMethod } from '../../models/types';
import { DatePickerComponent } from '../date-picker/date-picker.component';

type PaymentMethod = 'Cash' | 'Card' | 'Cheque';

@Component({
  selector: 'app-payment-form',
  templateUrl: './payment-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, DatePickerComponent],
})
export class PaymentFormComponent {
  totalAmount = input.required<number>();
  paymentSuccess = output<{ method: ReceiptPaymentMethod, amountTendered: number | null }>();

  private fb = inject(FormBuilder);
  
  activeTab = signal<PaymentMethod>('Cash');
  amountTendered = signal<number | null>(null);
  isSaving = signal(false);
  today = new Date().toISOString().substring(0, 10);

  chequeForm = this.fb.group({
    chequeNumber: [''],
    bank: [''],
    chequeDate: [this.today]
  });

  changeDue = computed(() => {
    const tendered = this.amountTendered() || 0;
    const total = this.totalAmount();
    return tendered > total ? tendered - total : 0;
  });

  denominations = [5000, 2000, 1000, 500, 100, 50, 20];
  
  changeDueBreakdown = computed(() => {
    const lkrDenominations = [5000, 2000, 1000, 500, 100, 50, 20, 10, 5, 2, 1];
    let remaining = this.changeDue();
    if (remaining <= 0) return [];

    const breakdown: { value: number; count: number }[] = [];
    for (const denom of lkrDenominations) {
      if (remaining >= denom) {
        const count = Math.floor(remaining / denom);
        breakdown.push({ value: denom, count });
        remaining -= count * denom;
        if (remaining < 1) break; // Stop if remainder is less than the smallest coin
      }
    }
    return breakdown;
  });

  selectTab(tab: PaymentMethod) {
    this.activeTab.set(tab);
  }

  addDenomination(amount: number) {
    this.amountTendered.update(current => (current || 0) + amount);
  }

  setTenderedToTotal() {
    this.amountTendered.set(this.totalAmount());
  }

  onCompletePayment() {
    this.isSaving.set(true);
    // Simulate API call
    setTimeout(() => {
      this.paymentSuccess.emit({
        method: this.activeTab(),
        amountTendered: this.amountTendered()
      });
      this.isSaving.set(false);
      this.amountTendered.set(null); // Reset for next payment
    }, 500);
  }
}
