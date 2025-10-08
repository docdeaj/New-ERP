
import { Component, ChangeDetectionStrategy, input, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, ValidatorFn, AbstractControl } from '@angular/forms';
import { LocationKey } from '../../models/types';

const sameLocationValidator: ValidatorFn = (control: AbstractControl) => {
  const from = control.get('from');
  const to = control.get('to');
  return from && to && from.value === to.value ? { sameLocation: true } : null;
};

@Component({
  selector: 'app-stock-transfer-modal',
  templateUrl: './stock-transfer-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
})
export class StockTransferModalComponent {
  selectedItemIds = input.required<(string | number)[]>();
  close = output<void>();
  confirmTransfer = output<{ from: LocationKey, to: LocationKey, quantity: number | 'All' }>();

  private fb = inject(FormBuilder);
  
  locations: { key: LocationKey, name: string }[] = [
    { key: 'mainWarehouse', name: 'Main Warehouse' },
    { key: 'downtownStore', name: 'Downtown Store' },
    { key: 'online', name: 'Online Store' }
  ];

  transferForm = this.fb.group({
    from: [this.locations[0].key, Validators.required],
    to: [this.locations[1].key, Validators.required],
    quantity: ['All', Validators.required]
  }, { validators: sameLocationValidator });

  onClose() {
    this.close.emit();
  }

  onTransfer() {
    if (this.transferForm.valid) {
      const formValue = this.transferForm.value;
      const quantity = formValue.quantity === 'All' ? 'All' : Number(formValue.quantity);
      
      this.confirmTransfer.emit({
        from: formValue.from as LocationKey,
        to: formValue.to as LocationKey,
        quantity: quantity,
      });
    }
  }
}
