import { Component, ChangeDetectionStrategy, input, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReceiptPaymentMethod } from '../../models/types';

type PaymentMethod = 'Cash' | 'Card' | 'Cheque';

@Component({
  selector: 'app-payment-form',
  templateUrl: './payment-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class PaymentFormComponent {
  totalAmount = input.required<number>();
  paymentSuccess = output<{ method: ReceiptPaymentMethod, amountTendered: number | null }>();

  activeTab = signal<PaymentMethod>('Cash');
  amountTendered = signal<number | null>(null);
  isSaving = signal(false);
  today = new Date().toISOString().substring(0, 10);

  changeDue = computed(() => {
    const tendered = this.amountTendered() || 0;
    const total = this.totalAmount();
    return tendered > total ? tendered - total : 0;
  });

  denominations = [5000, 2000, 1000, 500, 100, 50, 20];

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