import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { PurchaseOrder } from '../../models/types';

@Component({
  selector: 'app-po-to-stock-modal',
  templateUrl: './po-to-stock-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, CurrencyPipe],
})
export class PoToStockModalComponent {
  purchaseOrder = input.required<PurchaseOrder>();
  close = output<void>();
  confirm = output<number>();

  stockLotNumber = computed(() => {
    const po = this.purchaseOrder();
    return `LOT-${po.id}-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  });

  totalItems = computed(() => {
    return this.purchaseOrder().items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  });

  onClose() {
    this.close.emit();
  }

  onConfirm() {
    this.confirm.emit(this.purchaseOrder().id);
  }
}
