
import { Component, ChangeDetectionStrategy, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataTableComponent, ColumnDefinition } from '../../components/data-table/data-table.component';
import { PurchaseOrder } from '../../models/types';
import { ApiService } from '../../services/api.service';
import { UiStateService } from '../../services/ui-state.service';
import { PoToStockModalComponent } from '../../components/po-to-stock-modal/po-to-stock-modal.component';
import { PdfGenerationService } from '../../services/pdf.service';

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
  private pdfService = inject(PdfGenerationService);
  purchaseOrders = signal<PurchaseOrder[]>([]);
  isLoading = signal(true);
  
  isConversionModalOpen = signal(false);
  selectedPoForConversion = signal<PurchaseOrder | null>(null);

  // FIX: Corrected column definition keys to match the PurchaseOrder model.
  columns: ColumnDefinition<PurchaseOrder>[] = [
    { key: 'number', label: 'PO #', type: 'string' },
    { key: 'partyName', label: 'Supplier', type: 'string' },
    { key: 'issue_date', label: 'Order Date', type: 'date' },
    { key: 'due_date', label: 'Expected Date', type: 'date' },
    { key: 'total_lkr', label: 'Amount', type: 'currency' },
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
  
  openPreview(po: PurchaseOrder) {
    this.uiStateService.showDocumentPreview(po);
  }

  handleRowAction(event: { action: string, item: PurchaseOrder }) {
    switch (event.action) {
      case 'convert-to-stock':
        if (event.item.status === 'Ordered') {
          this.selectedPoForConversion.set(event.item);
          this.isConversionModalOpen.set(true);
        } else {
          console.warn('This PO has already been received or cancelled.');
        }
        break;
      case 'edit':
        this.uiStateService.openDrawer('new-po', event.item);
        break;
      case 'delete':
        this.deletePurchaseOrders([event.item.id]);
        break;
      case 'download-pdf':
        this.pdfService.generatePdf(event.item);
        break;
      default:
        console.log('Row Action:', event.action, 'on item:', event.item);
    }
  }
  
  async handleConfirmConversion(poId: number) {
    await this.api.convertPoToStock(poId);
    this.closeConversionModal();
  }

  handleBulkAction(event: { action: string, selectedIds: (string | number)[] }) {
    if (event.action === 'delete') {
      this.deletePurchaseOrders(event.selectedIds);
    } else if (event.action === 'export-pdf') {
        const selected = this.purchaseOrders().filter(po => event.selectedIds.includes(po.id));
        this.pdfService.generateBulkPdfZip(selected);
    } else {
      console.log('Bulk Action:', event.action, 'on ids:', event.selectedIds);
    }
  }
  
  openAddNewDrawer() {
    this.uiStateService.openDrawer('new-po');
  }
  
  closeConversionModal() {
    this.isConversionModalOpen.set(false);
    this.selectedPoForConversion.set(null);
  }

  deletePurchaseOrders(ids: (string | number)[]) {
    this.uiStateService.showConfirmation(
      'Delete Purchase Orders',
      `Are you sure you want to delete ${ids.length} PO(s)?`,
      () => {
        this.api.purchaseOrders.deleteMany(ids);
      }
    );
  }
}
