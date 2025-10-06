import { Component, ChangeDetectionStrategy, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataTableComponent, ColumnDefinition } from '../../components/data-table/data-table.component';
import { StockTransferModalComponent } from '../../components/stock-transfer-modal/stock-transfer-modal.component';
import { InventoryItem, LocationKey } from '../../models/types';
import { ApiService } from '../../services/api.service';
import { UiStateService } from '../../services/ui-state.service';

interface DisplayInventoryItem extends InventoryItem {
  availableMainWarehouse: number;
  availableDowntownStore: number;
  availableOnline: number;
}

@Component({
  selector: 'app-inventory',
  templateUrl: './inventory.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, DataTableComponent, StockTransferModalComponent],
})
export class InventoryComponent {
  private api = inject(ApiService);
  private uiStateService = inject(UiStateService);
  inventory = signal<DisplayInventoryItem[]>([]);
  isLoading = signal(true);
  isTransferModalOpen = signal(false);
  selectedIdsForTransfer = signal<(string | number)[]>([]);

  columns: ColumnDefinition<DisplayInventoryItem>[] = [
    { key: 'productName', label: 'Product', type: 'avatar', avatarUrlKey: 'imageUrl' },
    { key: 'sku', label: 'SKU', type: 'string' },
    { key: 'availableMainWarehouse', label: 'Main Warehouse', type: 'number' },
    { key: 'availableDowntownStore', label: 'Downtown Store', type: 'number' },
    { key: 'availableOnline', label: 'Online Store', type: 'number' },
  ];

  constructor() {
    this.loadInventory();
    effect(() => {
      this.api.dataChanged();
      this.loadInventory();
    });
  }

  async loadInventory() {
    this.isLoading.set(true);
    const data = await this.api.inventory.list();
    const displayData = data.map(item => ({
      ...item,
      availableMainWarehouse: item.onHand.mainWarehouse - item.committed.mainWarehouse,
      availableDowntownStore: item.onHand.downtownStore - item.committed.downtownStore,
      availableOnline: item.onHand.online - item.committed.online,
    }));
    this.inventory.set(displayData);
    this.isLoading.set(false);
  }

  handleRowAction(event: { action: string, item: InventoryItem }) {
    console.log('Row Action:', event.action, 'on item:', event.item);
  }

  handleBulkAction(event: { action: string, selectedIds: (string | number)[] }) {
    if (event.action === 'transfer-stock') {
      this.selectedIdsForTransfer.set(event.selectedIds);
      this.isTransferModalOpen.set(true);
    }
  }
  
  async handleConfirmTransfer(event: { from: LocationKey, to: LocationKey, quantity: number | 'All' }) {
    await this.api.transferStock({
      productIds: this.selectedIdsForTransfer(),
      ...event
    });
    this.closeTransferModal();
  }

  openAddNewProductDrawer() { this.uiStateService.openDrawer('new-product'); }
  closeTransferModal() { this.isTransferModalOpen.set(false); }
}