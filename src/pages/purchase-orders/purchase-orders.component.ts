import { Component, ChangeDetectionStrategy, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataTableComponent, ColumnDefinition } from '../../components/data-table/data-table.component';
import { PurchaseOrder } from '../../models/types';
import { ApiService } from '../../services/api.service';
import { UiStateService } from '../../services/ui-state.service';
import { PoToStockModalComponent } from '../../components/po-to-stock-modal/po-to-stock-modal.component';

@Component({
  selector: 'app-purchase-orders',
  templateUrl: './purchase-orders.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, DataTableComponent, PoToStockModalComponent],
})
export class PurchaseOrdersComponent {
  private api = inject(ApiService);
  private uiStateService = inject(UiStateService);
  purchaseOrders = signal<PurchaseOrder[]>([]);
  isLoading = signal(true);
  
  isConversionModalOpen = signal(false);
  selectedPoForConversion = signal<PurchaseOrder | null>(null);

  columns: ColumnDefinition<PurchaseOrder>[] = [
    { key: 'poNumber', label: 'PO #', type: 'string' },
    { key: 'supplierName', label: 'Supplier', type: 'string' },
    { key: 'orderDate', label: 'Order Date', type: 'date' },
    { key: 'expectedDate', label: 'Expected Date', type: 'date' },
    { key: 'amount', label: 'Amount', type: 'currency' },
    { key: 'status', label: 'Status', type: 'chip' },
  ];

  constructor() {
    this.loadPurchaseOrders();
    effect(() => {
      this.api.dataChanged();
      this.loadPurchaseOrders();
    });
  }

  async loadPurchaseOrders() {
    this.isLoading.set(true);
    const data = await this.api.purchaseOrders.list();
    this.purchaseOrders.set(data);
    this.isLoading.set(false);
  }

  handleRowAction(event: { action: string, item: PurchaseOrder }) {
    if (event.action === 'convert-to-stock') {
      if (event.item.status === 'Ordered') {
        this.selectedPoForConversion.set(event.item);
        this.isConversionModalOpen.set(true);
      } else {
        // In a real app, you might show a toast message
        console.warn('This PO has already been received or cancelled.');
      }
    } else {
      console.log('Row Action:', event.action, 'on item:', event.item);
    }
  }
  
  async handleConfirmConversion(poId: number) {
    await this.api.convertPoToStock(poId);
    this.closeConversionModal();
  }

  handleBulkAction(event: { action: string, selectedIds: (string | number)[] }) {
    console.log('Bulk Action:', event.action, 'on ids:', event.selectedIds);
  }
  
  openAddNewDrawer() {
    this.uiStateService.openDrawer('new-po');
  }
  
  closeConversionModal() {
    this.isConversionModalOpen.set(false);
    this.selectedPoForConversion.set(null);
  }
}