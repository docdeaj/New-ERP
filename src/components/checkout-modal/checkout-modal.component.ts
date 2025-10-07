import { Component, ChangeDetectionStrategy, input, output, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaymentFormComponent } from '../payment-form/payment-form.component';
import { ReceiptPaymentMethod, Contact } from '../../models/types';
import { CustomerPickerComponent } from '../customer-picker/customer-picker.component';

@Component({
  selector: 'app-checkout-modal',
  templateUrl: './checkout-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, PaymentFormComponent, CustomerPickerComponent],
})
export class CheckoutModalComponent {
  total = input.required<number>();
  customer = input<Contact | null>(null);
  close = output<void>();
  paymentComplete = output<{ method: ReceiptPaymentMethod, amountTendered: number | null, customer: Contact | null }>();

  selectedCustomer = signal<Contact | null>(null);

  constructor() {
    effect(() => {
      this.selectedCustomer.set(this.customer());
    });
  }

  onClose() {
    this.close.emit();
  }

  onPaymentSuccess(event: { method: ReceiptPaymentMethod, amountTendered: number | null }) {
    this.paymentComplete.emit({ ...event, customer: this.selectedCustomer() });
  }
}
