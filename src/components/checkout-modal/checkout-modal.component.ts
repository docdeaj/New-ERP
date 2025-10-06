import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaymentFormComponent } from '../payment-form/payment-form.component';
import { ReceiptPaymentMethod } from '../../models/types';

@Component({
  selector: 'app-checkout-modal',
  templateUrl: './checkout-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, PaymentFormComponent],
})
export class CheckoutModalComponent {
  total = input.required<number>();
  close = output<void>();
  paymentComplete = output<{ method: ReceiptPaymentMethod, amountTendered: number | null }>();

  onClose() {
    this.close.emit();
  }

  onPaymentSuccess(event: { method: ReceiptPaymentMethod, amountTendered: number | null }) {
    this.paymentComplete.emit(event);
  }
}